import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker } from "react-leaflet";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import PreviewLine from "../../Components/ItemUi/PreviewLine";
import { THEME } from "./itemTheme";
import { fetchItemById } from "../../services/products";
import { getUserProfileById } from "../../services/api";
import { createComment, fetchComments, reportComment } from "../../services/comments";
import { useAuth } from "../../context/AuthContext";
import "./ItemPages.css";
import CachedTileLayer from "../../Components/CachedTileLayer";

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;
const TILE_ATTR = import.meta.env.VITE_MAP_ATTRIBUTION;

function getImageSrc(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/") && trimmed.length < 200) return trimmed;

  const base = trimmed.startsWith("data:image/")
    ? trimmed.split(",").slice(1).join(",")
    : trimmed;
  if (base.includes("\\x") || base.includes("\\")) {
    const bytes = [];
    const src = base.replace(/^data:image\/\w+;base64,/, "");
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === "\\" && src[i + 1] === "x") {
        const hex = src.slice(i + 2, i + 4);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16));
          i += 3;
          continue;
        }
      }
      bytes.push(src.charCodeAt(i) & 0xff);
    }
    const binary = String.fromCharCode(...bytes);
    const b64 = btoa(binary);
    return `data:image/jpeg;base64,${b64}`;
  }

  let mime = "image/jpeg";
  if (trimmed.startsWith("iVBOR")) mime = "image/png";
  if (trimmed.startsWith("R0lGOD")) mime = "image/gif";
  if (trimmed.startsWith("UklGR")) mime = "image/webp";
  return `data:${mime};base64,${trimmed}`;
}

function isValidCoord(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export default function ItemDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [item, setItem] = useState(location.state?.item || null);
  const [loading, setLoading] = useState(!location.state?.item);
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentReportBusy, setCommentReportBusy] = useState(false);
  const [commentReportError, setCommentReportError] = useState("");
  const [commentPage, setCommentPage] = useState(0);
  const [commentSize] = useState(20);
  const [commentTotalPages, setCommentTotalPages] = useState(0);
  const [commentHasNext, setCommentHasNext] = useState(false);
  const [commentTotalItems, setCommentTotalItems] = useState(0);
  const [commentError, setCommentError] = useState("");
  const [reporterProfile, setReporterProfile] = useState(null);
  const [reporterLoading, setReporterLoading] = useState(false);
  const [reporterError, setReporterError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetchItemById(id)
      .then((data) => {
        if (!mounted) return;
        setItem(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "خطا در دریافت اطلاعات.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  async function loadComments(page = commentPage) {
    setCommentsLoading(true);
    setCommentError("");
    try {
      const res = await fetchComments(id, { page, size: commentSize });
      setComments(Array.isArray(res.items) ? res.items : []);
      setCommentTotalPages(res.totalPages || 0);
      setCommentHasNext(Boolean(res.hasNext));
      setCommentTotalItems(res.totalItems || 0);
    } catch (err) {
      setComments([]);
      setCommentTotalPages(0);
      setCommentHasNext(false);
      setCommentTotalItems(0);
      setCommentError(err?.message || "خطا در دریافت نظرات.");
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadComments(commentPage);
  }, [id, commentPage, commentSize]);

  useEffect(() => {
    setCommentPage(0);
  }, [id]);

  const lat = useMemo(() => (item?.x != null ? Number(item.x) : Number.NaN), [item]);
  const lng = useMemo(() => (item?.y != null ? Number(item.y) : Number.NaN), [item]);
  const hasCoords = isValidCoord(lat) && isValidCoord(lng);
  const imageSrc = getImageSrc(item?.image || item?.raw?.image || "");
  const authorLabel = user?.name?.trim() || user?.email?.trim() || "کاربر";

  const coordsLabel = hasCoords ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "نامشخص";
  const ownerEmail = item?.relatedProfile || "";
  const currentEmail = user?.email || "";
  const isOwner = isLoggedIn && ownerEmail && ownerEmail === currentEmail;

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!isLoggedIn || !commentText.trim()) return;
    setCommentBusy(true);
    try {
      await createComment(id, {
        text: commentText.trim(),
      });
      setCommentText("");
      if (commentPage !== 0) {
        setCommentPage(0);
      } else {
        await loadComments(0);
      }
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleReportComment(commentId) {
    const cause = window.prompt("علت گزارش را وارد کنید (مثلاً: اسپم، توهین)");
    if (!cause || !cause.trim()) return;
    try {
      if (commentReportBusy) return;
      setCommentReportBusy(true);
      setCommentReportError("");
      await reportComment(id, commentId, cause.trim());
      await loadComments(commentPage);
    } catch (err) {
      setCommentReportError(err?.message || "خطا در گزارش نظر.");
    } finally {
      setCommentReportBusy(false);
    }
  }

  function getCommentAuthor(comment) {
    if (!comment) return "کاربر";
    if (typeof comment.author === "string" && comment.author.trim()) return comment.author;
    if (comment.author && typeof comment.author === "object") {
      if (typeof comment.author.name === "string" && comment.author.name.trim()) return comment.author.name;
      if (typeof comment.author.username === "string" && comment.author.username.trim()) return comment.author.username;
    }
    if (comment.user && typeof comment.user === "object") {
      if (typeof comment.user.name === "string" && comment.user.name.trim()) return comment.user.name;
      if (typeof comment.user.username === "string" && comment.user.username.trim()) return comment.user.username;
      if (typeof comment.user.email === "string" && comment.user.email.trim()) return comment.user.email;
    }
    return "کاربر";
  }

  function getCommentCreatedAt(comment) {
    const raw = comment?.createdAt || comment?.created_at || comment?.created || null;
    if (!raw) return "—";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString();
  }

  async function handleLoadReporter() {
    if (!item?.reporterId) return;
    setReporterLoading(true);
    setReporterError("");
    try {
      const profile = await getUserProfileById(item.reporterId);
      setReporterProfile(profile);
    } catch (err) {
      setReporterError(err?.message || "خطا در دریافت پروفایل.");
    } finally {
      setReporterLoading(false);
    }
  }

  const reporterName =
    reporterProfile?.name ||
    reporterProfile?.full_name ||
    reporterProfile?.user_name ||
    reporterProfile?.username ||
    "—";
  const reporterEmail =
    reporterProfile?.email ||
    reporterProfile?.user?.email ||
    reporterProfile?.user_email ||
    "—";

  function handleEdit() {
    if (!item) return;
    nav(`/items/${item.id}/edit`, { state: { item } });
  }

  function handleChat() {
    if (!item?.relatedProfile) return;
    nav(`/chat/${item.relatedProfile}`, { state: { itemId: item.id } });
  }

  return (
    <div
      {...UI_TEXT.page}
      className="item-page item-page--detail"
      style={{ ...UI_TEXT.page.style, color: THEME.text }}
    >
      <div className="item-page__content item-detail__content">
        <div className="item-detail__header">
          <button className="btn btn-outline-secondary" onClick={() => nav(-1)}>
            بازگشت
          </button>
          <h1 className="h3 m-0">جزئیات شیء</h1>
          <div className="item-detail__header-spacer" />
        </div>

        <div className="card shadow-sm item-detail__card">
          <div className="card-body">
            {loading ? (
              <div className="text-muted">در حال بارگذاری...</div>
            ) : error ? (
              <div className="text-danger">{error}</div>
            ) : item ? (
              <div className="item-detail__grid-page">
                <div className="item-detail__media">
                  <div className="item-detail__image">
                    {imageSrc ? (
                      <img src={imageSrc} alt={item.name || "item"} />
                    ) : (
                      <div className="item-detail__image--empty">تصویر موجود نیست</div>
                    )}
                  </div>

                  <div className="item-detail__map">
                    {hasCoords ? (
                      <MapContainer
                        center={[lat, lng]}
                        zoom={17}
                        minZoom={16}
                        maxZoom={18}
                        zoomControl={false}
                        scrollWheelZoom={false}
                        dragging={false}
                        doubleClickZoom={false}
                        touchZoom={false}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <CachedTileLayer url={TILE_URL} attribution={TILE_ATTR} />
                        <Marker position={[lat, lng]} />
                      </MapContainer>
                    ) : (
                      <div className="item-detail__map-empty">
                        مختصات ثبت نشده است
                      </div>
                    )}
                  </div>
                </div>

                <div className="item-detail__info">
                  <PreviewLine label="نوع" value={item.type === "LOST" ? "گمشده" : "پیداشده"} />
                  <div className="border-top" />
                  <PreviewLine label="نام" value={item.name || "—"} />
                  <div className="border-top" />
                  <PreviewLine label="دسته‌بندی" value={item.categoryLabel || "—"} />
                  <div className="border-top" />
                  <div className="item-detail__reporter">
                    <button
                      type="button"
                      className="btn item-detail__reporter-btn"
                      onClick={handleLoadReporter}
                      disabled={!item.reporterId || reporterLoading}
                    >
                      {reporterLoading ? "در حال دریافت..." : "مشاهده پروفایل گزارش‌دهنده"}
                    </button>
                    {reporterError ? (
                      <div className="text-danger small mt-2">{reporterError}</div>
                    ) : null}
                    {reporterProfile ? (
                      <div className="item-detail__reporter-card">
                        <div>
                          <strong>نام:</strong> {reporterName}
                        </div>
                        <div>
                          <strong>ایمیل:</strong> {reporterEmail}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="border-top" />
                  <PreviewLine
                    label="زمان ثبت"
                    value={<span {...UI_TEXT.ltrInline}>{item.createdAt}</span>}
                  />
                  <div className="border-top" />
                  <PreviewLine label="مختصات" value={coordsLabel} />
                  <div className="border-top" />
                  <PreviewLine label="توضیحات" value={item.description?.trim() || "—"} />
                  <div className="item-detail__actions">
                    {isOwner ? (
                      <button className="btn item-detail__action-primary" onClick={handleEdit}>
                        ویرایش شیء
                      </button>
                    ) : (
                      <button
                        className="btn item-detail__action-primary"
                        onClick={handleChat}
                        disabled={!item.relatedProfile}
                      >
                        تماس با صاحب شیء
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted">یافت نشد.</div>
            )}
          </div>
        </div>

        <div className="card shadow-sm item-detail__comments-card">
          <div className="card-header bg-white">
            <strong>نظرات</strong>
          </div>
          <div className="card-body">
            {!isLoggedIn ? (
              <div className="item-detail__comment-locked">
                برای ثبت نظر، ابتدا وارد حساب کاربری شوید.
              </div>
            ) : (
              <form className="item-detail__comment-form" onSubmit={handleSubmitComment}>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="نظر خود را بنویسید..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button className="btn item-detail__comment-btn" disabled={commentBusy || !commentText.trim()}>
                  ارسال نظر
                </button>
              </form>
            )}

            <div className="item-detail__comment-list">
              {commentsLoading ? (
                <div className="text-muted">در حال دریافت نظرات...</div>
              ) : commentError ? (
                <div className="text-danger">{commentError}</div>
              ) : comments.length === 0 ? (
                <div className="text-muted">نظری ثبت نشده است.</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="item-detail__comment">
                    <div className="item-detail__comment-header">
                      <strong>{getCommentAuthor(comment)}</strong>
                      <span className="text-muted" {...UI_TEXT.ltrInline}>
                        {getCommentCreatedAt(comment)}
                      </span>
                    </div>
                    <div className="item-detail__comment-text">{comment.text}</div>
                    <div className="item-detail__comment-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleReportComment(comment.id)}
                        disabled={commentReportBusy}
                      >
                        {commentReportBusy ? "در حال ارسال..." : "گزارش"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {commentReportError ? (
              <div className="alert alert-danger mt-3 text-end">{commentReportError}</div>
            ) : null}

            <div className="item-detail__comment-pagination">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={commentsLoading || commentPage === 0}
                onClick={() => setCommentPage((p) => Math.max(0, p - 1))}
              >
                قبلی
              </button>
              <span className="text-muted">
                صفحه {commentPage + 1} از {Math.max(commentTotalPages, 1)} • {commentTotalItems} نظر
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={commentsLoading || !commentHasNext}
                onClick={() => setCommentPage((p) => p + 1)}
              >
                بعدی
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

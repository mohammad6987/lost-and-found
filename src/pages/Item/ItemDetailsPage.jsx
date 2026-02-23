import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker } from "react-leaflet";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import PreviewLine from "../../Components/ItemUi/PreviewLine";
import { THEME } from "./itemTheme";
import { fetchItemById } from "../../services/products";
import { getUserProfileById } from "../../services/api";
import {
  createComment,
  dislikeComment,
  fetchComments,
  likeComment,
  reportComment,
} from "../../services/comments";
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

  useEffect(() => {
    let mounted = true;
    setCommentsLoading(true);
    fetchComments(id, { limit: 50, offset: 0 })
      .then((res) => {
        if (!mounted) return;
        setComments(res.results || []);
      })
      .finally(() => {
        if (!mounted) return;
        setCommentsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const lat = useMemo(() => (item?.x != null ? Number(item.x) : Number.NaN), [item]);
  const lng = useMemo(() => (item?.y != null ? Number(item.y) : Number.NaN), [item]);
  const hasCoords = isValidCoord(lat) && isValidCoord(lng);
  const imageSrc = getImageSrc(item?.image || item?.raw?.image || "");
  const authorLabel = user?.name?.trim() || user?.email?.trim() || "کاربر";

  const coordsLabel = hasCoords ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "نامشخص";

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!isLoggedIn || !commentText.trim()) return;
    setCommentBusy(true);
    try {
      const created = await createComment(id, {
        text: commentText.trim(),
        author: authorLabel,
      });
      setComments((prev) => [created, ...prev]);
      setCommentText("");
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleUpdateComment(action, commentId) {
    let updater = null;
    if (action === "like") updater = likeComment;
    if (action === "dislike") updater = dislikeComment;
    if (action === "report") updater = reportComment;
    if (!updater) return;
    const updated = await updater(id, commentId);
    if (!updated) return;
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
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
                  <PreviewLine label="نوع" value={item.type === "lost" ? "گمشده" : "پیداشده"} />
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
              ) : comments.length === 0 ? (
                <div className="text-muted">نظری ثبت نشده است.</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="item-detail__comment">
                    <div className="item-detail__comment-header">
                      <strong>{comment.author || "کاربر"}</strong>
                      <span className="text-muted" {...UI_TEXT.ltrInline}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="item-detail__comment-text">{comment.text}</div>
                    <div className="item-detail__comment-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleUpdateComment("like", comment.id)}
                      >
                        👍 {comment.likes || 0}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleUpdateComment("dislike", comment.id)}
                      >
                        👎 {comment.dislikes || 0}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleUpdateComment("report", comment.id)}
                      >
                        گزارش ({comment.reports || 0})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

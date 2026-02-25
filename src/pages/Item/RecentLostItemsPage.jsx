import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import Modal from "../../Components/ItemUi/Modal";
import PreviewLine from "../../Components/ItemUi/PreviewLine";
import { useAuth } from "../../context/AuthContext";
import { fetchProductsAsItems } from "../../services/products";
import "./ItemPages.css";

const CATEGORY_LABELS = {
  electronics: "الکترونیک",
  documents: "مدارک",
  accessories: "اکسسوری",
  phones: "موبایل",
  handbags: "کیف دستی",
  wallets: "کیف پول",
  keys: "کلید",
  id_cards: "کارت شناسایی / دانشجویی",
  laptops: "لپ‌تاپ",
  other: "سایر",
};

function EditIcon({ onClick }) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="ویرایش"
      style={{
        border: `1px solid ${THEME.border}`,
        color: THEME.primary,
      }}
    >
      ✎
    </button>
  );
}

function fmt(tsIso) {
  try {
    return new Date(tsIso).toLocaleString();
  } catch {
    return tsIso;
  }
}

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

export default function RecentLostItemsPage() {
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFromPreset, setFilterFromPreset] = useState("any");
  const [filterToPreset, setFilterToPreset] = useState("any");
  const { user } = useAuth();
  const currentUserEmail = user?.email || "";

  useEffect(() => {
    setLoadingItems(true);
    fetchProductsAsItems()
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setItems([]);
      })
      .finally(() => setLoadingItems(false));
  }, []);

  function presetToDate(preset, isFrom) {
    if (!preset || preset === "any") return null;
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    let base = now;
    if (preset === "today") base = now;
    if (preset === "7d") base = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (preset === "30d") base = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (preset === "90d") base = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const date = preset === "today" ? now : base;
    return isFrom ? startOfDay(date) : endOfDay(date);
  }

  const recentItems = useMemo(() => {
    const nameQuery = filterName.trim().toLowerCase();
    const typeQuery = filterType ? filterType.toLowerCase() : "";
    const fromDate = presetToDate(filterFromPreset, true);
    const toDate = presetToDate(filterToPreset, false);
    return items
      .filter((item) => {
        if (typeQuery && item.type !== typeQuery) return false;
        if (nameQuery && !(item.name || "").toLowerCase().includes(nameQuery)) return false;
        const createdAt = new Date(item.createdAt);
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, filterName, filterType, filterFromPreset, filterToPreset]);

  function openItem(item) {
    setSelected(item);
  }

  function closeModal() {
    setSelected(null);
  }

  function goEdit(item) {
    nav(`/items/${item.id}/edit`, { state: { item } });
  }

  function goChat(item) {
    nav(`/chat/${item.relatedProfile}`, { state: { itemId: item.id } });
  }

  function goDetails(item) {
    nav(`/items/${item.id}`, { state: { item } });
  }

  const imageSrc = selected
    ? getImageSrc(selected.image || selected.raw?.image || "")
    : "";

  return (
    <div
      {...UI_TEXT.page}
      className="item-page item-page--list"
      style={{ ...UI_TEXT.page.style, color: THEME.text }}
    >
      <div className="py-4 px-3 item-page__content">
        <div className="mx-auto" style={{ width: "100%", maxWidth: 900 }}>
          <header className="text-center mb-4">
            <h1 className="h3 mb-2">اشیای اخیر</h1>
            <div className="text-muted">
              روی هر ردیف کلیک کنید تا جزئیات را ببینید.
            </div>
          </header>

          <div className="card shadow-sm" style={{ borderColor: THEME.border }}>
            <div className="card-body p-0">
              <div className="item-list__filters">
                <details className="item-list__filter-dropdown">
                  <summary>فیلترها</summary>
                  <div className="item-list__filter-body">
                    <label className="item-list__filter-field">
                      <span>نام (شامل)</span>
                      <input
                        type="text"
                        placeholder="مثلاً کیف"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                      />
                    </label>
                    <label className="item-list__filter-field">
                      <span>نوع</span>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="">همه</option>
                        <option value="LOST">گمشده</option>
                        <option value="FOUND">پیداشده</option>
                      </select>
                    </label>
                    <label className="item-list__filter-field">
                      <span>از تاریخ</span>
                      <select
                        value={filterFromPreset}
                        onChange={(e) => setFilterFromPreset(e.target.value)}
                      >
                        <option value="any">بدون محدودیت</option>
                        <option value="today">امروز</option>
                        <option value="7d">۷ روز اخیر</option>
                        <option value="30d">۳۰ روز اخیر</option>
                        <option value="90d">۹۰ روز اخیر</option>
                      </select>
                    </label>
                    <label className="item-list__filter-field">
                      <span>تا تاریخ</span>
                      <select
                        value={filterToPreset}
                        onChange={(e) => setFilterToPreset(e.target.value)}
                      >
                        <option value="any">بدون محدودیت</option>
                        <option value="today">امروز</option>
                        <option value="7d">۷ روز اخیر</option>
                        <option value="30d">۳۰ روز اخیر</option>
                        <option value="90d">۹۰ روز اخیر</option>
                      </select>
                    </label>
                  </div>
                </details>
              </div>
              {loadingItems ? (
                <div className="item-list__skeleton">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="item-skeleton-row">
                      <div className="item-skeleton-block">
                        <div className="item-skeleton-line wide" />
                        <div className="item-skeleton-line" />
                      </div>
                      <div className="item-skeleton-pill" />
                    </div>
                  ))}
                </div>
              ) : recentItems.length === 0 ? (
                <div className="p-4 text-center text-muted">موردی وجود ندارد.</div>
              ) : (
                <div className="list-group list-group-flush item-list">
                  {recentItems.map((item) => {
                    const isOwner = item.relatedProfile === currentUserEmail;
                    const isLost = item.type === "lost";
                    const rowImageSrc = getImageSrc(item.image || item.raw?.image || "");
                    return (
                      <button
                        key={item.id}
                        className="list-group-item list-group-item-action item-list__row"
                        onClick={() => openItem(item)}
                        style={{ ...UI_TEXT.page.style }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-3 item-list__row-inner">
                          <div className="d-flex align-items-center gap-3 item-list__meta">
                            <div className="item-list__thumb">
                              {rowImageSrc ? (
                                <img src={rowImageSrc} alt={item.name || "item"} />
                              ) : (
                                <span className="item-list__thumb-placeholder">—</span>
                              )}
                            </div>
                            <div className="d-flex flex-column align-items-start">
                              <div className="item-list__title">
                                {item.name || "—"}
                              </div>
                              <div className="item-list__sub">
                                {CATEGORY_LABELS[item.category] || item.categoryLabel || "—"}
                                {" • "}
                                {fmt(item.createdAt)}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="badge"
                              style={{
                                background: isLost ? THEME.primarySoft : "#e7f8ef",
                                color: isLost ? THEME.primary : "#1f7a3e",
                                border: `1px solid ${THEME.border}`,
                              }}
                            >
                              {isLost ? "گمشده" : "پیداشده"}
                            </span>

                            {isOwner ? (
                              <EditIcon onClick={() => goEdit(item)} />
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
              )}
            </div>
<div
  className="d-flex justify-content-center py-3"
  style={{ borderTop: `1px solid ${THEME.border}` }}
>
  <button
    className="btn px-4 item-list__add-btn"
    style={{
      backgroundColor: THEME.primary,
      borderColor: THEME.primary,
      color: "#fff",
      minWidth: 220,
    }}
    onClick={() => nav("/add")}
  >
    + افزودن شیء جدید
  </button>
</div>

          </div>

          {selected ? (
            <Modal title="جزئیات شیء" onClose={closeModal}>
              <div className="item-detail__grid">
                {imageSrc ? (
                  <div className="item-detail__image">
                    <img src={imageSrc} alt={selected.name || "item"} />
                  </div>
                ) : (
                  <div className="item-detail__image item-detail__image--empty">
                    تصویر موجود نیست
                  </div>
                )}
                <div className="item-detail__info">
                  <PreviewLine label="نوع" value={selected.type === "lost" ? "گمشده" : "پیداشده"} />
                  <div className="border-top" />
                  <PreviewLine label="نام" value={selected.name || "—"} />
                  <div className="border-top" />
                  <PreviewLine
                    label="دسته‌بندی"
                    value={
                      CATEGORY_LABELS[selected.category] ||
                      selected.categoryLabel ||
                      "—"
                    }
                  />
                  <div className="border-top" />
                  <PreviewLine label="پروفایل مرتبط" value={selected.relatedProfile || "—"} />
                  <div className="border-top" />
                  <PreviewLine label="زمان ثبت" value={<span {...UI_TEXT.ltrInline}>{fmt(selected.createdAt)}</span>} />
                  <div className="border-top" />
                  <PreviewLine label="مکان" value={selected.latitude} />
                  <div className="border-top" />
                  <PreviewLine label="توضیحات" value={selected.notes?.trim() ? selected.notes : "—"} />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-outline-secondary px-4"
                  onClick={() => goDetails(selected)}
                >
                  مشاهده صفحه کامل
                </button>
                {selected.relatedProfile === currentUserEmail ? (
                  <button
                    className="btn px-4"
                    style={{
                      backgroundColor: THEME.primary,
                      borderColor: THEME.primary,
                      color: "#fff",
                    }}
                    onClick={() => goEdit(selected)}
                  >
                    ویرایش شیء
                  </button>
                ) : (
                  <button
                    className="btn px-4"
                    style={{
                      backgroundColor: THEME.primary,
                      borderColor: THEME.primary,
                      color: "#fff",
                    }}
                    onClick={() => goChat(selected)}
                  >
                    تماس با صاحب شیء
                  </button>
                )}

                {selected.relatedProfile === currentUserEmail ? (
                  <button className="btn btn-outline-secondary px-4" disabled>
                    شما صاحب این شیء هستید
                  </button>
                ) : (
                  <button className="btn btn-outline-secondary px-4" onClick={closeModal}>
                    بستن
                  </button>
                )}
                
              </div>
            </Modal>
          ) : null}
        </div>
      </div>
    </div>
  );
}

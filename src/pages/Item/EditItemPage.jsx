import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import FieldBlock from "../../Components/ItemUi/FieldBlock";
import { MOCK_ITEMS } from "../../mock/mockItems";
import "./ItemPages.css";
import { useAuth } from "../../context/AuthContext";
import { deleteItemById, patchItemById } from "../../services/api";

const CATEGORY_OPTIONS = [
  { value: "", label: "یک دسته‌بندی انتخاب کنید..." },
  { value: "phones", label: "موبایل" },
  { value: "handbags", label: "کیف دستی" },
  { value: "wallets", label: "کیف پول" },
  { value: "keys", label: "کلید" },
  { value: "id_cards", label: "کارت شناسایی / دانشجویی" },
  { value: "laptops", label: "لپ‌تاپ" },
  { value: "other", label: "سایر" },
];

export default function EditItemPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const { isLoggedIn, user } = useAuth();

  const item = useMemo(() => {
    // Prefer state (from navigation), fallback to mock lookup
    return loc.state?.item || MOCK_ITEMS.find((x) => x.id === id) || null;
  }, [loc.state, id]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [saveError, setSaveError] = useState("");

  if (!item) {
    return (
      <div {...UI_TEXT.page} style={{ ...UI_TEXT.page.style, padding: 24 }}>
        <div className="text-center text-muted">آیتم پیدا نشد.</div>
      </div>
    );
  }

  const ownerEmail = item?.relatedProfile || "";
  const currentEmail = user?.email || "";
  const isOwner = isLoggedIn && ownerEmail && ownerEmail === currentEmail;
  const isEditable = isOwner;
  const deliveredLabel = item?.type === "FOUND" ? "تحویل داده شد" : "پیدا شد";

  return (
    <div
      {...UI_TEXT.page}
      className="item-page item-page--edit"
      style={{ ...UI_TEXT.page.style, color: THEME.text }}
    >
      <div className="item-page__content item-edit item-edit__content">
        <div className="mx-auto item-edit__wrapper">
          <div className="card shadow-sm item-edit__form-card">
            <div className="item-edit__card-header">
              <header className="text-center mb-4 item-edit__header">
                <h1 className="h3 mb-2">ویرایش شیء</h1>
                <div className="text-muted">
                  مقادیر قبلی به عنوان placeholder نمایش داده می‌شوند.
                </div>
              </header>
            </div>

            <div className="card-body">
              {!isOwner ? (
                <div className="alert alert-warning text-end">
                  شما صاحب این شیء نیستید و امکان ویرایش ندارید.
                </div>
              ) : null}

              <FieldBlock title="نام شیء" htmlFor="name" hint="اگر تغییر نمی‌دهید، خالی بگذارید.">
                <input
                  id="name"
                  className={`form-control ${UI_TEXT.field.className}`}
                  style={UI_TEXT.field.style}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={item.name || "—"}
                  disabled={!isEditable}
                />
              </FieldBlock>

              <FieldBlock title="دسته‌بندی" htmlFor="category" hint="اگر تغییر نمی‌دهید، انتخاب نکنید.">
                <select
                  id="category"
                  className={`form-select ${UI_TEXT.field.className}`}
                  style={UI_TEXT.field.style}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!isEditable}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value || "empty"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FieldBlock>

              <FieldBlock title="توضیحات (اختیاری)" htmlFor="notes">
                <textarea
                  id="notes"
                  className={`form-control ${UI_TEXT.field.className}`}
                  style={UI_TEXT.field.style}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={item.notes?.trim() ? item.notes : "—"}
                  disabled={!isEditable}
                />
              </FieldBlock>

              <FieldBlock title="تصویر (اختیاری)" htmlFor="imageFile" hint="فایل تصویر را انتخاب کنید.">
                <input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  className={`form-control ${UI_TEXT.field.className}`}
                  style={UI_TEXT.field.style}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (!file) {
                      setImagePreview("");
                      setImageBase64("");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = String(reader.result || "");
                      setImagePreview(result);
                      const commaIndex = result.indexOf(",");
                      setImageBase64(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
                    };
                    reader.onerror = () => {
                      setImagePreview("");
                      setImageBase64("");
                    };
                    reader.readAsDataURL(file);
                  }}
                  disabled={!isEditable}
                />
                {imagePreview ? (
                  <div className="mt-2">
                    <img src={imagePreview} alt="پیش‌نمایش تصویر" style={{ maxWidth: "100%", height: "auto" }} />
                  </div>
                ) : null}
              </FieldBlock>

              <div className="d-flex justify-content-center gap-5 item-edit__actions">
                <button
                  className="btn px-4 item-edit__submit-btn"
                  disabled={!isEditable || saving || deleting || delivering}
                  onClick={async () => {
                    if (!isEditable || saving || deleting || delivering) return;
                    setSaveError("");
                    setSaving(true);
                    const trimmedName = name.trim();
                    const trimmedNotes = notes.trim();
                    const payload = {};
                    if (trimmedName) payload.name = trimmedName;
                    if (category) payload.category = category;
                    if (trimmedNotes) payload.notes = trimmedNotes;
                    if (imageBase64) payload.image = imageBase64;
                    try {
                      await patchItemById(item.id, payload);
                      nav("/items");
                    } catch (err) {
                      setSaveError(err?.message || "خطا در ذخیره‌سازی تغییرات.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>

                <button
                  className="btn btn-outline-success px-5 item-edit__delete-btn"
                  disabled={!isEditable || saving || deleting || delivering}
                  onClick={async () => {
                    if (!isEditable || saving || deleting || delivering) return;
                    const confirmed = window.confirm("آیا از ثبت وضعیت مطمئن هستید؟");
                    if (!confirmed) return;
                    setSaveError("");
                    setDelivering(true);
                    try {
                      await patchItemById(item.id, { status: "DELIVERED" });
                      nav("/items");
                    } catch (err) {
                      setSaveError(err?.message || "خطا در ثبت وضعیت تحویل.");
                    } finally {
                      setDelivering(false);
                    }
                  }}
                >
                  {delivering ? "در حال ثبت..." : deliveredLabel}
                </button>

                <button
                  className="btn btn-outline-danger px-5 item-edit__delete-btn"
                  disabled={!isEditable || saving || deleting || delivering}
                  onClick={async () => {
                    if (!isEditable || saving || deleting || delivering) return;
                    const confirmed = window.confirm("آیا از حذف این شیء مطمئن هستید؟");
                    if (!confirmed) return;
                    setSaveError("");
                    setDeleting(true);
                    try {
                      await deleteItemById(item.id);
                      nav("/items");
                    } catch (err) {
                      setSaveError(err?.message || "خطا در حذف آیتم.");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? "در حال حذف..." : "حذف شیء"}
                </button>

                <button className="btn btn-outline-secondary px-4 item-edit__back-btn" onClick={() => nav("/items")}>
                  بازگشت
                </button>
              </div>
              {saveError ? <div className="alert alert-danger mt-3 text-end">{saveError}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

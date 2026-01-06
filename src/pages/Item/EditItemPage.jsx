import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "../styles/theme";
import FieldBlock from "../../Components/ItemUi/FieldBlock";
import { CURRENT_USER, MOCK_ITEMS } from "../mock/mockItems";

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

  const item = useMemo(() => {
    // Prefer state (from navigation), fallback to mock lookup
    return loc.state?.item || MOCK_ITEMS.find((x) => x.id === id) || null;
  }, [loc.state, id]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  if (!item) {
    return (
      <div {...UI_TEXT.page} style={{ ...UI_TEXT.page.style, padding: 24 }}>
        <div className="text-center text-muted">آیتم پیدا نشد.</div>
      </div>
    );
  }

  const isOwner = item.relatedProfile === CURRENT_USER;

  return (
    <div {...UI_TEXT.page} style={{ ...UI_TEXT.page.style, color: THEME.text }}>
      <div className="py-4 px-3">
        <div className="mx-auto" style={{ width: "100%", maxWidth: 860 }}>
          <header className="text-center mb-4">
            <h1 className="h3 mb-2">ویرایش شیء</h1>
            <div className="text-muted">
              مقادیر قبلی به عنوان placeholder نمایش داده می‌شوند.
            </div>
          </header>

          <div className="card shadow-sm" style={{ borderColor: THEME.border }}>
            <div className="card-body">
              {!isOwner ? (
                <div className="alert alert-warning text-end">
                  شما صاحب این شیء نیستید. (در نسخه واقعی باید محدود شود)
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
                />
              </FieldBlock>

              <FieldBlock title="دسته‌بندی" htmlFor="category" hint="اگر تغییر نمی‌دهید، انتخاب نکنید.">
                <select
                  id="category"
                  className={`form-select ${UI_TEXT.field.className}`}
                  style={UI_TEXT.field.style}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                />
              </FieldBlock>

              <div className="d-flex justify-content-center gap-2 mt-2">
                <button
                  className="btn px-4"
                  style={{
                    backgroundColor: THEME.primary,
                    borderColor: THEME.primary,
                    color: "#fff",
                  }}
                  onClick={() => {
                    // no API: just show what would be sent
                    const payload = {
                      id: item.id,
                      changes: {
                        name: name.trim() || undefined,
                        category: category || undefined,
                        notes: notes.trim() || undefined,
                      },
                    };
                    console.log("EDIT payload:", payload);
                    nav("/items");
                  }}
                >
                  ذخیره تغییرات (موقت)
                </button>

                <button className="btn btn-outline-secondary px-4" onClick={() => nav("/items")}>
                  بازگشت
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import FieldBlock from "../../Components/ItemUi/FieldBlock";
import PreviewLine from "../../Components/ItemUi/PreviewLine";

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

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };
  const stroke = {
    stroke: THEME.primary,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "type":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 7h16M4 12h10M4 17h16" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path {...stroke} d="M20 12l-8 8-10-10V2h8z" />
          <circle cx="7.5" cy="7.5" r="1.5" fill={THEME.primary} />
        </svg>
      );
    case "category":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
          />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path {...stroke} d="M20 21a8 8 0 0 0-16 0" />
          <path {...stroke} d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 4h16v16H4z" />
          <path {...stroke} d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
          />
          <path {...stroke} d="M12 6v6l4 2" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0z"
          />
          <circle
            cx="12"
            cy="10"
            r="3"
            fill="none"
            stroke={THEME.primary}
            strokeWidth="2"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function AddItemPage() {
  const [type, setType] = useState("lost");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [profile, setProfile] = useState("");
  const [notes, setNotes] = useState("");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const typeLabel = useMemo(
    () => (type === "lost" ? "گمشده" : "پیداشده"),
    [type]
  );

  const errors = useMemo(() => {
    const e = {};
    if (!name.trim()) e.name = "نام شیء را وارد کنید.";
    if (!category) e.category = "یک دسته‌بندی انتخاب کنید.";
    if (!profile.trim()) e.profile = "پروفایل مرتبط را وارد کنید.";
    return e;
  }, [name, category, profile]);

  const isValid = Object.keys(errors).length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    const createdAt = new Date();
    const payload = {
      type,
      name: name.trim(),
      category,
      relatedProfile: profile.trim(),
      createdAt: createdAt.toISOString(),
      notes: notes.trim() || null,
    };

    console.log("Submitting new item:", payload);

    setName("");
    setCategory("");
    setProfile("");
    setNotes("");
  }

  const [isPrimaryHover, setIsPrimaryHover] = useState(false);

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === category)?.label ||
    (category ? category : "—");

  return (
    <div {...UI_TEXT.page} style={{ ...UI_TEXT.page.style, color: THEME.text }}>
      <div className="py-4 px-3">
        {/* Wrapper that truly centers everything */}
        <div className="mx-auto" style={{ width: "100%", maxWidth: 860 }}>
          <header className="text-center mb-4">
            <h1 className="h3 mb-2">افزودن شیء {typeLabel}</h1>
            <div className="text-muted">
              فرم ایجاد یک رکورد جدید برای سامانه اشیای گمشده و پیداشده
            </div>
          </header>

          {/* فرم */}
          <div
            className="card shadow-sm"
            style={{ width: "100%", borderColor: THEME.border }}
          >
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                {/* نوع */}
                <FieldBlock
                  title="نوع"
                  icon={<Icon name="type" />}
                  hint="اگر شیء را گم کرده‌اید «گمشده» و اگر آن را پیدا کرده‌اید «پیداشده» را انتخاب کنید."
                >
                  <div
                    className="btn-group w-100"
                    role="group"
                    aria-label="Type"
                  >
                    <input
                      type="radio"
                      className="btn-check"
                      name="type"
                      id="typeLost"
                      value="lost"
                      checked={type === "lost"}
                      onChange={() => setType("lost")}
                    />
                    <label
                      className="btn"
                      htmlFor="typeLost"
                      style={{
                        border: `1px solid ${THEME.primary}`,
                        color: type === "lost" ? "#fff" : THEME.primary,
                        backgroundColor:
                          type === "lost" ? THEME.primary : "transparent",
                      }}
                    >
                      گمشده
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="type"
                      id="typeFound"
                      value="found"
                      checked={type === "found"}
                      onChange={() => setType("found")}
                    />
                    <label
                      className="btn"
                      htmlFor="typeFound"
                      style={{
                        border: `1px solid ${THEME.primary}`,
                        color: type === "found" ? "#fff" : THEME.primary,
                        backgroundColor:
                          type === "found" ? THEME.primary : "transparent",
                      }}
                    >
                      پیداشده
                    </label>
                  </div>
                </FieldBlock>

                {/* نام شیء */}
                <FieldBlock
                  title="نام شیء"
                  icon={<Icon name="tag" />}
                  htmlFor="itemName"
                  hint={errors.name ? null : "حداکثر ۸۰ کاراکتر."}
                  error={errors.name}
                >
                  <input
                    id="itemName"
                    className={`form-control ${UI_TEXT.field.className} ${
                      errors.name ? "is-invalid" : ""
                    }`}
                    style={UI_TEXT.field.style}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: کیف پول مشکی، کارت دانشجویی، قاب ایرپاد"
                    maxLength={80}
                  />
                </FieldBlock>

                {/* دسته‌بندی */}
                <FieldBlock
                  title="دسته‌بندی"
                  icon={<Icon name="category" />}
                  htmlFor="category"
                  hint={errors.category ? null : "بعداً این مورد به enum مشترک در کل پروژه تبدیل می‌شود."}
                  error={errors.category}
                >
                  <select
                    id="category"
                    className={`form-select ${UI_TEXT.field.className} ${
                      errors.category ? "is-invalid" : ""
                    }`}
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

                {/* پروفایل مرتبط */}
                <FieldBlock
                  title="پروفایل مرتبط"
                  icon={<Icon name="user" />}
                  htmlFor="profile"
                  hint={
                    errors.profile
                      ? null
                      : "در نسخه‌های بعدی می‌توان این فیلد را از کاربر لاگین‌شده پر کرد."
                  }
                  error={errors.profile}
                >
                  <input
                    id="profile"
                    className={`form-control ${UI_TEXT.field.className} ${
                      errors.profile ? "is-invalid" : ""
                    }`}
                    style={UI_TEXT.field.style}
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    placeholder="مثلاً: نام کاربری یا ایمیل"
                    autoComplete="off"
                  />
                </FieldBlock>

                {/* مکان */}
                <FieldBlock
                  title="مکان (در محدوده دانشگاه)"
                  icon={<Icon name="map" />}
                >
                  <div
                    className="rounded p-3"
                    style={{
                      ...UI_TEXT.page.style,
                      background: THEME.primarySoft,
                      border: `1px solid ${THEME.border}`,
                    }}
                  >
                    <div className="fw-semibold">به‌زودی</div>
                    <div className="text-muted">
                      پس از اضافه شدن قابلیت نقشه، این بخش فعال خواهد شد.
                    </div>
                  </div>
                </FieldBlock>

                {/* توضیحات */}
                <FieldBlock
                  title="توضیحات (اختیاری)"
                  icon={<Icon name="note" />}
                  htmlFor="notes"
                  hint="حداکثر ۴۰۰ کاراکتر."
                >
                  <textarea
                    id="notes"
                    className={`form-control ${UI_TEXT.field.className}`}
                    style={UI_TEXT.field.style}
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="جزئیات بیشتر: رنگ، برند، محل احتمالی آخرین مشاهده و..."
                    maxLength={400}
                  />
                </FieldBlock>

                {/* دکمه‌ها */}
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="submit"
                    className="btn px-4"
                    disabled={!isValid}
                    style={{
                      backgroundColor: isPrimaryHover
                        ? THEME.primaryHover
                        : THEME.primary,
                      borderColor: isPrimaryHover
                        ? THEME.primaryHover
                        : THEME.primary,
                      color: "#fff",
                    }}
                    onMouseEnter={() => setIsPrimaryHover(true)}
                    onMouseLeave={() => setIsPrimaryHover(false)}
                  >
                    ثبت شیء {typeLabel}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => {
                      setName("");
                      setCategory("");
                      setProfile("");
                      setNotes("");
                    }}
                    style={{ borderColor: THEME.border }}
                  >
                    پاک‌سازی
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* پیش‌نمایش */}
          <div
            className="card shadow-sm mt-4"
            style={{ width: "100%", borderColor: THEME.border }}
          >
            <div className="card-header bg-white text-center">
              <div className="d-flex flex-column align-items-center gap-2">
                <strong>پیش‌نمایش</strong>

                <span
                  className="badge d-inline-flex align-items-center gap-2"
                  style={{
                    background: THEME.primarySoft,
                    color: THEME.primary,
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <Icon name="clock" />
                  <span>
                    زمان جاری:{" "}
                    <span {...UI_TEXT.ltrInline}>
                      {now.toLocaleString(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </span>
                </span>

                <div className="text-muted small">
                  این بخش نشان می‌دهد چه اطلاعاتی ذخیره خواهد شد (مکان فعلاً حذف شده است).
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="border-top" />
              <PreviewLine label="نوع" value={typeLabel} />
              <div className="border-top" />
              <PreviewLine label="نام" value={name.trim() || "—"} />
              <div className="border-top" />
              <PreviewLine label="دسته‌بندی" value={categoryLabel} />
              <div className="border-top" />
              <PreviewLine label="پروفایل مرتبط" value={profile.trim() || "—"} />
              <div className="border-top" />
              <PreviewLine label="مکان" value="به‌زودی (قابلیت نقشه)" />
              <div className="border-top" />
              <PreviewLine label="توضیحات" value={notes.trim() || "—"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

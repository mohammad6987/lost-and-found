import React, { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import FieldBlock from "../../Components/ItemUi/FieldBlock";
import PreviewLine from "../../Components/ItemUi/PreviewLine";
import "./ItemPages.css";
import { useAuth } from "../../context/AuthContext";

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

const DEFAULT_CENTER = [35.702831, 51.3516];
const MAP_DELTA = 0.0055;
const MAP_BOUNDS = [
  [DEFAULT_CENTER[0] - MAP_DELTA, DEFAULT_CENTER[1] - MAP_DELTA],
  [DEFAULT_CENTER[0] + MAP_DELTA, DEFAULT_CENTER[1] + MAP_DELTA],
];
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;
const TILE_ATTR = import.meta.env.VITE_MAP_ATTRIBUTION;

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

function clampToBounds(lat, lng, bounds) {
  const [[south, west], [north, east]] = bounds;
  return {
    lat: Math.min(Math.max(lat, south), north),
    lng: Math.min(Math.max(lng, west), east),
  };
}

function isWithinBounds(lat, lng, bounds) {
  const [[south, west], [north, east]] = bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

function MapViewUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function LocationPicker({ bounds, markerPosition, onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!isWithinBounds(lat, lng, bounds)) return;
      onPick({ x: lat, y: lng });
    },
  });

  return markerPosition ? (
    <CircleMarker
      center={markerPosition}
      radius={7}
      pathOptions={{ color: "#1f4fa3", fillColor: "#3b82f6", fillOpacity: 0.85 }}
    />
  ) : null;
}

export default function AddItemPage() {
  const { isLoggedIn, user } = useAuth();
  const [type, setType] = useState("lost");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [profile, setProfile] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [searchParams] = useSearchParams();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    const xParam = searchParams.get("x");
    const yParam = searchParams.get("y");

    if (xParam !== null && yParam !== null) {
      const nextX = Number(xParam);
      const nextY = Number(yParam);
      if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
        const nextClamped = clampToBounds(nextX, nextY, MAP_BOUNDS);
        setX(nextClamped.lat.toFixed(6));
        setY(nextClamped.lng.toFixed(6));
        return;
      }
    }

    if (xParam !== null) setX(xParam);
    if (yParam !== null) setY(yParam);
  }, [searchParams.toString()]);

  const typeLabel = useMemo(
    () => (type === "lost" ? "گمشده" : "پیداشده"),
    [type]
  );
  const profileValue = useMemo(() => {
    if (!isLoggedIn) return profile;
    return user?.name?.trim() || user?.email?.trim() || profile;
  }, [isLoggedIn, profile, user?.email, user?.name]);

  const errors = useMemo(() => {
    const e = {};
    if (!name.trim()) e.name = "نام شیء را وارد کنید.";
    if (!category) e.category = "یک دسته‌بندی انتخاب کنید.";
    if (!profileValue.trim()) e.profile = "پروفایل مرتبط را وارد کنید.";
    return e;
  }, [name, category, profileValue]);

  const isValid = Object.keys(errors).length === 0;
  const parsedX = x.trim() === "" ? Number.NaN : Number(x);
  const parsedY = y.trim() === "" ? Number.NaN : Number(y);
  const hasCoords = Number.isFinite(parsedX) && Number.isFinite(parsedY);
  const withinBounds = hasCoords
    ? isWithinBounds(parsedX, parsedY, MAP_BOUNDS)
    : true;
  const clamped = hasCoords
    ? clampToBounds(parsedX, parsedY, MAP_BOUNDS)
    : { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
  const mapCenter = hasCoords ? [clamped.lat, clamped.lng] : DEFAULT_CENTER;
  const markerPosition = hasCoords ? [clamped.lat, clamped.lng] : null;
  const locationError = hasCoords && !withinBounds ? "مختصات باید داخل محدوده دانشگاه باشد." : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLoggedIn || !isValid || locationError) return;

    const createdAt = new Date();
    const payload = {
      type,
      name: name.trim(),
      category,
      relatedProfile: profileValue.trim(),
      createdAt: createdAt.toISOString(),
      notes: notes.trim() || null,
      x: hasCoords ? clamped.lat : null,
      y: hasCoords ? clamped.lng : null,
      image: imageFile
        ? { name: imageFile.name, size: imageFile.size, type: imageFile.type }
        : null,
    };

    console.log("Submitting new item:", payload);

    setName("");
    setCategory("");
    setProfile("");
    setNotes("");
    setImageFile(null);
    setImagePreview("");
    setX("");
    setY("");
  }

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === category)?.label ||
    (category ? category : "—");
  const locationLabel = useMemo(() => {
    if (!hasCoords) return "—";
    return `${clamped.lat.toFixed(6)} , ${clamped.lng.toFixed(6)}`;
  }, [clamped.lat, clamped.lng, hasCoords]);

  const isLocked = !isLoggedIn;

  return (
    <div
      {...UI_TEXT.page}
      className="item-page item-page--add"
      style={{ ...UI_TEXT.page.style, color: THEME.text }}
    >
      <div className="item-page__content item-add item-add__content">
        <div className={`item-add__gate ${isLocked ? "is-locked" : ""}`}>
          <div className="item-add__blur">
            <div className="mx-auto item-add__wrapper">
              <div className="card shadow-sm item-add__form-card">
                <div className="item-add__card-header">
                  <header className="text-center mb-4 item-add__header">
                    <h1 className="h3 mb-2">افزودن شیء {typeLabel}</h1>
                    <div className="text-muted">
                      فرم ایجاد یک رکورد جدید برای سامانه اشیای گمشده و پیداشده
                    </div>
                  </header>

                  <div className="item-add__clock-inline">
                    <span className="badge d-inline-flex align-items-center gap-2 item-add__clock-badge">
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
                  </div>
                </div>
                <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                <FieldBlock
                  title="نوع"
                  icon={<Icon name="type" />}
                  hint="اگر شیء را گم کرده‌اید «گمشده» و اگر آن را پیدا کرده‌اید «پیداشده» را انتخاب کنید."
                >
                  <div className="btn-group w-100 item-add__type-group" role="group" aria-label="Type">
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
                      className={`btn item-add__type-btn ${type === "lost" ? "active" : ""}`}
                      htmlFor="typeLost"
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
                      className={`btn item-add__type-btn ${type === "found" ? "active" : ""}`}
                      htmlFor="typeFound"
                    >
                      پیداشده
                    </label>
                  </div>
                </FieldBlock>

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

                <FieldBlock
                  title="دسته‌بندی"
                  icon={<Icon name="category" />}
                  htmlFor="category"
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

                <FieldBlock
                  title="پروفایل مرتبط"
                  icon={<Icon name="user" />}
                  htmlFor="profile"
                  hint={
                    errors.profile
                      ? null
                      : isLoggedIn
                        ? "این فیلد از حساب کاربری شما پر شده است."
                        : "در نسخه‌های بعدی می‌توان این فیلد را از کاربر لاگین‌شده پر کرد."
                  }
                  error={errors.profile}
                >
                  <input
                    id="profile"
                    className={`form-control ${UI_TEXT.field.className} ${
                      errors.profile ? "is-invalid" : ""
                    } ${isLoggedIn ? "item-add__profile-locked" : ""}`}
                    style={UI_TEXT.field.style}
                    value={profileValue}
                    onChange={(e) => {
                      if (isLoggedIn) return;
                      setProfile(e.target.value);
                    }}
                    placeholder="مثلاً: نام کاربری یا ایمیل"
                    autoComplete="off"
                    readOnly={isLoggedIn}
                  />
                </FieldBlock>

                <FieldBlock
                  title="مکان (در محدوده دانشگاه)"
                  icon={<Icon name="map" />}
                  hint="با کلیک روی نقشه مقداردهی می‌شود و قابل ویرایش است."
                  error={locationError}
                >
                  <div className="item-add__map">
                    {isLocked ? (
                      <div className="item-add__map-lock">
                        برای انتخاب موقعیت، ابتدا وارد حساب شوید.
                      </div>
                    ) : (
                      <MapContainer
                        center={mapCenter}
                        zoom={16}
                        minZoom={16}
                        maxZoom={18}
                        maxBounds={MAP_BOUNDS}
                        maxBoundsViscosity={1}
                        doubleClickZoom={false}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
                        <MapViewUpdater center={mapCenter} />
                        <LocationPicker
                          bounds={MAP_BOUNDS}
                          markerPosition={markerPosition}
                          onPick={({ x: nextX, y: nextY }) => {
                            const nextClamped = clampToBounds(nextX, nextY, MAP_BOUNDS);
                            setX(nextClamped.lat.toFixed(6));
                            setY(nextClamped.lng.toFixed(6));
                          }}
                        />
                      </MapContainer>
                    )}
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-6">
                      <label htmlFor="coordX" className="form-label">
                        عرض جغرافیایی
                      </label>
                      <input
                        id="coordX"
                        type="number"
                        step="0.000001"
                        className={`form-control ${UI_TEXT.field.className}`}
                        style={UI_TEXT.field.style}
                        value={x}
                        onChange={(e) => setX(e.target.value)}
                        onBlur={() => {
                          if (!hasCoords) return;
                          if (!withinBounds) {
                            setX(clamped.lat.toFixed(6));
                            setY(clamped.lng.toFixed(6));
                          }
                        }}
                        placeholder="مثلاً 35.702831"
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="coordY" className="form-label">
                        طول جغرافیایی
                      </label>
                      <input
                        id="coordY"
                        type="number"
                        step="0.000001"
                        className={`form-control ${UI_TEXT.field.className}`}
                        style={UI_TEXT.field.style}
                        value={y}
                        onChange={(e) => setY(e.target.value)}
                        onBlur={() => {
                          if (!hasCoords) return;
                          if (!withinBounds) {
                            setX(clamped.lat.toFixed(6));
                            setY(clamped.lng.toFixed(6));
                          }
                        }}
                        placeholder="مثلاً 51.351600"
                      />
                    </div>
                  </div>
                </FieldBlock>

                <FieldBlock
                  title="تصویر (اختیاری)"
                  icon={<Icon name="note" />}
                  hint="فرمت‌های مجاز: JPG, PNG. حجم پیشنهادی کمتر از ۵ مگابایت."
                >
                  <div className="item-add__image-field">
                    <input
                      id="itemImage"
                      type="file"
                      accept="image/*"
                      className={`form-control ${UI_TEXT.field.className} item-add__image-input`}
                      style={UI_TEXT.field.style}
                      disabled={isLocked}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                      }}
                    />
                    {imagePreview ? (
                      <div className="item-add__image-preview">
                        <img src={imagePreview} alt="پیش‌نمایش تصویر" />
                      </div>
                    ) : null}
                  </div>
                </FieldBlock>

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

                <div className="d-flex justify-content-center gap-2 item-add__actions">
                  <button
                    type="submit"
                    className="btn px-4 item-add__submit-btn"
                    disabled={!isValid || locationError || isLocked}
                  >
                    ثبت شیء {typeLabel}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 item-add__reset-btn"
                    onClick={() => {
                      setName("");
                      setCategory("");
                      setProfile("");
                      setNotes("");
                      setImageFile(null);
                      setImagePreview("");
                      setX("");
                      setY("");
                    }}
                  >
                    پاک‌سازی
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mt-4 item-add__preview-card">
            <div className="card-header text-center item-add__preview-header">
              <div className="d-flex flex-column align-items-center gap-2">
                <strong>پیش‌نمایش</strong>

                <div className="text-muted small">
                  این بخش نشان می‌دهد چه اطلاعاتی ذخیره خواهد شد .
                </div>
              </div>
            </div>

            <div className="card-body item-add__preview-body">
              <div className="border-top item-add__divider" />
              <PreviewLine label="نوع" value={typeLabel} />
              <div className="border-top item-add__divider" />
              <PreviewLine label="نام" value={name.trim() || "—"} />
              <div className="border-top item-add__divider" />
              <PreviewLine label="دسته‌بندی" value={categoryLabel} />
              <div className="border-top item-add__divider" />
              <PreviewLine label="پروفایل مرتبط" value={profileValue.trim() || "—"} />
              <div className="border-top item-add__divider" />
              <PreviewLine label="مکان" value={locationLabel} />
              <div className="border-top item-add__divider" />
              <PreviewLine
                label="تصویر"
                value={imageFile ? imageFile.name : "—"}
              />
              <div className="border-top item-add__divider" />
              <PreviewLine label="توضیحات" value={notes.trim() || "—"} />
            </div>
          </div>
            </div>
          </div>
          {isLocked && (
            <div className="item-add__lock">
              <div className="item-add__lock-card">
                <div className="item-add__lock-title">برای ادامه وارد شوید</div>
                <div className="item-add__lock-text">
                  برای ثبت شیء جدید، ابتدا وارد حساب کاربری خود شوید.
                </div>
                <Link to="/login" className="btn item-add__lock-btn" >
                  ورود به حساب
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

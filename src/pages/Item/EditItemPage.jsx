import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import FieldBlock from "../../Components/ItemUi/FieldBlock";
import { MOCK_ITEMS } from "../../mock/mockItems";
import "./ItemPages.css";
import { useAuth } from "../../context/AuthContext";
import { deleteItemById, patchItemById } from "../../services/api";
import { fetchCategories } from "../../services/categories";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { notifySuccess } from "../../services/notify";

const DEFAULT_CENTER = [35.702831, 51.3516];
const MAP_DELTA = 0.0055;

const MAP_BOUNDS = [
  [DEFAULT_CENTER[0] - MAP_DELTA, DEFAULT_CENTER[1] - MAP_DELTA],
  [DEFAULT_CENTER[0] + MAP_DELTA, DEFAULT_CENTER[1] + MAP_DELTA],
];

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
      pathOptions={{
        color: "#1fa34bff",
        fillColor: "#f63b3bff",
        fillOpacity: 0.85,
      }}
    />
  ) : null;
}

const CATEGORY_OPTIONS = [{ value: "", label: "یک دسته‌بندی انتخاب کنید..." }];

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
  const [categories, setCategories] = useState(CATEGORY_OPTIONS);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [x, setX] = useState(item?.latitude ? String(item.latitude) : "");
  const [y, setY] = useState(item?.longitude ? String(item.longitude) : "");

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

  const locationError =
    hasCoords && !withinBounds
      ? "مختصات باید داخل محدوده دانشگاه باشد."
      : null;
  useEffect(() => {
    fetchCategories()
      .then((list) => {
        const opts = [
          { value: "", label: "یک دسته‌بندی انتخاب کنید..." },
          ...list.map((cat) => ({
            value: String(cat.id),
            label: cat.name,
          })),
        ];
        setCategories(opts);
      })
      .catch(() => {
        setCategories(CATEGORY_OPTIONS);
      });
  }, []);

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
                  {categories.map((opt) => (
                    <option key={opt.value || "empty"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FieldBlock>
              <FieldBlock
                title="مکان (در محدوده دانشگاه)"
                hint="با کلیک روی نقشه مقداردهی می‌شود و قابل ویرایش است."
                error={locationError}
              >
                <div className="item-add__map">
                  <MapContainer
                    center={mapCenter}
                    zoom={16}
                    minZoom={16}
                    maxZoom={18}
                    maxBounds={MAP_BOUNDS}
                    maxBoundsViscosity={1}
                    doubleClickZoom={false}
                    style={{ width: "100%", height: "300px" }}
                  >
                    <TileLayer
                      url={import.meta.env.VITE_MAP_TILE_URL}
                      attribution={import.meta.env.VITE_MAP_ATTRIBUTION}
                    />
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
                </div>

                <div className="row g-3 mt-2">
                  <div className="col-6">
                    <label className="form-label">عرض جغرافیایی</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control"
                      value={x}
                      onChange={(e) => setX(e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label">طول جغرافیایی</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control"
                      value={y}
                      onChange={(e) => setY(e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>
                </div>
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
                    if (hasCoords){
                      payload.latitude = clamped.lat;
                      payload.longitude = clamped.lng;
                    }
                    try {
                      await patchItemById(item.id, payload);
                      notifySuccess("تغییرات با موفقیت ذخیره شد.");
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
                      notifySuccess("وضعیت با موفقیت ثبت شد.");
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
                      notifySuccess("آیتم با موفقیت حذف شد.");
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

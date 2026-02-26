import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  CircleMarker,
  Circle,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import { fetchItemsByLocationPage, fetchProductsPage } from "../services/products";
import { fetchCategories } from "../services/categories";
import CachedTileLayer from "./CachedTileLayer";
import { notifyError, notifyWarn } from "../services/notify";

import "leaflet/dist/leaflet.css";
import "../assets/Map.css";

function getCategoryMeta(category, categoriesMap) {
  return categoriesMap?.[category] || { label: category || "سایر", color: "#94a3b8" };
}

function getCategoryLabel(item, categoriesMap) {
  return item?.categoryLabel || getCategoryMeta(item?.category, categoriesMap).label;
}

/* ================== config ================== */
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;
const TILE_ATTR = import.meta.env.VITE_MAP_ATTRIBUTION;

/* ================== helpers ================== */
function markerIcon(category, count = 1, categoriesMap) {
  const meta = getCategoryMeta(category, categoriesMap);
  const label = count > 1 ? `<span class="marker-count">${count}</span>` : "";
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker" style="background:${meta.color}">
             ${label}
           </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    category,
    categoryColor: meta.color,
  });
}

/* ================== map helpers ================== */
function AddMarker({ bounds, onPick }) {
  useMapEvents({
    dblclick(e) {
      const { lat, lng } = e.latlng;
      const [[south, west], [north, east]] = bounds;

      if (lat < south || lat > north || lng < west || lng > east) return;

      onPick({ x: lat, y: lng });
    },
  });

  return null;
}

function FlyToMarker({ item }) {
  const map = useMap();

  useEffect(() => {
    if (item) {
      map.flyTo([item.x, item.y], 18, { duration: 0.8 });
    }
  }, [item, map]);

  return null;
}

function MapClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick({ lat, lng });
    },
  });
  return null;
}

/* ================== sidebar ================== */
function Sidebar({
  items,
  selectedId,
  onSelect,
  selectedCategories,
  toggleCategory,
  loading,
  categories,
  categoriesMap,
  selectedCategoryIds,
  toggleCategoryId,
  filterCenter,
  filterDiameterM,
  filterPickMode,
  filterBusy,
  filterError,
  filterName,
  filterType,
  filterFromPreset,
  filterToPreset,
  filterLocationMode,
  onChangeDiameter,
  onChangeName,
  onChangeType,
  onChangeFromPreset,
  onChangeToPreset,
  onChangeLocationMode,
  onTogglePickMode,
  onApplyFilter,
  onClearFilter,
}) {
  if (loading) {
    return (
      <aside className="sidebar" dir="rtl">
        <h3>اشیای گم‌شده</h3>
        <div className="map-skeleton">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="map-skeleton-row">
              <div className="map-skeleton-line wide" />
              <div className="map-skeleton-line" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const categoriesInItems = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  );

  return (
    <aside className="sidebar" dir="rtl">
      <h3>اشیای گم‌شده</h3>

      <div className="filter-section">
        <strong>فیلترها</strong>

        <details className="filter-dropdown">
          <summary>نمایش و تنظیم فیلترها</summary>
          <div className="filter-dropdown-body">
            <label className="filter-label filter-field">
              <span>نام (شامل)</span>
              <input
                type="text"
                placeholder="مثلاً کیف"
                value={filterName}
                onChange={(e) => onChangeName(e.target.value)}
              />
            </label>

            <div className="filter-divider" />

            <div className="filter-coords">فیلتر دسته‌بندی</div>
            {categories.length === 0 ? (
              <div className="filter-coords">دسته‌بندی‌ها موجود نیست.</div>
            ) : (
              categories.map((cat) => (
                <label key={cat.id} className="filter-label">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => toggleCategoryId(cat.id)}
                  />
                  <span className="filter-dot" style={{ background: cat.color }} />
                  {cat.name}
                </label>
              ))
            )}

            <div className="filter-divider" />

            <label className="filter-label filter-field">
              <span>نوع</span>
              <select
                value={filterType}
                onChange={(e) => onChangeType(e.target.value)}
              >
                <option value="">همه</option>
                <option value="LOST">گمشده</option>
                <option value="FOUND">پیداشده</option>
              </select>
            </label>

            <label className="filter-label filter-field">
              <span>از تاریخ</span>
              <select
                value={filterFromPreset}
                onChange={(e) => onChangeFromPreset(e.target.value)}
              >
                <option value="any">بدون محدودیت</option>
                <option value="today">امروز</option>
                <option value="7d">۷ روز اخیر</option>
                <option value="30d">۳۰ روز اخیر</option>
                <option value="90d">۹۰ روز اخیر</option>
              </select>
            </label>

            <label className="filter-label filter-field">
              <span>تا تاریخ</span>
              <select
                value={filterToPreset}
                onChange={(e) => onChangeToPreset(e.target.value)}
              >
                <option value="any">بدون محدودیت</option>
                <option value="today">امروز</option>
                <option value="7d">۷ روز اخیر</option>
                <option value="30d">۳۰ روز اخیر</option>
                <option value="90d">۹۰ روز اخیر</option>
              </select>
            </label>

            <div className="filter-divider" />

            <label className="filter-label filter-field">
              <span>حالت موقعیت</span>
              <select
                value={filterLocationMode}
                onChange={(e) => onChangeLocationMode(e.target.value)}
              >
                <option value="none">بدون موقعیت</option>
                <option value="around_pin">اطراف نقطه انتخابی</option>
              </select>
            </label>
            <label className="filter-label filter-field">
              <span>قطر (متر)</span>
              <input
                type="number"
                min="10"
                step="10"
                value={filterDiameterM}
                onChange={(e) => onChangeDiameter(e.target.value)}
                disabled={filterLocationMode !== "around_pin"}
              />
            </label>
            <div className="filter-coords">
              مرکز: {filterCenter.lat.toFixed(6)} , {filterCenter.lng.toFixed(6)}
            </div>
            {filterError ? <div className="filter-error">{filterError}</div> : null}
            <div className="filter-actions">
              <button
                type="button"
                className={`filter-btn ${filterPickMode ? "active" : ""}`}
                onClick={onTogglePickMode}
                disabled={filterBusy || filterLocationMode !== "around_pin"}
              >
                {filterPickMode ? "لغو انتخاب روی نقشه" : "انتخاب روی نقشه"}
              </button>
              <button
                type="button"
                className="filter-btn primary"
                onClick={onApplyFilter}
                disabled={filterBusy}
              >
                {filterBusy ? "در حال اعمال..." : "اعمال فیلتر"}
              </button>
              <button
                type="button"
                className="filter-btn ghost"
                onClick={onClearFilter}
                disabled={filterBusy}
              >
                حذف فیلتر
              </button>
            </div>
          </div>
        </details>
      </div>

      {items
        .filter((i) => selectedCategories.includes(i.category))
        .map((item) => (
          <div
            key={item.id}
            className={`item-card ${
              item.id === selectedId ? "active" : ""
            }`}
            onClick={() => onSelect(item.id)}
          >
            <div
              className="badge"
              style={{ background: getCategoryMeta(item.category, categoriesMap).color }}
            >
              {getCategoryLabel(item, categoriesMap)}
            </div>
            <div className="item-name">{item.name}</div>
            <div className="item-timestamp">
              {new Date(item.timestamp).toLocaleString("fa-IR")}
            </div>
          </div>
        ))}
    </aside>
  );
}

/* ================== main ================== */
export default function LostAndFoundMap() {
  const center = [35.702831, 51.3516];
  const delta = 0.0055;
  const navigate = useNavigate();

  const bounds = [
    [center[0] - delta, center[1] - delta],
    [center[0] + delta, center[1] + delta],
  ];

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [userOutOfBounds, setUserOutOfBounds] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [filterCenter, setFilterCenter] = useState({
    lat: center[0],
    lng: center[1],
  });
  const [filterDiameterM, setFilterDiameterM] = useState(1000);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFromPreset, setFilterFromPreset] = useState("any");
  const [filterToPreset, setFilterToPreset] = useState("any");
  const [filterLocationMode, setFilterLocationMode] = useState("none");
  const [filterPickMode, setFilterPickMode] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [filterBusy, setFilterBusy] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const hasShownBoundsAlert = useRef(false);

  const markerRefs = useRef({});

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        const map = list.reduce((acc, cat) => {
          acc[cat.key] = { label: cat.name, color: cat.color, id: cat.id };
          return acc;
        }, {});
        setCategoriesMap(map);
      })
      .catch(() => {
        setCategories([]);
        setCategoriesMap({});
      });
  }, []);

  async function loadMapPage({ nextPage = page, useFilter = filterApplied } = {}) {
    setLoadingItems(true);
    try {
      let apiItems = [];
      let meta = {};
      if (useFilter) {
        const fromIso = toPresetIso(filterFromPreset, true);
        const toIso = toPresetIso(filterToPreset, false);
        const diameterM = Number(filterDiameterM);
        const radiusKm = diameterM / 2000;
        const needsLocation = filterLocationMode === "around_pin";
        const response = await fetchItemsByLocationPage({
          lat: needsLocation ? filterCenter.lat : undefined,
          lon: needsLocation ? filterCenter.lng : undefined,
          radiusKm: needsLocation ? radiusKm : undefined,
          name: filterName.trim() || undefined,
          type: filterType || undefined,
          categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
          from: fromIso || undefined,
          to: toIso || undefined,
          page: nextPage,
          size,
        });
        apiItems = response.items || [];
        meta = response.meta || {};
      } else {
        const response = await fetchProductsPage({ page: nextPage, size });
        apiItems = response.items || [];
        meta = response.meta || {};
      }

      const mapItems = apiItems.filter(
        (item) => typeof item.x === "number" && typeof item.y === "number"
      );
      setItems(mapItems);
      setHasNext(Boolean(meta?.hasNext));
      setTotalPages(meta?.totalPages || 0);
      const mapCategoryKeys = Array.from(
        new Set(mapItems.map((item) => item.category).filter(Boolean))
      );
      setSelectedCategories(mapCategoryKeys);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    loadMapPage({ nextPage: page, useFilter: filterApplied });
  }, [page, size, filterApplied]);

  const isInBounds = (lat, lng) => {
    const [[south, west], [north, east]] = bounds;
    return lat >= south && lat <= north && lng >= west && lng <= east;
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      notifyError("موقعیت شما قابل دسترسی نیست!");
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };
    const fallbackToApprox = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const out = !isInBounds(latitude, longitude);
          setUserOutOfBounds(out);
          if (out && !hasShownBoundsAlert.current) {
            hasShownBoundsAlert.current = true;
            notifyWarn("موقعیت شما خارج از محدوده نقشه است.");
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          if (err?.code === 1) {
            notifyError("دسترسی به موقعیت مکانی رد شد.");
          } else if (err?.code === 2) {
            notifyError("موقعیت مکانی در دسترس نیست. لطفاً GPS یا اینترنت را بررسی کنید.");
          } else if (err?.code === 3) {
            notifyError("دریافت موقعیت بیش از حد طول کشید. دوباره تلاش کنید.");
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const out = !isInBounds(latitude, longitude);
        setUserOutOfBounds(out);
        if (out && !hasShownBoundsAlert.current) {
          hasShownBoundsAlert.current = true;
          notifyWarn("موقعیت شما خارج از محدوده نقشه است.");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        if (err?.code === 2 || err?.code === 3) {
          fallbackToApprox();
        } else if (err?.code === 1) {
          notifyError("دسترسی به موقعیت مکانی رد شد.");
        }
      },
      options
    );
  }, []);

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId].openPopup();
    }
  }, [selectedId]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const toggleCategoryId = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((c) => c !== catId)
        : [...prev, catId]
    );
  };

  const selectedItem = items.find((i) => i.id === selectedId);
  const handlePickLocation = ({ x, y }) => {
    const lat = Number(x.toFixed(6));
    const lng = Number(y.toFixed(6));
    navigate(`/add?x=${lat}&y=${lng}`);
  };

  async function applyLocationFilter() {
    if (filterBusy) return;
    const diameterM = Number(filterDiameterM);
    const needsLocation = filterLocationMode === "around_pin";
    if (needsLocation && (!Number.isFinite(diameterM) || diameterM <= 0)) {
      setFilterError("قطر باید بیشتر از صفر باشد.");
      return;
    }
    if (needsLocation && (!filterCenter?.lat || !filterCenter?.lng)) {
      setFilterError("مرکز مکانی را انتخاب کنید.");
      return;
    }
    const radiusKm = diameterM / 2000;
    setFilterError("");
    setFilterBusy(true);
    try {
      setFilterApplied(true);
      setFilterPickMode(false);
      setPage(0);
      await loadMapPage({ nextPage: 0, useFilter: true });
      setSelectedId(null);
    } catch (err) {
      setFilterError(err?.message || "خطا در جستجوی مکانی.");
    } finally {
      setFilterBusy(false);
    }
  }

  async function clearLocationFilter() {
    if (filterBusy) return;
    setFilterError("");
    setFilterApplied(false);
    setFilterPickMode(false);
    try {
      setPage(0);
      await loadMapPage({ nextPage: 0, useFilter: false });
      setSelectedId(null);
    } catch (err) {
      setFilterError(err?.message || "خطا در دریافت آیتم‌ها.");
    }
  }

  function toPresetIso(preset, isFrom) {
    if (!preset || preset === "any") return "";
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    let base = now;
    if (preset === "today") base = now;
    if (preset === "7d") base = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (preset === "30d") base = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (preset === "90d") base = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const date = preset === "today" ? now : base;
    const dt = isFrom ? startOfDay(date) : endOfDay(date);
    return dt.toISOString();
  }

  return (
    <div className="app-container">
      <Sidebar
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        loading={loadingItems}
        categories={categories}
        categoriesMap={categoriesMap}
        selectedCategoryIds={selectedCategoryIds}
        toggleCategoryId={toggleCategoryId}
        filterCenter={filterCenter}
        filterDiameterM={filterDiameterM}
        filterPickMode={filterPickMode}
        filterBusy={filterBusy}
        filterError={filterError}
        filterName={filterName}
        filterType={filterType}
        filterFromPreset={filterFromPreset}
        filterToPreset={filterToPreset}
        filterLocationMode={filterLocationMode}
        onChangeDiameter={setFilterDiameterM}
        onChangeName={setFilterName}
        onChangeType={setFilterType}
        onChangeFromPreset={setFilterFromPreset}
        onChangeToPreset={setFilterToPreset}
        onChangeLocationMode={(val) => {
          setFilterLocationMode(val);
          if (val !== "around_pin") setFilterPickMode(false);
        }}
        onTogglePickMode={() =>
          setFilterPickMode((p) => {
            const next = !p;
            if (next) setFilterLocationMode("around_pin");
            return next;
          })
        }
        onApplyFilter={applyLocationFilter}
        onClearFilter={clearLocationFilter}
      />

      <div className="map-wrapper">
        <div className="map-toolbar">
          <div className="map-title">نقشه اشیاء گم‌شده</div>
          <div className="map-hint">برای افزودن، دوبار روی نقشه کلیک کنید</div>
        </div>
        <MapContainer
          center={center}
          zoom={16}
          minZoom={16}
          maxZoom={18}
          maxBounds={bounds}
          doubleClickZoom={false}
          style={{ width: "100%", height: "100%" }}
        >
          <CachedTileLayer url={TILE_URL} attribution={TILE_ATTR} />

          <MarkerClusterGroup
            maxClusterRadius={(zoom) => (zoom >= 18 ? 18 : zoom >= 17 ? 28 : 40)}
            disableClusteringAtZoom={18}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            zoomToBoundsOnClick
            chunkedLoading
            iconCreateFunction={(cluster) => {
              return L.divIcon({
                html: `<div class="custom-cluster">
                         <div class="cluster-count">
                           ${cluster.getChildCount()}
                         </div>
                       </div>`,
                className: "my-custom-cluster",
                iconSize: [40, 40],
              });
            }}
          >
            {items
              .filter((i) => selectedCategories.includes(i.category))
              .map((item) => (
                <Marker
                  key={item.id}
                  position={[item.x, item.y]}
                  icon={markerIcon(item.category, 1, categoriesMap)}
                >
                  <Popup>
                    <strong>{item.name}</strong>
                    <br />
                    {getCategoryLabel(item, categoriesMap)}
                    <br />
                    {new Date(item.timestamp).toLocaleString("fa-IR")}
                    <div className="map-popup-actions">
                      <button
                        type="button"
                        className="map-popup-btn"
                        onClick={() =>
                          navigate(`/items/${item.id}`, { state: { item } })
                        }
                      >
                        مشاهده جزئیات
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MarkerClusterGroup>

          {userOutOfBounds ? (
            <Popup position={center}>
              موقعیت شما خارج از محدوده نقشه است.
            </Popup>
          ) : null}

          {userLocation && isInBounds(userLocation.lat, userLocation.lng) ? (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={7}
              pathOptions={{
                color: "#1d4ed8",
                fillColor: "#60a5fa",
                fillOpacity: 0.9,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                موقعیت شما
              </Tooltip>
            </CircleMarker>
          ) : null}

          {!filterPickMode ? (
            <AddMarker bounds={bounds} onPick={handlePickLocation} />
          ) : null}

          {filterPickMode ? <MapClickPicker onPick={setFilterCenter} /> : null}

          {filterLocationMode === "around_pin" && (filterApplied || filterPickMode) ? (
            <>
              <Marker position={[filterCenter.lat, filterCenter.lng]} />
              <Circle
                center={[filterCenter.lat, filterCenter.lng]}
                radius={Number(filterDiameterM) / 2}
                pathOptions={{
                  color: "#16a34a",
                  fillColor: "#22c55e",
                  fillOpacity: 0.2,
                }}
              />
            </>
          ) : null}

          {selectedItem && <FlyToMarker item={selectedItem} />}
        </MapContainer>
        <div className="map-pagination">
          <button
            type="button"
            className="map-pagination__btn"
            disabled={loadingItems || page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            قبلی
          </button>
          <span className="map-pagination__label">
            صفحه {page + 1} از {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="map-pagination__btn"
            disabled={loadingItems || !hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            بعدی
          </button>
        </div>
      </div>

    </div>
  );
}

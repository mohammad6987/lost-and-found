import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import { fetchProductsAsItems } from "../services/products";

import "leaflet/dist/leaflet.css";
import "../assets/Map.css";

const CATEGORY_META = {
  electronics: { label: "الکترونیک", color: "#2a6bd9" },
  documents: { label: "مدارک", color: "#16a34a" },
  clothing: { label: "پوشاک", color: "#db2777" },
  other: { label: "سایر", color: "#f59e0b" },
  phones: { label: "موبایل", color: "#2a6bd9" },
  handbags: { label: "کیف دستی", color: "#7c3aed" },
  wallets: { label: "کیف پول", color: "#f97316" },
  keys: { label: "کلید", color: "#0ea5e9" },
  id_cards: { label: "کارت شناسایی", color: "#10b981" },
  laptops: { label: "لپ‌تاپ", color: "#2563eb" },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.other;
}

function getCategoryLabel(item) {
  return item?.categoryLabel || getCategoryMeta(item?.category).label;
}

/* ================== config ================== */
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;
const TILE_ATTR = import.meta.env.VITE_MAP_ATTRIBUTION;

/* ================== helpers ================== */
function markerIcon(category) {
  const meta = getCategoryMeta(category);
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker" style="background:${meta.color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
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

/* ================== sidebar ================== */
function Sidebar({
  items,
  selectedId,
  onSelect,
  selectedCategories,
  toggleCategory,
}) {
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  );

  return (
    <aside className="sidebar" dir="rtl">
      <h3>اشیای گم‌شده</h3>

      <div className="filter-section">
        <strong>فیلتر دسته‌بندی</strong>
        {categories.map((cat) => (
          <label key={cat} className="filter-label">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => toggleCategory(cat)}
            />
            <span
              className="filter-dot"
              style={{ background: getCategoryMeta(cat).color }}
            />
            {getCategoryMeta(cat).label}
          </label>
        ))}
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
              style={{ background: getCategoryMeta(item.category).color }}
            >
              {getCategoryLabel(item)}
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
  const [userLocation, setUserLocation] = useState(null);
  const [userOutOfBounds, setUserOutOfBounds] = useState(false);
  const hasShownBoundsAlert = useRef(false);

  const markerRefs = useRef({});

  useEffect(() => {
    fetchProductsAsItems()
      .then((apiItems) => {
        const mapItems = apiItems.filter(
          (item) =>
            typeof item.x === "number" &&
            typeof item.y === "number"
        );
        setItems(mapItems);
        setSelectedCategories(
          Array.from(
            new Set(mapItems.map((item) => item.category).filter(Boolean))
          )
        );
      })
      .catch((err) => console.error(err));
  }, []);

  const isInBounds = (lat, lng) => {
    const [[south, west], [north, east]] = bounds;
    return lat >= south && lat <= north && lng >= west && lng <= east;
  };

  useEffect(() => {
    if (!("geolocation" in navigator)){
      window.alert( " موقعیت شما قابل دسترسی نیست!");
      return;}
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const out = !isInBounds(latitude, longitude);
        setUserOutOfBounds(out);
        if (out && !hasShownBoundsAlert.current) {
          hasShownBoundsAlert.current = true;
          window.alert("موقعیت شما خارج از محدوده نقشه است.");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
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

  const selectedItem = items.find((i) => i.id === selectedId);
  const handlePickLocation = ({ x, y }) => {
    const lat = Number(x.toFixed(6));
    const lng = Number(y.toFixed(6));
    navigate(`/add?x=${lat}&y=${lng}`);
  };

  return (
    <div className="app-container">
      <Sidebar
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
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
          <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

          <MarkerClusterGroup
            maxClusterRadius={50}
            iconCreateFunction={(cluster) => {
              const markers = cluster.getAllChildMarkers();
              const counts = {};

              markers.forEach((m) => {
                const cat =
                  m.options.icon.options.category || "other";
                counts[cat] = (counts[cat] || 0) + 1;
              });

              const dots = Object.entries(counts)
                .map(
                  ([cat, count]) =>
                    `<span class="cluster-dot" style="background:${getCategoryMeta(cat).color}" title="${getCategoryMeta(cat).label}: ${count}"></span>`
                )
                .join("");

              return L.divIcon({
                html: `<div class="custom-cluster">
                         ${dots}
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
              .filter((i) =>
                selectedCategories.includes(i.category)
              )
              .map((item) => (
                <Marker
                  key={item.id}
                  position={[item.x, item.y]}
                  icon={markerIcon(item.category)}
                  ref={(ref) =>
                    (markerRefs.current[item.id] = ref)
                  }
                >
                  <Popup>
                    <strong>{item.name}</strong>
                    <br />
                    {getCategoryLabel(item)}
                    <br />
                    {new Date(item.timestamp).toLocaleString("fa-IR")}
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

          <AddMarker bounds={bounds} onPick={handlePickLocation} />

          {selectedItem && <FlyToMarker item={selectedItem} />}
        </MapContainer>
      </div>
    </div>
  );
}

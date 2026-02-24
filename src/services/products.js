import { getItemById, getProducts } from "./api";

const ITEMS_CACHE_KEY = "lf_items_cache_v1";
const ITEMS_TTL_MS = 60 * 1000;
const PRODUCTS_API_BASE_URL =
  import.meta.env.VITE_PRODUCTS_API_BASE_URL || "https://sharif-lostfound.liara.run";

function loadItemsCache() {
  try {
    const raw = localStorage.getItem(ITEMS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > ITEMS_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function saveItemsCache(items) {
  try {
    localStorage.setItem(
      ITEMS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items })
    );
  } catch {
    // ignore cache errors
  }
}

function normalizeCategoryName(categoryName) {
  if (!categoryName) return "other";
  return categoryName.toLowerCase().trim().replace(/\s+/g, "_");
}

export function mapProductToItem(product) {
  const latitudeRaw =
    product?.location?.latitude ??
    product?.latitude ??
    product?.x ??
    product?.lat ??
    null;
  const longitudeRaw =
    product?.location?.longitude ??
    product?.longitude ??
    product?.y ??
    product?.lng ??
    null;
  const latitude =
    typeof latitudeRaw === "string" ? Number(latitudeRaw) : latitudeRaw;
  const longitude =
    typeof longitudeRaw === "string" ? Number(longitudeRaw) : longitudeRaw;

  const categoryName =
    product?.categoryName || product?.category_name || product?.categoryLabel;
  const itemName = product?.itemName || product?.name || product?.title;
  const description = product?.description || product?.notes || "";
  const reporterEmail =
    product?.applicant?.email ||
    product?.reporter?.email ||
    product?.relatedProfile ||
    "";
  const reporterName =
    product?.applicant?.fullName ||
    product?.reporter?.name ||
    "";
  const reporterId =
    product?.applicant?.id ||
    product?.reporter?.id ||
    product?.user_id ||
    product?.reporter_id ||
    null;

  const createdAtRaw =
    product?.createdAt ||
    product?.created_at ||
    product?.reportedAt ||
    product?.reported_at ||
    product?.updatedAt ||
    product?.updated_at ||
    null;
  const createdAt = createdAtRaw || new Date().toISOString();

  return {
    id: String(product?.id ?? ""),
    name: itemName || "—",
    category: normalizeCategoryName(categoryName),
    categoryLabel: categoryName || "سایر",
    description,
    notes: description,
    image: product?.image || null,
    x: latitude,
    y: longitude,
    locationText:
      typeof latitude === "number" && typeof longitude === "number"
        ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        : "نامشخص",
    timestamp: createdAt,
    createdAt,
    type: (product?.type || "lost").toLowerCase(),
    status: (product?.status || "active").toLowerCase(),
    relatedProfile: reporterEmail,
    applicantName: reporterName,
    reporterId,
    raw: product,
  };
}

export async function fetchProductsAsItems() {
  const cached = loadItemsCache();
  if (cached) return cached;

  const response = await getProducts();
  const products = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  const items = products.map(mapProductToItem);
  saveItemsCache(items);
  return items;
}

export async function fetchItemById(id) {
  const data = await getItemById(id);
  return mapProductToItem(data);
}

export async function fetchItemsByLocation({
  lat,
  lon,
  radiusKm,
  name,
  type,
  from,
  to,
} = {}) {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (type) params.set("type", type);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const hasLocation =
    lat !== undefined && lon !== undefined && radiusKm !== undefined;
  if (hasLocation) {
    params.set("lat", String(lat));
    params.set("lon", String(lon));
    params.set("radiusKm", String(radiusKm));
  }
  const endpoint = `/api/items/search/location?${params.toString()}`;
  const response = await fetch(`${PRODUCTS_API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.message || data?.detail || "خطا در جستجوی مکانی."
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map(mapProductToItem);
}

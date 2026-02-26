import { getItemById, getProducts } from "./api";
import { notifyError } from "./notify";
import { getAccessToken } from "./auth";

const ITEMS_CACHE_KEY = "lf_items_cache_v1";
const ITEMS_TTL_MS = 60 * 1000;
const PRODUCTS_API_BASE_URL =
  import.meta.env.VITE_PRODUCTS_API_BASE_URL || "https://sharif-lostfound.liara.run";

function loadItemsCache(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > ITEMS_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function saveItemsCache(cacheKey, items) {
  try {
    localStorage.setItem(
      cacheKey,
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
  const categoryIdRaw =
    product?.category?.id ||
    product?.category_id ||
    (typeof product?.category === "number" || typeof product?.category === "string"
      ? product.category
      : null);
  const categoryId =
    categoryIdRaw === null || categoryIdRaw === undefined
      ? null
      : Number(categoryIdRaw);
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
    categoryId,
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
    type: (product?.type || "LOST").toUpperCase(),
    status: (product?.status || "ACTIVE").toUpperCase(),
    relatedProfile: reporterEmail,
    applicantName: reporterName,
    reporterId,
    raw: product,
  };
}

export async function fetchProductsAsItems({ page = 0, size = 200, useCache = true } = {}) {
  const cacheKey = `${ITEMS_CACHE_KEY}_${page}_${size}`;
  const cached = useCache ? loadItemsCache(cacheKey) : null;
  if (cached) return cached;

  const response = await getProducts({ page, size });
  const products = Array.isArray(response?.data?.items)
    ? response.data.items
    : Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

  const items = products.map(mapProductToItem);
  if (useCache) saveItemsCache(cacheKey, items);
  return items;
}

export async function fetchProductsPage({ page = 0, size = 20, useCache = true } = {}) {
  const cacheKey = `${ITEMS_CACHE_KEY}_page_${page}_${size}`;
  const cached = useCache ? loadItemsCache(cacheKey) : null;
  if (cached) {
    return { items: cached, meta: null };
  }

  const response = await getProducts({ page, size });
  const meta = response?.data || response || {};
  const products = Array.isArray(meta?.items)
    ? meta.items
    : Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

  const items = products.map(mapProductToItem);
  if (useCache) saveItemsCache(cacheKey, items);
  return { items, meta };
}

export async function fetchItemById(id) {
  const data = await getItemById(id);
  return mapProductToItem(data);
}

export async function fetchItemsByLocation(params = {}) {
  const response = await fetchItemsByLocationRaw(params);
  return response.items;
}

export async function fetchItemsByLocationPage(params = {}) {
  const response = await fetchItemsByLocationRaw(params);
  return response;
}

async function fetchItemsByLocationRaw({
  lat,
  lon,
  radiusKm,
  name,
  type,
  categoryIds,
  from,
  to,
  page,
  size,
} = {}) {
  const accessToken = getAccessToken?.() || null;
  const search = new URLSearchParams();
  if (name) search.set("name", name);
  if (type) search.set("type", String(type).toUpperCase());
  if (categoryIds) {
    const value = Array.isArray(categoryIds)
      ? categoryIds.join(",")
      : String(categoryIds);
    search.set("categoryIds", value);
  }
  if (from) search.set("from", from);
  if (to) search.set("to", to);
  if (page !== undefined) search.set("page", String(page));
  if (size !== undefined) search.set("size", String(size));
  const hasLocation =
    lat !== undefined && lon !== undefined && radiusKm !== undefined;
  if (hasLocation) {
    search.set("lat", String(lat));
    search.set("lon", String(lon));
    search.set("radiusKm", String(radiusKm));
  }
  const endpoint = `/api/items/search/location?${search.toString()}`;
  const response = await fetch(`${PRODUCTS_API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.message || data?.detail || "خطا در جستجوی مکانی."
    );
    error.status = response.status;
    error.data = data;
    notifyError(error.message);
    throw error;
  }
  const meta = data?.data || data || {};
  const list = Array.isArray(meta?.items)
    ? meta.items
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : [];
  return { items: list.map(mapProductToItem), meta };
}

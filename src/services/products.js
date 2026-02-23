import { getItemById, getProducts } from "./api";

const ITEMS_CACHE_KEY = "lf_items_cache_v1";
const ITEMS_TTL_MS = 60 * 1000;

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
    timestamp: product?.reportedAt || new Date().toISOString(),
    createdAt: product?.reportedAt || new Date().toISOString(),
    type: (product?.type || "lost").toLowerCase(),
    status: (product?.status || "active").toLowerCase(),
    relatedProfile: reporterEmail,
    applicantName: reporterName,
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

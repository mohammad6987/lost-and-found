import { getItemById, getProducts } from "./api";

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
  const response = await getProducts();
  const products = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  return products.map(mapProductToItem);
}

export async function fetchItemById(id) {
  const data = await getItemById(id);
  return mapProductToItem(data);
}

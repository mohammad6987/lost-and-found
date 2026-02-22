import { getProducts } from "./api";

function normalizeCategoryName(categoryName) {
  if (!categoryName) return "other";
  return categoryName.toLowerCase().trim().replace(/\s+/g, "_");
}

export function mapProductToItem(product) {
  const latitude = product?.location?.latitude;
  const longitude = product?.location?.longitude;

  return {
    id: String(product?.id ?? ""),
    name: product?.itemName || "—",
    category: normalizeCategoryName(product?.categoryName),
    categoryLabel: product?.categoryName || "سایر",
    description: product?.description || "",
    image: product?.image || null,
    x: latitude,
    y: longitude,
    locationText:
      typeof latitude === "number" && typeof longitude === "number"
        ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        : "نامشخص",
    timestamp: product?.reportedAt || new Date().toISOString(),
    createdAt: product?.reportedAt || new Date().toISOString(),
    type: (product?.type || "LOST").toLowerCase(),
    status: (product?.status || "OPEN").toLowerCase(),
    relatedProfile: product?.applicant?.email || "",
    applicantName: product?.applicant?.fullName || "",
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

import { getCategories } from "./api";

const CATEGORIES_CACHE_KEY = "lf_categories_cache_v1";
const CATEGORIES_TTL_MS = 60 * 60 * 1000;

const FALLBACK_COLORS = [
  "#2563eb",
  "#16a34a",
  "#db2777",
  "#f59e0b",
  "#7c3aed",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#4f46e5",
];

function loadCache() {
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > CATEGORIES_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function saveCache(items) {
  try {
    localStorage.setItem(
      CATEGORIES_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items })
    );
  } catch {
    // ignore cache errors
  }
}

function normalizeKey(name) {
  if (!name) return "other";
  return String(name).toLowerCase().trim().replace(/\s+/g, "_");
}

export async function fetchCategories({ useCache = true } = {}) {
  const cached = useCache ? loadCache() : null;
  if (cached) return cached;

  const response = await getCategories();
  const list = Array.isArray(response?.data) ? response.data : [];
  const items = list.map((item, idx) => ({
    id: item.id,
    name: item.name,
    key: normalizeKey(item.name),
    color: item.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
  }));
  saveCache(items);
  return items;
}

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const TILE_CACHE_KEY = "lf_tile_cache_v1";
const TILE_TTL_MS = 60 * 1000;
const TILE_MAX_ENTRIES = 80;

function loadCache() {
  try {
    const raw = localStorage.getItem(TILE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") {
      return { items: {}, order: [] };
    }
    return {
      items: parsed.items || {},
      order: Array.isArray(parsed.order) ? parsed.order : [],
    };
  } catch {
    return { items: {}, order: [] };
  }
}

function pruneCache(cache) {
  const now = Date.now();
  cache.order = cache.order.filter((key) => {
    const entry = cache.items[key];
    if (!entry || now - entry.ts > TILE_TTL_MS) {
      delete cache.items[key];
      return false;
    }
    return true;
  });

  while (cache.order.length > TILE_MAX_ENTRIES) {
    const oldest = cache.order.shift();
    delete cache.items[oldest];
  }
}

function persistCache(cache) {
  pruneCache(cache);
  try {
    localStorage.setItem(TILE_CACHE_KEY, JSON.stringify(cache));
    return true;
  } catch {
    // try to free space by dropping oldest entries
    while (cache.order.length > 0) {
      const oldest = cache.order.shift();
      delete cache.items[oldest];
      try {
        localStorage.setItem(TILE_CACHE_KEY, JSON.stringify(cache));
        return true;
      } catch {
        // continue dropping
      }
    }
  }
  return false;
}

function setCacheEntry(cache, key, data) {
  cache.items[key] = { data, ts: Date.now() };
  cache.order = cache.order.filter((k) => k !== key);
  cache.order.push(key);
  persistCache(cache);
}

export default function CachedTileLayer({ url, attribution }) {
  const map = useMap();

  useEffect(() => {
    if (!url) return;

    const layer = L.tileLayer(url, {
      attribution,
      crossOrigin: true,
      createTile(coords, done) {
        const tile = document.createElement("img");
        tile.alt = "";
        tile.setAttribute("role", "presentation");
        tile.crossOrigin = "anonymous";
        tile.loading = "lazy";

        const tileUrl = this.getTileUrl(coords);
        const cache = loadCache();
        const cached = cache.items[tileUrl];

        if (cached && Date.now() - cached.ts <= TILE_TTL_MS) {
          tile.onload = () => done(null, tile);
          tile.onerror = () => done(new Error("Tile load error"), tile);
          tile.src = cached.data;
          return tile;
        }

        tile.onload = () => done(null, tile);
        tile.onerror = () => done(new Error("Tile load error"), tile);
        tile.src = tileUrl;

        // Background fetch to store base64 for next time
        fetch(tileUrl, { mode: "cors" })
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              if (typeof dataUrl === "string") {
                setCacheEntry(cache, tileUrl, dataUrl);
              }
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            // ignore cache failures
          });

        return tile;
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
      layer.remove();
    };
  }, [map, url, attribution]);

  return null;
}

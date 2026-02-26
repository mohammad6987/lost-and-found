import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { createChatSession, sendChatMessage } from "../../services/metis";
import { fetchItemsByLocationPage } from "../../services/products";
import { fetchCategories } from "../../services/categories";
import Modal from "../../Components/ItemUi/Modal";
import PreviewLine from "../../Components/ItemUi/PreviewLine";
import "./ChatBotPage.css";
import "../Item/ItemPages.css";

const BOT_ID = import.meta.env.VITE_METIS_BOT_ID || "1252a9cc-58fb-43d7-a8b8-386bca1466f9";
const RATE_KEY = "lf_bot_rate_v1";
const SESSION_KEY = "lf_bot_session_v1";
const STATE_KEY = "lf_bot_state_v1";
const SESSION_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 8;

const SYSTEM_INSTRUCTION = `
You are a strict parameter extractor for a Lost & Found search assistant.
You DO NOT call any API. You only return parameters for the frontend to use.

API: GET /api/items/search/location
Valid parameters:
- name: string (partial match, case-insensitive)
- type: "LOST" | "FOUND"
- categoryIds: comma-separated list (e.g., "1,2,3")
- from: ISO 8601 datetime (created_at >= from)
- to: ISO 8601 datetime (created_at <= to)
- lat, lon, radiusKm: location trio (optional, but if any is provided, all three MUST be provided)

Output JSON only (no markdown, no extra text). Two possible outputs:

A) If enough info:
{
  "params": {
    "name": "...",
    "type": "LOST",
    "categoryIds": "1,2",
    "from": "...",
    "to": "...",
    "lat": 0.0,
    "lon": 0.0,
    "radiusKm": 0.0
  },
  "summary": "Short human-readable summary in Persian."
}

B) If clarification is needed:
{
  "ask": "Your question here (Persian)."
}

Rules:
1) NEVER call any API. Only return JSON as defined above.
2) If location info is incomplete (missing any of lat/lon/radiusKm), ask for the missing piece.
3) Convert meters to kilometers if given (e.g., 1500m -> 1.5).
4) If user provides a location without radius, ask for radius.
5) If user provides a radius without coordinates, ask for lat/lon.
6) Convert natural language dates to ISO 8601 UTC.
   - If only a day is given, use:
     from = day 00:00:00Z
     to = day 23:59:59Z
7) If no meaningful filter is present, ask what to search for.
8) “name” should be the object keyword (e.g., “wallet”, “phone”) even if user says “find my wallet”.
9) Keep numeric precision reasonable (up to 6 decimals for lat/lon).
10) If user mentions category IDs explicitly, include categoryIds. Otherwise omit it.
`;

function buildSystemInstruction(categories = []) {
  if (!Array.isArray(categories) || categories.length === 0) return SYSTEM_INSTRUCTION;
  const list = categories
    .map((cat) => `${cat.id}:${cat.name}`)
    .join(", ");
  return `${SYSTEM_INSTRUCTION}
Categories (id:name):
${list}

Rules for categories:
- If user mentions a category by name, map it to the closest matching id from the list.
- If multiple categories match, ask a clarification question.
`;
}

function getRateState() {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRateState(list) {
  localStorage.setItem(RATE_KEY, JSON.stringify(list));
}

function checkRateLimit() {
  const now = Date.now();
  const list = getRateState().filter((ts) => now - ts < 60 * 60 * 1000);
  const last = list[list.length - 1];
  if (last && now - last < 3000) {
    return { ok: false, message: "لطفاً چند ثانیه صبر کنید و دوباره تلاش کنید." };
  }
  if (list.length >= 20) {
    return { ok: false, message: "سهمیه ارسال پیام شما برای یک ساعت پر شده است." };
  }
  list.push(now);
  setRateState(list);
  return { ok: true };
}

function safeParseJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(fenced);
  } catch {
    return null;
  }
}

function loadBotState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > SESSION_TTL_MS) {
      sessionStorage.removeItem(STATE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveBotState(state) {
  try {
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({ ...state, ts: Date.now() })
    );
  } catch {
    // ignore storage errors
  }
}

export default function ChatBotPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "سلام! چی می‌خوای جستجو کنم؟" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(DEFAULT_PAGE_SIZE);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(null);
  const [lastParams, setLastParams] = useState(null);
  const [categories, setCategories] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, items, loadingItems]);

  useEffect(() => {
    const stored = loadBotState();
    if (!stored) return;
    if (Array.isArray(stored.messages) && stored.messages.length) {
      setMessages(stored.messages);
    }
    if (Array.isArray(stored.items)) {
      setItems(stored.items);
    }
    if (typeof stored.page === "number") setPage(stored.page);
    if (typeof stored.totalPages === "number") setTotalPages(stored.totalPages);
    if (typeof stored.hasNext === "boolean") setHasNext(stored.hasNext);
    if (stored.lastParams) setLastParams(stored.lastParams);
    if (stored.totalCount !== undefined) setTotalCount(stored.totalCount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCategories({ useCache: true })
      .then((list) => {
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveBotState({
      messages,
      items,
      page,
      size,
      totalPages,
      hasNext,
      lastParams,
      totalCount,
    });
  }, [messages, items, page, size, totalPages, hasNext, lastParams, totalCount]);

  function getImageSrc(value) {
    if (!value || typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("data:image/")) return trimmed;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/") && trimmed.length < 200) return trimmed;

    const base = trimmed.startsWith("data:image/")
      ? trimmed.split(",").slice(1).join(",")
      : trimmed;
    if (base.includes("\\x") || base.includes("\\")) {
      const bytes = [];
      const src = base.replace(/^data:image\/\w+;base64,/, "");
      for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (ch === "\\" && src[i + 1] === "x") {
          const hex = src.slice(i + 2, i + 4);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            bytes.push(parseInt(hex, 16));
            i += 3;
            continue;
          }
        }
        bytes.push(src.charCodeAt(i) & 0xff);
      }
      const binary = String.fromCharCode(...bytes);
      const b64 = btoa(binary);
      return `data:image/jpeg;base64,${b64}`;
    }

    let mime = "image/jpeg";
    if (trimmed.startsWith("iVBOR")) mime = "image/png";
    if (trimmed.startsWith("R0lGOD")) mime = "image/gif";
    if (trimmed.startsWith("UklGR")) mime = "image/webp";
    return `data:${mime};base64,${trimmed}`;
  }

  async function ensureSession() {
    const storedRaw = sessionStorage.getItem(SESSION_KEY);
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw);
        if (parsed?.id && parsed?.ts && Date.now() - parsed.ts < SESSION_TTL_MS) {
          return parsed.id;
        }
      } catch {
        // ignore and recreate
      }
    }
    const session = await createChatSession(
      BOT_ID,
      user?.email ? { id: user.email, name: user.name || user.email } : undefined
    );
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: session.id, ts: Date.now() })
    );
    return session.id;
  }

  function readTotalCount(meta) {
    if (!meta) return null;
    const raw =
      meta.total ??
      meta.totalItems ??
      meta.totalCount ??
      meta.count ??
      meta.itemsCount;
    return typeof raw === "number" ? raw : null;
  }

  function readTotalPages(meta, pageSize) {
    if (!meta) return 0;
    if (typeof meta.totalPages === "number") return meta.totalPages;
    const total = readTotalCount(meta);
    if (typeof total === "number" && pageSize > 0) {
      return Math.max(1, Math.ceil(total / pageSize));
    }
    return 0;
  }

  async function loadItemsPage(nextPage, params) {
    setError("");
    setLoadingItems(true);
    try {
      const response = await fetchItemsByLocationPage({
        ...params,
        page: nextPage,
        size,
      });
      setItems(response.items || []);
      const nextTotalPages = readTotalPages(response.meta, size);
      setTotalPages(nextTotalPages);
      setHasNext(
        typeof response.meta?.hasNext === "boolean"
          ? response.meta.hasNext
          : nextTotalPages
            ? nextPage + 1 < nextTotalPages
            : (response.items || []).length === size
      );
      setTotalCount(readTotalCount(response.meta));
      setPage(nextPage);
    } catch (err) {
      setItems([]);
      setHasNext(false);
      setTotalPages(0);
      setTotalCount(null);
      setError(err?.message || "خطا در دریافت نتایج.");
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const rate = checkRateLimit();
    if (!rate.ok) {
      setError(rate.message);
      return;
    }
    setError("");
    setSending(true);
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
    try {
      const sessionId = await ensureSession();
      const systemInstruction = buildSystemInstruction(categories);
      const response = await sendChatMessage(sessionId, text, systemInstruction);
      const aiText = response?.content || "";
      const parsed = safeParseJson(aiText);
      if (parsed?.ask) {
        setMessages((prev) => [...prev, { role: "assistant", content: parsed.ask }]);
        return;
      }
      const params = parsed?.params || null;
      const summary = parsed?.summary || "در حال جستجو...";
      setMessages((prev) => [...prev, { role: "assistant", content: summary }]);
      if (!params) {
        setError("پاسخ ربات قابل پردازش نیست.");
        return;
      }
      if (params.type) {
        params.type = String(params.type).toUpperCase();
      }
      if (params.categoryIds) {
        if (Array.isArray(params.categoryIds)) {
          params.categoryIds = params.categoryIds.join(",");
        } else {
          params.categoryIds = String(params.categoryIds);
        }
      }
      setLastParams(params);
      await loadItemsPage(0, params);
    } catch (err) {
      setError(err?.message || "خطا در ارتباط با ربات.");
    } finally {
      setSending(false);
    }
  }

  const resultsLabel = useMemo(() => {
    if (loadingItems) return "در حال دریافت نتایج...";
    if (!items.length) return "نتیجه‌ای یافت نشد.";
    if (typeof totalCount === "number") return `${totalCount} نتیجه یافت شد.`;
    return `${items.length} نتیجه در این صفحه یافت شد.`;
  }, [items.length, loadingItems, totalCount]);

  const pageLabel = useMemo(() => {
    if (!items.length) return "";
    if (totalPages) return `صفحه ${page + 1} از ${totalPages}`;
    return `صفحه ${page + 1}`;
  }, [items.length, page, totalPages]);

  return (
    <div className="bot-page" dir="rtl">
      <div className="bot-container">
        <header className="bot-header">
          <div className="bot-title">گفتگو با دستیار جستجو</div>
          <div className="bot-subtitle">هدف: استخراج پارامترهای جستجو</div>
        </header>

        <div className="bot-body">
          <div className="bot-chat" ref={listRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`bot-msg bot-msg--${m.role}`}>
                <div className="bot-msg__bubble">{m.content}</div>
              </div>
            ))}
            {sending ? (
              <div className="bot-msg bot-msg--assistant">
                <div className="bot-msg__bubble bot-msg__bubble--loading">
                  <span className="bot-spinner" />
                  <span>در حال دریافت پاسخ...</span>
                </div>
              </div>
            ) : null}
            {error ? <div className="bot-error">{error}</div> : null}
          </div>

          <div className="bot-results">
            <div className="bot-results__header">نتایج</div>
            <div className="bot-results__meta">{resultsLabel}</div>
            <div className="bot-results__list">
              {items.map((item) => {
                const isFound = item.type === "FOUND" || item.type === "found";
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`bot-result-card ${isFound ? "is-found" : ""}`}
                    onClick={() => setSelected(item)}
                  >
                    <div className="bot-result-title">{item.name || "—"}</div>
                    <div className="bot-result-meta">
                      {item.categoryLabel || item.category || "—"} • {isFound ? "پیداشده" : "گمشده"}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="bot-results__footer">
              <div className="bot-pagination">
                <button
                  type="button"
                  onClick={() => loadItemsPage(page - 1, lastParams)}
                  disabled={loadingItems || !lastParams || page <= 0}
                  className="btn btn-outline-secondary btn-sm"
                >
                  قبلی
                </button>
                <span className="bot-pagination__label">{pageLabel}</span>
                <button
                  type="button"
                  onClick={() => loadItemsPage(page + 1, lastParams)}
                  disabled={loadingItems || !lastParams || !hasNext}
                  className="btn btn-outline-secondary btn-sm"
                >
                  بعدی
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bot-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="مثلاً: کیف گمشده حوالی 35.7032, 51.3517 با شعاع 1500 متر از هفته پیش"
            rows={2}
          />
          <button type="button" onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? "در حال ارسال..." : "ارسال"}
          </button>
        </div>
      </div>

      {selected ? (
        <Modal title="جزئیات شیء" onClose={() => setSelected(null)}>
          <div className="item-detail__grid">
            {getImageSrc(selected.image || selected.raw?.image || "") ? (
              <div className="item-detail__image">
                <img
                  src={getImageSrc(selected.image || selected.raw?.image || "")}
                  alt={selected.name || "item"}
                />
              </div>
            ) : (
              <div className="item-detail__image item-detail__image--empty">
                تصویر موجود نیست
              </div>
            )}
            <div className="item-detail__info">
              <PreviewLine
                label="نوع"
                value={selected.type === "FOUND" || selected.type === "found" ? "پیداشده" : "گمشده"}
              />
              <div className="border-top" />
              <PreviewLine label="نام" value={selected.name || "—"} />
              <div className="border-top" />
              <PreviewLine
                label="دسته‌بندی"
                value={selected.categoryLabel || selected.category || "—"}
              />
              <div className="border-top" />
              <PreviewLine label="پروفایل مرتبط" value={selected.relatedProfile || "—"} />
              <div className="border-top" />
              <PreviewLine label="زمان ثبت" value={selected.createdAt || "—"} />
              <div className="border-top" />
              <PreviewLine label="توضیحات" value={selected.description?.trim() || "—"} />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              className="btn btn-outline-secondary px-4"
              onClick={() => nav(`/items/${selected.id}`, { state: { item: selected } })}
            >
              مشاهده صفحه کامل
            </button>
            <button
              className="btn btn-outline-secondary px-4"
              onClick={() => setSelected(null)}
            >
              بستن
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

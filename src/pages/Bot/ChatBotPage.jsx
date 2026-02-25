import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createChatSession, sendChatMessage } from "../../services/metis";
import { fetchItemsByLocation } from "../../services/products";
import "./ChatBotPage.css";

const BOT_ID = import.meta.env.VITE_METIS_BOT_ID || "1252a9cc-58fb-43d7-a8b8-386bca1466f9";
const RATE_KEY = "lf_bot_rate_v1";
const SESSION_KEY = "lf_bot_session_v1";

const SYSTEM_INSTRUCTION = `
You are a strict parameter extractor for a Lost & Found search assistant.
You DO NOT call any API. You only return parameters for the frontend to use.

API: GET /api/items/search/location
Valid parameters:
- name: string (partial match, case-insensitive)
- type: "lost" | "found"
- from: ISO 8601 datetime (created_at >= from)
- to: ISO 8601 datetime (created_at <= to)
- lat, lon, radiusKm: location trio (optional, but if any is provided, all three MUST be provided)

Output JSON only (no markdown, no extra text). Two possible outputs:

A) If enough info:
{
  "params": {
    "name": "...",
    "type": "lost",
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
`;

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

export default function ChatBotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "سلام! چی می‌خوای جستجو کنم؟" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, items, loadingItems]);

  async function ensureSession() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const session = await createChatSession(BOT_ID, user?.email ? { id: user.email, name: user.name || user.email } : undefined);
    sessionStorage.setItem(SESSION_KEY, session.id);
    return session.id;
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
      const response = await sendChatMessage(sessionId, text, SYSTEM_INSTRUCTION);
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
      setLoadingItems(true);
      const results = await fetchItemsByLocation(params);
      setItems(results);
    } catch (err) {
      setError(err?.message || "خطا در ارتباط با ربات.");
    } finally {
      setSending(false);
      setLoadingItems(false);
    }
  }

  const resultsLabel = useMemo(() => {
    if (loadingItems) return "در حال دریافت نتایج...";
    if (!items.length) return "نتیجه‌ای یافت نشد.";
    return `${items.length} نتیجه یافت شد.`;
  }, [items.length, loadingItems]);

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
            {error ? <div className="bot-error">{error}</div> : null}
          </div>

          <div className="bot-results">
            <div className="bot-results__header">نتایج</div>
            <div className="bot-results__meta">{resultsLabel}</div>
            <div className="bot-results__list">
              {items.map((item) => (
                <div key={item.id} className="bot-result-card">
                  <div className="bot-result-title">{item.name || "—"}</div>
                  <div className="bot-result-meta">
                    {item.categoryLabel || item.category || "—"} • {item.type === "lost" ? "گمشده" : "پیداشده"}
                  </div>
                </div>
              ))}
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
    </div>
  );
}

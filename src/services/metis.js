import { notifyError } from "./notify";

const METIS_BASE_URL = import.meta.env.VITE_METIS_BASE_URL || "https://api.metisai.ir";

function authHeaders() {
  const apiKey = import.meta.env.VITE_METIS_API_KEY;
  if (!apiKey) return {};
  return { Authorization: `Bearer ${apiKey}` };
}

export async function createChatSession(botId, user) {
  console.log("[metis] createChatSession", { botId, baseUrl: METIS_BASE_URL, hasKey: Boolean(import.meta.env.VITE_METIS_API_KEY) });
  const response = await fetch(`${METIS_BASE_URL}/api/v1/chat/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ botId, user }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.detail || "خطا در ساخت گفتگو.");
    error.status = response.status;
    error.data = data;
    notifyError(error.message);
    throw error;
  }
  return data;
}

export async function sendChatMessage(sessionId, message, messageSystemInstruction) {
  console.log("[metis] sendChatMessage", {
    sessionId,
    url: `${METIS_BASE_URL}/api/v1/chat/session/${sessionId}/message`,
    hasKey: Boolean(import.meta.env.VITE_METIS_API_KEY),
  });
  const response = await fetch(
    `${METIS_BASE_URL}/api/v1/chat/session/${sessionId}/message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        message: { content: message, type: "USER" },
        messageSystemInstruction,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.detail || "خطا در ارسال پیام.");
    error.status = response.status;
    error.data = data;
    notifyError(error.message);
    throw error;
  }
  return data;
}

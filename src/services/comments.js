import { getAccessToken } from "./auth";

const COMMENTS_API_BASE_URL =
  import.meta.env.VITE_COMMENTS_API_BASE_URL ||
  import.meta.env.VITE_PRODUCTS_API_BASE_URL ||
  "https://sharif-lostfound.liara.run";

function normalizeCommentsResponse(payload) {
  return payload?.data || payload || {};
}

export async function fetchComments(itemId, { page = 0, size = 20 } = {}) {
  const endpoint = `/api/product/${itemId}/comments?page=${page}&size=${size}`;
  const response = await fetch(`${COMMENTS_API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.detail || "خطا در دریافت نظرات.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return normalizeCommentsResponse(data);
}

export async function createComment(itemId, { text, parentCommentId = null }) {
  const accessToken = getAccessToken();
  const endpoint = `/api/product/${itemId}/comments`;
  const response = await fetch(`${COMMENTS_API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ text, parentCommentId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.detail || "خطا در ثبت نظر.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return normalizeCommentsResponse(data);
}

export async function reportComment(itemId, commentId, cause) {
  const accessToken = getAccessToken();
  const endpoint = `/api/product/${itemId}/comments/${commentId}/report`;
  const response = await fetch(`${COMMENTS_API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ cause }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.detail || "خطا در گزارش نظر.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

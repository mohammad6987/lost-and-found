const STORAGE_KEY = "lf_comments_v1";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function makeId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function fetchComments(itemId, { limit = 20, offset = 0 } = {}) {
  await sleep(150);
  const store = loadStore();
  const all = Array.isArray(store[itemId]) ? store[itemId] : [];
  return {
    results: all.slice(offset, offset + limit),
    count: all.length,
  };
}

export async function createComment(itemId, { text, author }) {
  await sleep(150);
  const store = loadStore();
  const list = Array.isArray(store[itemId]) ? store[itemId] : [];
  const comment = {
    id: makeId(),
    itemId,
    text,
    author,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    reports: 0,
  };
  const next = [comment, ...list];
  store[itemId] = next;
  saveStore(store);
  return comment;
}

export async function likeComment(itemId, commentId) {
  await sleep(120);
  return updateComment(itemId, commentId, (c) => ({
    ...c,
    likes: (c.likes || 0) + 1,
  }));
}

export async function dislikeComment(itemId, commentId) {
  await sleep(120);
  return updateComment(itemId, commentId, (c) => ({
    ...c,
    dislikes: (c.dislikes || 0) + 1,
  }));
}

export async function reportComment(itemId, commentId) {
  await sleep(120);
  return updateComment(itemId, commentId, (c) => ({
    ...c,
    reports: (c.reports || 0) + 1,
  }));
}

function updateComment(itemId, commentId, updater) {
  const store = loadStore();
  const list = Array.isArray(store[itemId]) ? store[itemId] : [];
  const idx = list.findIndex((c) => c.id === commentId);
  if (idx === -1) return null;
  const updated = updater(list[idx]);
  const next = [...list];
  next[idx] = updated;
  store[itemId] = next;
  saveStore(store);
  return updated;
}

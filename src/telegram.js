// Telegram approval bot. No server required: the scheduled Action polls getUpdates,
// sees which buttons you tapped, and acts. Drafts are sent as a photo + caption with
// Approve / Redo / Skip buttons.
import { readFileSync } from "node:fs";
import { CONFIG, has } from "./config.js";
import { imagePath } from "./state.js";

const API = (method) => `https://api.telegram.org/bot${CONFIG.telegram.token}/${method}`;

export function telegramReady() {
  return has(CONFIG.telegram.token) && has(CONFIG.telegram.chatId);
}

async function call(method, body) {
  const r = await fetch(API(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.warn(`[telegram] ${method} failed:`, data.description || r.status);
  return data;
}

// Send a plain text message.
export function sendMessage(text, extra = {}) {
  return call("sendMessage", {
    chat_id: CONFIG.telegram.chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

// Send the draft: branded image + caption preview + action buttons.
export async function sendDraft(post) {
  const form = new FormData();
  form.append("chat_id", CONFIG.telegram.chatId);
  const img = readFileSync(imagePath(post.imageFile));
  form.append("photo", new Blob([img], { type: "image/png" }), post.imageFile);

  const header = `🗓 <b>Draft for ${post.platform.toUpperCase()}</b>  ·  ${post.pillar}`;
  const preview = post.caption.length > 850 ? post.caption.slice(0, 840) + "…" : post.caption;
  const footer = "⏱ <i>Checked every ~5 min — after you tap ✅ it can take a few minutes before the upload confirmation arrives.</i>";
  form.append("caption", `${header}\n\n${escapeHtml(preview)}\n\n${footer}`);
  form.append("parse_mode", "HTML");
  form.append(
    "reply_markup",
    JSON.stringify({
      inline_keyboard: [
        [
          { text: "✅ Approve & post", callback_data: `approve:${post.id}` },
          { text: "❌ Skip", callback_data: `skip:${post.id}` },
        ],
        [{ text: "✏️ Redo (new draft)", callback_data: `redo:${post.id}` }],
      ],
    }),
  );

  const r = await fetch(API("sendPhoto"), { method: "POST", body: form });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.warn("[telegram] sendPhoto failed:", data.description);
  return data.result?.message_id || null;
}

export async function getWebhookInfo() {
  const r = await fetch(API("getWebhookInfo"));
  const data = await r.json().catch(() => ({}));
  return data.result || {};
}

export async function getMe() {
  const r = await fetch(API("getMe"));
  const data = await r.json().catch(() => ({}));
  return data.result || {};
}

// Pull new updates since offset. Returns { updates, newOffset }.
export async function getUpdates(offset) {
  const data = await call("getUpdates", {
    offset: offset ? offset + 1 : undefined,
    timeout: 0,
    allowed_updates: ["callback_query"],
  });
  const updates = data.result || [];
  const newOffset = updates.length ? updates[updates.length - 1].update_id : offset;
  return { updates, newOffset };
}

export function answerCallback(id, text) {
  return call("answerCallbackQuery", { callback_query_id: id, text: text || "" });
}

// Update the draft message to show the decision (removes buttons).
export function markDecision(messageId, label) {
  return call("editMessageReplyMarkup", {
    chat_id: CONFIG.telegram.chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [[{ text: label, callback_data: "noop" }]] },
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

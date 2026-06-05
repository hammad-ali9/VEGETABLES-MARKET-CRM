/**
 * openwa.js — REST client for the OpenWA gateway.
 *
 * Reads VITE_OPENWA_URL (e.g. https://openwa-xxxx.up.railway.app/api)
 * and VITE_OPENWA_KEY (operator API key generated via Swagger).
 */

const BASE = import.meta.env.VITE_OPENWA_URL;
const KEY  = import.meta.env.VITE_OPENWA_KEY;

const req = async (path, opts = {}) => {
  if (!BASE) throw new Error('VITE_OPENWA_URL not configured');
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(KEY ? { 'X-API-Key': KEY } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`OpenWA ${r.status} ${path}: ${text}`);
  }
  return r.status === 204 ? null : r.json();
};

// ─── Sessions ────────────────────────────────────────────────────────────────
export const listSessions   = ()      => req('/sessions');
export const createSession  = (body)  => req('/sessions', { method: 'POST', body: JSON.stringify(body) });
export const getSession     = (id)    => req(`/sessions/${id}`);
export const deleteSession  = (id)    => req(`/sessions/${id}`, { method: 'DELETE' });
export const startSession   = (id)    => req(`/sessions/${id}/start`, { method: 'POST' });
export const stopSession    = (id)    => req(`/sessions/${id}/stop`, { method: 'POST' });
export const getQr          = (id)    => req(`/sessions/${id}/qr`);

// ─── Contacts ────────────────────────────────────────────────────────────────
export const checkNumberOnWA = (sid, number) =>
  req(`/sessions/${sid}/contacts/check/${encodeURIComponent(number)}`);

// ─── Single-message sends ────────────────────────────────────────────────────
export const sendText = (sid, chatId, text) =>
  req(`/sessions/${sid}/messages/send-text`, {
    method: 'POST',
    body: JSON.stringify({ chatId, text }),
  });

export const sendImage = (sid, chatId, image, caption) =>
  req(`/sessions/${sid}/messages/send-image`, {
    method: 'POST',
    body: JSON.stringify({ chatId, image, caption }),
  });

// ─── Bulk campaigns ──────────────────────────────────────────────────────────
/**
 * @param {string} sid  session id
 * @param {{
 *   batchId?: string,
 *   messages: Array<{ chatId: string, type: 'text'|'image'|'video'|'audio'|'document',
 *                     content: { text?: string, caption?: string, image?: any, video?: any,
 *                                audio?: any, document?: any },
 *                     variables?: Record<string,string> }>,
 *   options?: { delayBetweenMessages?: number, randomizeDelay?: boolean, stopOnError?: boolean }
 * }} body
 */
export const sendBulk = (sid, body) =>
  req(`/sessions/${sid}/messages/send-bulk`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getBatchStatus = (sid, batchId) =>
  req(`/sessions/${sid}/messages/batch/${batchId}`);

export const cancelBatch = (sid, batchId) =>
  req(`/sessions/${sid}/messages/batch/${batchId}/cancel`, { method: 'POST' });

// ─── Webhooks ────────────────────────────────────────────────────────────────
export const listWebhooks  = (sid)             => req(`/sessions/${sid}/webhooks`);
export const createWebhook = (sid, body)       => req(`/sessions/${sid}/webhooks`, {
  method: 'POST',
  body: JSON.stringify(body),
});
export const deleteWebhook = (sid, id)         => req(`/sessions/${sid}/webhooks/${id}`, { method: 'DELETE' });
export const testWebhook   = (sid, id)         => req(`/sessions/${sid}/webhooks/${id}/test`, { method: 'POST' });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a Pakistan phone number to WhatsApp chat ID format. */
export const phoneToChatId = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  // 03001234567 -> 923001234567
  const intl = digits.startsWith('0') ? '92' + digits.slice(1)
    : digits.startsWith('92') ? digits
    : digits.length === 10 ? '92' + digits
    : digits;
  return `${intl}@c.us`;
};

/** Render `{{var}}` placeholders. */
export const renderTemplate = (body, vars = {}) =>
  String(body || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');

/** Build send-bulk payload from a template + audience rows. */
export const buildBulkPayload = ({ template, audience, sampleVars = () => ({}), options }) => ({
  messages: audience.map((row) => {
    const vars = sampleVars(row);
    return {
      chatId: phoneToChatId(row.phone),
      type: 'text',
      content: { text: renderTemplate(template.body, vars) },
      variables: vars,
    };
  }).filter((m) => m.chatId),
  options: {
    delayBetweenMessages: 3000,
    randomizeDelay: true,
    stopOnError: false,
    ...options,
  },
});

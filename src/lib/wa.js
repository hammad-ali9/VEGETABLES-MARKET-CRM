/**
 * wa.js — Supabase data access for WhatsApp marketing tables.
 * Mirrors db.js patterns: snake_case columns, camelCase JS, ilike for fuzzy lookup.
 */

import { supabase } from './supabase';

const nowIso = () => new Date().toISOString();

// ─── Sessions ────────────────────────────────────────────────────────────────

export const fetchWaSessions = async () => {
  const { data, error } = await supabase
    .from('wa_sessions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((s) => ({
    id: s.id,
    openwaId: s.openwa_id,
    label: s.label,
    phone: s.phone || '',
    status: s.status,
    lastQr: s.last_qr,
    lastStatusAt: s.last_status_at,
    createdAt: s.created_at,
  }));
};

export const upsertWaSession = async (row) => {
  const { error } = await supabase.from('wa_sessions').upsert({
    id:        row.id,
    openwa_id: row.openwaId,
    label:     row.label,
    phone:     row.phone || null,
    status:    row.status || 'pending',
    last_qr:   row.lastQr || null,
    last_status_at: row.lastStatusAt || null,
    created_by: row.createdBy || null,
  }, { onConflict: 'id' });
  if (error) throw error;
};

export const deleteWaSession = async (id) => {
  const { error } = await supabase.from('wa_sessions').delete().eq('id', id);
  if (error) throw error;
};

// ─── Templates ───────────────────────────────────────────────────────────────

export const fetchWaTemplates = async () => {
  const { data, error } = await supabase
    .from('wa_templates').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((t) => ({
    id: t.id,
    name: t.name,
    nameUr: t.name_ur || '',
    body: t.body,
    variables: t.variables || [],
    category: t.category || 'marketing',
    createdAt: t.created_at,
  }));
};

export const upsertWaTemplate = async (tpl) => {
  const { data, error } = await supabase.from('wa_templates').upsert({
    id:        tpl.id || crypto.randomUUID(),
    name:      tpl.name,
    name_ur:   tpl.nameUr || null,
    body:      tpl.body,
    variables: tpl.variables || [],
    category:  tpl.category || 'marketing',
    created_by: tpl.createdBy || null,
  }, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
};

export const deleteWaTemplate = async (id) => {
  const { error } = await supabase.from('wa_templates').delete().eq('id', id);
  if (error) throw error;
};

// Extract `{{var}}` names from a template body.
export const extractVariables = (body) => {
  const set = new Set();
  String(body || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => { set.add(k); return ''; });
  return [...set];
};

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const fetchWaCampaigns = async () => {
  const { data, error } = await supabase
    .from('wa_campaigns').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCampaignRow);
};

export const fetchWaCampaign = async (id) => {
  const { data, error } = await supabase.from('wa_campaigns').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapCampaignRow(data) : null;
};

const mapCampaignRow = (c) => ({
  id: c.id,
  name: c.name,
  sessionId: c.session_id,
  templateId: c.template_id,
  audience: c.audience || {},
  scheduledAt: c.scheduled_at,
  startedAt: c.started_at,
  finishedAt: c.finished_at,
  status: c.status,
  openwaBatchId: c.openwa_batch_id,
  total: c.total || 0,
  sent: c.sent || 0,
  delivered: c.delivered || 0,
  read: c.read || 0,
  replied: c.replied || 0,
  failed: c.failed || 0,
  createdAt: c.created_at,
});

export const createWaCampaign = async (c) => {
  const row = {
    id: c.id || crypto.randomUUID(),
    name: c.name,
    session_id: c.sessionId,
    template_id: c.templateId,
    audience: c.audience || {},
    scheduled_at: c.scheduledAt || null,
    status: c.status || 'draft',
    total: c.total || 0,
    created_by: c.createdBy || null,
  };
  const { data, error } = await supabase.from('wa_campaigns').insert(row).select().single();
  if (error) throw error;
  return mapCampaignRow(data);
};

export const updateWaCampaign = async (id, patch) => {
  const allowed = {
    name: 'name',
    status: 'status',
    openwaBatchId: 'openwa_batch_id',
    startedAt: 'started_at',
    finishedAt: 'finished_at',
    total: 'total',
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    replied: 'replied',
    failed: 'failed',
  };
  const row = {};
  for (const [k, col] of Object.entries(allowed)) {
    if (k in patch) row[col] = patch[k];
  }
  const { error } = await supabase.from('wa_campaigns').update(row).eq('id', id);
  if (error) throw error;
};

export const deleteWaCampaign = async (id) => {
  const { error } = await supabase.from('wa_campaigns').delete().eq('id', id);
  if (error) throw error;
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const insertCampaignMessages = async (campaignId, sessionId, rows) => {
  const payload = rows.map((r) => ({
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    session_id: sessionId,
    contact_id: r.contactId || null,
    contact_type: r.contactType || null,
    phone: r.phone,
    chat_id: r.chatId || null,
    direction: 'out',
    body: r.body || null,
    status: 'queued',
  }));
  if (!payload.length) return;
  // Supabase has a 1000-row insert limit; chunk if needed.
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await supabase.from('wa_messages').insert(chunk);
    if (error) throw error;
  }
};

export const fetchCampaignMessages = async (campaignId, { limit = 500 } = {}) => {
  const { data, error } = await supabase
    .from('wa_messages').select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

// Campaign aggregate stats from wa_messages (use when webhook may lag).
export const fetchCampaignStats = async (campaignId) => {
  const { data, error } = await supabase
    .from('wa_messages')
    .select('status', { count: 'exact' })
    .eq('campaign_id', campaignId);
  if (error) throw error;
  const tally = { queued: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  (data || []).forEach((m) => { tally[m.status] = (tally[m.status] || 0) + 1; });
  return tally;
};

// ─── Inbox ───────────────────────────────────────────────────────────────────

export const fetchInboxThreads = async ({ sessionId, limit = 50 } = {}) => {
  let q = supabase.from('wa_inbox_threads').select('*').order('last_at', { ascending: false }).limit(limit);
  if (sessionId) q = q.eq('session_id', sessionId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

export const fetchThreadMessages = async (sessionId, chatId, { limit = 100 } = {}) => {
  const { data, error } = await supabase
    .from('wa_messages')
    .select('*')
    .eq('session_id', sessionId)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
};

export const markThreadRead = async (threadId) => {
  const { error } = await supabase.from('wa_inbox_threads').update({ unread_count: 0 }).eq('id', threadId);
  if (error) throw error;
};

// ─── Opt-outs ────────────────────────────────────────────────────────────────

export const fetchOptouts = async () => {
  const { data, error } = await supabase.from('wa_optouts').select('phone');
  if (error) throw error;
  return new Set((data || []).map((r) => r.phone));
};

export const addOptout = async (phone, reason) => {
  const { error } = await supabase.from('wa_optouts').upsert({ phone, reason: reason || null }, { onConflict: 'phone' });
  if (error) throw error;
};

// ─── Audience helpers ────────────────────────────────────────────────────────

/** Build an audience list from suppliers + customers by filter spec. */
export const resolveAudience = async (spec = {}) => {
  const { groups = ['supplier', 'customer'], cities = [], ids = [] } = spec;
  const optouts = await fetchOptouts();
  const rows = [];

  if (groups.includes('supplier')) {
    let q = supabase.from('suppliers').select('id, name, phone, city');
    if (cities.length) q = q.in('city', cities);
    if (ids.length)    q = q.in('id', ids);
    const { data, error } = await q;
    if (error) throw error;
    (data || []).forEach((s) => s.phone && rows.push({
      contactId: s.id, contactType: 'supplier', name: s.name, phone: s.phone, city: s.city || '',
    }));
  }

  if (groups.includes('customer')) {
    let q = supabase.from('customers').select('id, name, phone');
    if (ids.length) q = q.in('id', ids);
    const { data, error } = await q;
    if (error) throw error;
    (data || []).forEach((c) => c.phone && rows.push({
      contactId: c.id, contactType: 'customer', name: c.name, phone: c.phone, city: '',
    }));
  }

  // Drop opt-outs + dedupe by phone
  const seen = new Set();
  return rows.filter((r) => {
    if (optouts.has(r.phone)) return false;
    if (seen.has(r.phone)) return false;
    seen.add(r.phone);
    return true;
  });
};

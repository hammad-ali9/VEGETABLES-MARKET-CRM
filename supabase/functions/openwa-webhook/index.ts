/**
 * OpenWA → Supabase webhook receiver.
 *
 * Deploy:
 *   supabase functions deploy openwa-webhook --no-verify-jwt
 *   supabase secrets set OPENWA_WEBHOOK_SECRET=<same secret configured in OpenWA>
 *
 * Configure in OpenWA dashboard / API:
 *   POST /api/sessions/:id/webhooks
 *   { "url": "https://<project>.supabase.co/functions/v1/openwa-webhook",
 *     "secret": "<OPENWA_WEBHOOK_SECRET>",
 *     "events": ["message.received","message.sent","message.ack","session.qr",
 *                "session.status","session.authenticated","session.disconnected"] }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SECRET = Deno.env.get('OPENWA_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function verifySignature(raw: string, sigHeader: string | null) {
  if (!SECRET || !sigHeader) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Constant-time compare
  const a = sigHeader.replace(/^sha256=/, '');
  if (a.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= a.charCodeAt(i) ^ hex.charCodeAt(i);
  return diff === 0;
}

const ackStatus: Record<number, string> = { 2: 'delivered', 3: 'read' };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const raw = await req.text();
  const ok = await verifySignature(raw, req.headers.get('x-openwa-signature'));
  if (!ok) return new Response('bad signature', { status: 401 });

  let evt: any;
  try { evt = JSON.parse(raw); }
  catch { return new Response('bad json', { status: 400 }); }

  const eventType: string = evt.event || evt.type || 'unknown';
  const sessionOpenwaId: string | undefined = evt.sessionId || evt.session_id;
  const data = evt.data || evt.payload || evt;

  // Always audit
  await sb.from('wa_webhook_events').insert({
    event_type: eventType,
    session_id: sessionOpenwaId ?? null,
    payload: evt,
  });

  // Lookup internal session uuid (best-effort)
  let sessionUuid: string | null = null;
  if (sessionOpenwaId) {
    const { data: s } = await sb.from('wa_sessions').select('id').eq('openwa_id', sessionOpenwaId).maybeSingle();
    sessionUuid = s?.id ?? null;
  }

  try {
    switch (eventType) {
      case 'message.sent': {
        // Map outbound ack → mark our queued message as sent
        if (data.id) {
          await sb.from('wa_messages')
            .update({ status: 'sent', sent_at: new Date().toISOString(), wa_message_id: data.id })
            .eq('chat_id', data.to)
            .eq('status', 'queued')
            .limit(1);
        }
        break;
      }

      case 'message.ack': {
        const next = ackStatus[data.ack];
        if (!next || !data.id) break;
        const patch: Record<string, unknown> = { status: next };
        patch[`${next}_at`] = new Date().toISOString();
        await sb.from('wa_messages').update(patch).eq('wa_message_id', data.id);
        break;
      }

      case 'message.received': {
        const from: string = data.from || '';
        const phone = from.split('@')[0];
        const body: string = data.body || '';

        await sb.from('wa_messages').insert({
          session_id: sessionUuid,
          phone,
          chat_id: from,
          direction: 'in',
          body,
          wa_message_id: data.id,
        });

        await sb.from('wa_inbox_threads').upsert({
          session_id: sessionUuid,
          chat_id: from,
          contact_name: data.notifyName || null,
          last_body: body,
          last_at: new Date().toISOString(),
          unread_count: 1,
        }, { onConflict: 'session_id,chat_id' });

        // Opt-out detection (English + Urdu/Roman)
        const norm = body.trim().toLowerCase();
        if (['stop', 'unsubscribe', 'بند کرو', 'band karo', 'band kro'].some((k) => norm.includes(k))) {
          await sb.from('wa_optouts').upsert({ phone, reason: body.slice(0, 200) }, { onConflict: 'phone' });
        }
        break;
      }

      case 'session.qr': {
        if (sessionUuid) {
          await sb.from('wa_sessions')
            .update({ status: 'qr', last_qr: data.qrCode || null, last_status_at: new Date().toISOString() })
            .eq('id', sessionUuid);
        }
        break;
      }

      case 'session.authenticated':
      case 'session.disconnected':
      case 'session.status': {
        const status = eventType === 'session.status' ? (data.status || 'unknown')
          : eventType.split('.')[1];
        if (sessionUuid) {
          await sb.from('wa_sessions')
            .update({ status, last_status_at: new Date().toISOString() })
            .eq('id', sessionUuid);
        }
        break;
      }
    }
  } catch (err) {
    console.error('handler error', err);
    // Still 200 so OpenWA does not retry-storm; audit row already saved.
  }

  return new Response('ok');
});

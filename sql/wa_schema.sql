-- WhatsApp Marketing schema for Mandi CRM
-- Run in Supabase SQL Editor. Safe to re-run (CREATE IF NOT EXISTS).

create extension if not exists "pgcrypto";

-- 1. WhatsApp sessions (one per WA number on the gateway)
create table if not exists wa_sessions (
  id              uuid primary key default gen_random_uuid(),
  openwa_id       text unique not null,
  label           text not null,
  phone           text,
  status          text default 'pending',
  last_qr         text,
  last_status_at  timestamptz,
  created_by      uuid references app_users(id),
  created_at      timestamptz default now()
);

-- 2. Reusable message templates
create table if not exists wa_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_ur     text,
  body        text not null,
  variables   text[] default '{}',
  category    text default 'marketing',
  created_by  uuid references app_users(id),
  created_at  timestamptz default now()
);

-- 3. Campaigns (broadcasts)
create table if not exists wa_campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  session_id        uuid references wa_sessions(id),
  template_id       uuid references wa_templates(id),
  audience          jsonb not null default '{}'::jsonb,
  scheduled_at      timestamptz,
  started_at        timestamptz,
  finished_at       timestamptz,
  status            text default 'draft',
  openwa_batch_id   text,
  total             int default 0,
  sent              int default 0,
  delivered         int default 0,
  read              int default 0,
  replied           int default 0,
  failed            int default 0,
  created_by        uuid references app_users(id),
  created_at        timestamptz default now()
);
create index if not exists wa_campaigns_status_idx on wa_campaigns(status);
create index if not exists wa_campaigns_scheduled_idx on wa_campaigns(scheduled_at);

-- 4. Per-recipient log (both outbound and inbound)
create table if not exists wa_messages (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references wa_campaigns(id) on delete set null,
  session_id      uuid references wa_sessions(id),
  contact_id      uuid,
  contact_type    text,
  phone           text not null,
  chat_id         text,
  direction       text not null check (direction in ('out','in')),
  body            text,
  media_url       text,
  wa_message_id   text,
  status          text default 'queued',
  error           text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  read_at         timestamptz,
  created_at      timestamptz default now()
);
create index if not exists wa_messages_campaign_idx on wa_messages(campaign_id);
create index if not exists wa_messages_phone_idx on wa_messages(phone);
create index if not exists wa_messages_chat_idx on wa_messages(chat_id, created_at desc);
create index if not exists wa_messages_wa_id_idx on wa_messages(wa_message_id);

-- 5. Inbox threads (one row per (session, chatId))
create table if not exists wa_inbox_threads (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references wa_sessions(id),
  chat_id       text not null,
  contact_name  text,
  last_body     text,
  last_at       timestamptz,
  unread_count  int default 0,
  unique (session_id, chat_id)
);
create index if not exists wa_inbox_last_at_idx on wa_inbox_threads(last_at desc);

-- 6. Raw webhook events (audit + replay)
create table if not exists wa_webhook_events (
  id          bigserial primary key,
  event_type  text not null,
  session_id  text,
  payload     jsonb not null,
  received_at timestamptz default now()
);
create index if not exists wa_webhook_events_type_idx on wa_webhook_events(event_type, received_at desc);

-- 7. Opt-out list (STOP / بند کرو received)
create table if not exists wa_optouts (
  phone       text primary key,
  reason      text,
  opted_out_at timestamptz default now()
);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Match existing Mandi CRM pattern (RLS disabled, auth handled in app via app_users)
alter table wa_sessions        disable row level security;
alter table wa_templates       disable row level security;
alter table wa_campaigns       disable row level security;
alter table wa_messages        disable row level security;
alter table wa_inbox_threads   disable row level security;
alter table wa_webhook_events  disable row level security;
alter table wa_optouts         disable row level security;

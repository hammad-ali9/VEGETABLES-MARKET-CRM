-- Partners & Investors tables
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS partners (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  role          text        NOT NULL DEFAULT 'Partner',
  share_percent numeric(5,2) NOT NULL DEFAULT 0,
  join_date     date,
  phone         text        NOT NULL DEFAULT '',
  notes         text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'active',
  added_by      text        NOT NULL DEFAULT '',
  added_at_str  text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_payments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    uuid        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  date          date        NOT NULL,
  amount        numeric     NOT NULL DEFAULT 0,
  notes         text        NOT NULL DEFAULT '',
  added_by      text        NOT NULL DEFAULT '',
  added_at_str  text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_payments_partner_id ON partner_payments (partner_id);

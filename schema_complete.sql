-- =============================================================================
-- Mandi CRM — Complete Database Schema
-- Run this in the Supabase SQL Editor on a fresh project.
-- Safe to re-run: all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- 1. SUPPLIERS ─────────────────────────────────────────────────────────────────
-- One row per produce trader/supplier (بیوپاری)
CREATE TABLE IF NOT EXISTS suppliers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  city          text        NOT NULL DEFAULT '',
  phone         text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'active',   -- 'active' | 'inactive'
  supplier_code text        NOT NULL DEFAULT '',          -- e.g. S0001
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name_lower ON suppliers (lower(name));

-- 2. CUSTOMERS ─────────────────────────────────────────────────────────────────
-- One row per buyer (خریدار)
CREATE TABLE IF NOT EXISTS customers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  phone         text        NOT NULL DEFAULT '',
  nickname      text        NOT NULL DEFAULT '',
  address       text,
  customer_code text        NOT NULL DEFAULT '',          -- e.g. C0001
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON customers (lower(name));

-- 3. TRUCK RECORDS ─────────────────────────────────────────────────────────────
-- One row per truck load (supplier side — goods IN)
CREATE TABLE IF NOT EXISTS truck_records (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     uuid        REFERENCES suppliers(id) ON DELETE SET NULL,
  truck_no        text        NOT NULL DEFAULT '',
  loading_date    date        NOT NULL,
  builty_no       text,                                    -- bill of lading / بلٹی
  carriage        numeric     NOT NULL DEFAULT 0,          -- laga / market fee per crate × crates
  truck_fare      numeric     NOT NULL DEFAULT 0,          -- freight paid to transporter
  labour_charges  numeric     NOT NULL DEFAULT 0,          -- loading/unloading labour
  advance         numeric     NOT NULL DEFAULT 0,          -- pre-payment applied from supplier_advances
  advance_date    date,
  bardana         numeric     NOT NULL DEFAULT 0,          -- packaging/sack deduction
  bardana_date    date,
  sale_date       date,
  parties         jsonb       NOT NULL DEFAULT '[]',
  -- parties JSON shape: [{ "id": "0", "personName": "Ali", "crates": 100, "rate": 60 }, ...]
  payment_mode    text        NOT NULL DEFAULT 'Credit',   -- 'Cash' | 'Credit' | 'Bank'
  remarks         text,
  added_by        text,
  added_at_str    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_truck_records_supplier    ON truck_records (supplier_id);
CREATE INDEX IF NOT EXISTS idx_truck_records_loading     ON truck_records (loading_date DESC);

-- 4. CUSTOMER SALES ────────────────────────────────────────────────────────────
-- One row per buyer per truck load (customer side — goods OUT)
CREATE TABLE IF NOT EXISTS customer_sales (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid        REFERENCES customers(id)     ON DELETE SET NULL,
  truck_record_id uuid        REFERENCES truck_records(id) ON DELETE CASCADE,
  date            date        NOT NULL,
  crates          numeric     NOT NULL DEFAULT 0,
  rate            numeric     NOT NULL DEFAULT 0,           -- price per crate
  bill_no         text        NOT NULL DEFAULT '',
  comm_percent    numeric     NOT NULL DEFAULT 7.25,        -- agency commission %
  wari_rate       numeric     NOT NULL DEFAULT 5,           -- نگواری per crate (Rs.)
  advance         numeric     NOT NULL DEFAULT 0,           -- advance paid by this buyer
  advance_method  text        NOT NULL DEFAULT 'Cash',
  payment_mode    text        NOT NULL DEFAULT 'Cash',      -- 'Cash' | 'Credit'
  discount        numeric     NOT NULL DEFAULT 0,
  added_by        text,
  added_at_str    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_sales_truck    ON customer_sales (truck_record_id);
CREATE INDEX IF NOT EXISTS idx_customer_sales_customer ON customer_sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sales_date     ON customer_sales (date DESC);

-- 5. SUPPLIER ADVANCES ─────────────────────────────────────────────────────────
-- Pre-payments given to suppliers before the truck arrives (پیشگی / بیانہ)
CREATE TABLE IF NOT EXISTS supplier_advances (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id   uuid        REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name text        NOT NULL,
  date          date        NOT NULL,
  amount        numeric     NOT NULL DEFAULT 0,             -- total advance given
  used          numeric     NOT NULL DEFAULT 0,             -- portion deducted so far
  remaining     numeric     NOT NULL DEFAULT 0,             -- amount - used
  notes         text,
  applied_to    text[]      NOT NULL DEFAULT '{}',          -- array of truck_record IDs
  added_by      text,
  added_at_str  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_advances_supplier ON supplier_advances (supplier_id);

-- 6. EXPENSES ──────────────────────────────────────────────────────────────────
-- Operating expenses categorised by type (اخراجات)
CREATE TABLE IF NOT EXISTS expenses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         date        NOT NULL,
  type         text        NOT NULL DEFAULT 'other',
  -- type values: 'labour' | 'utility' | 'food' | 'salary' | 'rent' | 'parking' | 'other'
  amount       numeric     NOT NULL DEFAULT 0,
  notes        text        NOT NULL DEFAULT '',
  -- notes stores: "Name · Role · Period" (e.g. "Ali · Loader · Monthly")
  added_by     text,
  added_at_str text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses (type);

-- 7. APP USERS ─────────────────────────────────────────────────────────────────
-- Custom authentication table (NOT Supabase Auth).
-- Passwords stored in plaintext — enforce app-level access control.
CREATE TABLE IF NOT EXISTS app_users (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text        NOT NULL,
  email     text        UNIQUE,
  password  text,
  role      text        NOT NULL DEFAULT 'Salesman',  -- 'Admin' | 'Salesman'
  status    text        NOT NULL DEFAULT 'active',    -- 'active' | 'inactive'
  added_at  timestamptz NOT NULL DEFAULT now()        -- queried in fetchAppUsers
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- The app uses a custom app_users table (not Supabase Auth), so all RLS is
-- disabled. Every request goes through the publishable (anon) key.
-- =============================================================================
ALTER TABLE suppliers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE truck_records     DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sales    DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_advances DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_users         DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MIGRATION PATCH (run this if upgrading an existing DB)
-- Safe to run even if columns already exist.
-- =============================================================================

-- truck_records additions
ALTER TABLE truck_records
  ADD COLUMN IF NOT EXISTS sale_date      date,
  ADD COLUMN IF NOT EXISTS advance_date   date,
  ADD COLUMN IF NOT EXISTS bardana        numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bardana_date   date;

-- customer_sales additions
ALTER TABLE customer_sales
  ADD COLUMN IF NOT EXISTS truck_record_id uuid REFERENCES truck_records(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS comm_percent    numeric NOT NULL DEFAULT 7.25,
  ADD COLUMN IF NOT EXISTS wari_rate       numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS advance_method  text    NOT NULL DEFAULT 'Cash',
  ADD COLUMN IF NOT EXISTS discount        numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customer_sales_truck ON customer_sales (truck_record_id);

-- supplier_advances (create if doesn't exist — already in full CREATE above,
-- but ALTER handles missing columns if table was created partially)
ALTER TABLE supplier_advances
  ADD COLUMN IF NOT EXISTS supplier_name text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS amount        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used          numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining     numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applied_to    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS added_by      text,
  ADD COLUMN IF NOT EXISTS added_at_str  text;

-- app_users: added_at is required by fetchAppUsers ORDER BY added_at
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS added_at timestamptz DEFAULT now();

-- 8. PARTNERS ─────────────────────────────────────────────────────────────────
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

-- 9. PARTNER PAYMENTS ─────────────────────────────────────────────────────────
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

-- =============================================================================
-- SEED: default admin user (change password after first login)
-- =============================================================================
INSERT INTO app_users (id, name, email, password, role, status)
VALUES (gen_random_uuid(), 'Admin', 'admin@yourmandi.pk', 'admin123', 'Admin', 'active')
ON CONFLICT DO NOTHING;

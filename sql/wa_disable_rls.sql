-- Quick fix: disable RLS on all wa_* tables (matches existing CRM pattern).
-- Run this if you already ran wa_schema.sql before the RLS block was added.

alter table wa_sessions        disable row level security;
alter table wa_templates       disable row level security;
alter table wa_campaigns       disable row level security;
alter table wa_messages        disable row level security;
alter table wa_inbox_threads   disable row level security;
alter table wa_webhook_events  disable row level security;
alter table wa_optouts         disable row level security;

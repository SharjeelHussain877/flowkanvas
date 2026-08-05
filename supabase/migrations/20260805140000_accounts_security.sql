-- Harden accounts: no end-user RLS access to tokens; store Canva identity metadata.

alter table public.accounts
  add column if not exists canva_user_id text,
  add column if not exists canva_team_id text,
  add column if not exists display_name text;

drop policy if exists "Users can view their own account" on public.accounts;
drop policy if exists "Users can create their own account" on public.accounts;
drop policy if exists "Users can update their own account" on public.accounts;
drop policy if exists "Users can delete their own account" on public.accounts;

-- RLS stays enabled with zero policies for `authenticated` / `anon`.
-- Only the service role (backend admin client) can read/write token rows.
comment on table public.accounts is
  'OAuth tokens for connected providers. Access only via service role after app auth checks.';

-- Connected OAuth accounts (Canva, etc.) - one row per user.

create table if not exists public.accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  token_type text not null default 'Bearer',
  expires_at timestamptz not null,
  scopes text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_access_token_not_empty check (char_length(access_token) > 0),
  constraint accounts_refresh_token_not_empty check (char_length(refresh_token) > 0),
  constraint accounts_scopes_not_empty check (char_length(scopes) > 0)
);

create index if not exists accounts_expires_at_idx
  on public.accounts (expires_at);

alter table public.accounts enable row level security;

drop policy if exists "Users can view their own account" on public.accounts;
drop policy if exists "Users can create their own account" on public.accounts;
drop policy if exists "Users can update their own account" on public.accounts;
drop policy if exists "Users can delete their own account" on public.accounts;

create policy "Users can view their own account"
  on public.accounts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own account"
  on public.accounts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own account"
  on public.accounts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own account"
  on public.accounts
  for delete
  to authenticated
  using (auth.uid() = user_id);

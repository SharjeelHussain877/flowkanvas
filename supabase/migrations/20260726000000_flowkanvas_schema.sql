-- flowkanvas schema: API keys, avatar storage, auth-only user data (no public.profiles).

-- Remove legacy profiles table and related triggers if they exist.
drop table if exists public.profiles cascade;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.sync_auth_user_avatar_metadata() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.parse_invited_by(text, uuid) cascade;

-- API keys for PDF template rendering endpoints.
-- Raw secrets are never stored; only key_prefix + key_hash.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  constraint api_keys_name_not_empty check (char_length(trim(name)) > 0),
  constraint api_keys_key_prefix_not_empty check (char_length(key_prefix) > 0),
  constraint api_keys_key_hash_not_empty check (char_length(key_hash) > 0)
);

create unique index if not exists api_keys_key_hash_unique on public.api_keys (key_hash);
create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_keys_user_id_revoked_idx on public.api_keys (user_id, revoked);

alter table public.api_keys enable row level security;

drop policy if exists "Users can view their own api keys" on public.api_keys;
drop policy if exists "Users can create their own api keys" on public.api_keys;
drop policy if exists "Users can update their own api keys" on public.api_keys;

create policy "Users can view their own api keys"
  on public.api_keys
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own api keys"
  on public.api_keys
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own api keys"
  on public.api_keys
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profile avatars bucket: public read, users upload only to their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

create policy "Avatar images are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Invite count from auth.users metadata (invited_by on the invitee).
create or replace function public.parse_uuid_or_null(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if value is null or btrim(value) = '' then
    return null;
  end if;

  if value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;

  return value::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.get_my_invite_count()
returns bigint
language sql
security definer
set search_path = auth, public
stable
as $$
  select count(*)::bigint
  from auth.users
  where public.parse_uuid_or_null(raw_user_meta_data->>'invited_by') = auth.uid();
$$;

revoke all on function public.get_my_invite_count() from public;
grant execute on function public.get_my_invite_count() to authenticated;

-- Active auth sessions for the signed-in user (multi-device support).
create or replace function public.get_my_auth_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = auth, public
stable
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.refreshed_at,
    s.user_agent,
    host(s.ip)::text as ip
  from auth.sessions as s
  where s.user_id = auth.uid()
  order by coalesce(s.refreshed_at, s.updated_at, s.created_at) desc;
$$;

create or replace function public.revoke_auth_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions
  where id = target_session_id
    and user_id = auth.uid();
end;
$$;

create or replace function public.revoke_other_auth_sessions(current_session_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions
  where user_id = auth.uid()
    and id <> current_session_id;
end;
$$;

revoke all on function public.get_my_auth_sessions() from public;
revoke all on function public.revoke_auth_session(uuid) from public;
revoke all on function public.revoke_other_auth_sessions(uuid) from public;

grant execute on function public.get_my_auth_sessions() to authenticated;
grant execute on function public.revoke_auth_session(uuid) to authenticated;
grant execute on function public.revoke_other_auth_sessions(uuid) to authenticated;

create or replace function public.sync_my_auth_session_device(
  target_session_id uuid,
  session_user_agent text
)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  update auth.sessions
  set
    user_agent = nullif(btrim(session_user_agent), ''),
    refreshed_at = now()
  where id = target_session_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.sync_my_auth_session_device(uuid, text) from public;
grant execute on function public.sync_my_auth_session_device(uuid, text) to authenticated;

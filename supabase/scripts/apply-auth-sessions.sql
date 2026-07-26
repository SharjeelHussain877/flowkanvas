-- Safe to run on a database that never had public.profiles.
-- Applies session RPCs only (skip if already applied).

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

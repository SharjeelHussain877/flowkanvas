-- flowkanvas templates: in-app canvas designs rendered to PDF via the API.
-- Replaces the Canva integration (accounts table + encrypted OAuth tokens).

drop table if exists public.accounts cascade;

-- Templates designed in the canvas editor. `design` holds the element JSON (schemas/templates/design.ts).
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  width numeric not null,
  height numeric not null,
  design jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_name_not_empty check (char_length(trim(name)) > 0),
  constraint templates_width_range check (width >= 20 and width <= 14400),
  constraint templates_height_range check (height >= 20 and height <= 14400)
);

create index if not exists templates_user_id_updated_at_idx
  on public.templates (user_id, updated_at desc);

alter table public.templates enable row level security;

drop policy if exists "Users can view their own templates" on public.templates;
drop policy if exists "Users can create their own templates" on public.templates;
drop policy if exists "Users can update their own templates" on public.templates;
drop policy if exists "Users can delete their own templates" on public.templates;

create policy "Users can view their own templates"
  on public.templates for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own templates"
  on public.templates for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on public.templates for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on public.templates for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- PDF generation log shown on /dashboard/requests. Rows are written server-side (service role).
create table if not exists public.render_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  template_name text not null,
  status text not null check (status in ('success', 'failed')),
  source text not null check (source in ('api', 'playground')),
  duration_ms integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists render_requests_user_id_created_at_idx
  on public.render_requests (user_id, created_at desc);

alter table public.render_requests enable row level security;

drop policy if exists "Users can view their own render requests" on public.render_requests;

create policy "Users can view their own render requests"
  on public.render_requests for select to authenticated
  using (auth.uid() = user_id);

-- Static images placed in templates (logos, backgrounds). Public read so the PDF renderer can fetch them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'template-assets',
  'template-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Template assets are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own template assets" on storage.objects;
drop policy if exists "Users can update their own template assets" on storage.objects;
drop policy if exists "Users can delete their own template assets" on storage.objects;

create policy "Template assets are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'template-assets');

create policy "Users can upload their own template assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'template-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own template assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'template-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'template-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own template assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'template-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

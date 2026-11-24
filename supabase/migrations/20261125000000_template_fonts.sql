-- Custom fonts uploaded by users for the template editor and PDF renderer.
-- Each row is one font file; rows sharing a name form a family (regular / bold / italic / bold italic).

create table if not exists public.template_fonts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  weight integer not null,
  style text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint template_fonts_name_not_empty check (char_length(trim(name)) > 0),
  constraint template_fonts_weight_check check (weight in (400, 700)),
  constraint template_fonts_style_check check (style in ('normal', 'italic'))
);

create index if not exists template_fonts_user_id_idx
  on public.template_fonts (user_id, name);

create unique index if not exists template_fonts_user_variant_unique
  on public.template_fonts (user_id, lower(name), weight, style);

alter table public.template_fonts enable row level security;

drop policy if exists "Users can view their own fonts" on public.template_fonts;
drop policy if exists "Users can upload their own fonts" on public.template_fonts;
drop policy if exists "Users can update their own fonts" on public.template_fonts;
drop policy if exists "Users can delete their own fonts" on public.template_fonts;

create policy "Users can view their own fonts"
  on public.template_fonts for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can upload their own fonts"
  on public.template_fonts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own fonts"
  on public.template_fonts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own fonts"
  on public.template_fonts for delete to authenticated
  using (auth.uid() = user_id);

-- Font files. Public read so the browser (@font-face) and the PDF renderer can fetch them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'template-fonts',
  'template-fonts',
  true,
  5242880,
  array['font/ttf', 'font/otf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Template fonts are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own template fonts" on storage.objects;
drop policy if exists "Users can update their own template fonts" on storage.objects;
drop policy if exists "Users can delete their own template fonts" on storage.objects;

create policy "Template fonts are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'template-fonts');

create policy "Users can upload their own template fonts"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'template-fonts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own template fonts"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'template-fonts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'template-fonts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own template fonts"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'template-fonts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

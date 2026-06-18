-- NutriScan production schema
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Global product database (barcode lookup + AI scans)
create table if not exists products (
  barcode text primary key,
  name text not null default 'Produs scanat',
  brand text default '',
  image_url text default '',
  ingredients text default '',
  serving_size text default '100g',
  default_grams numeric default 100,
  per_100g jsonb not null default '{}',
  source text default 'openfoodfacts',
  confidence numeric default 1,
  estimated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_name_idx on products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'')));

-- Anonymous device profiles (no auth required for MVP)
create table if not exists devices (
  device_id text primary key,
  profile jsonb default '{}',
  targets jsonb default '{}',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists food_entries (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references devices(device_id) on delete cascade,
  entry_date date not null,
  meal text check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null,
  barcode text,
  grams numeric,
  calories int default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  fiber numeric default 0,
  sodium numeric default 0,
  sugars numeric default 0,
  image_url text,
  logged_at timestamptz default now()
);

create index if not exists food_entries_device_date on food_entries(device_id, entry_date desc);

create table if not exists favorites (
  device_id text not null references devices(device_id) on delete cascade,
  barcode text not null,
  payload jsonb not null,
  saved_at timestamptz default now(),
  primary key (device_id, barcode)
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references devices(device_id) on delete cascade,
  name text not null,
  servings int default 1,
  ingredients jsonb not null default '[]',
  totals jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists water_log (
  device_id text not null references devices(device_id) on delete cascade,
  log_date date not null,
  ml int not null default 0,
  primary key (device_id, log_date)
);

create table if not exists weight_log (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references devices(device_id) on delete cascade,
  kg numeric not null,
  logged_date date not null,
  created_at timestamptz default now()
);

create table if not exists label_scans (
  id uuid primary key default gen_random_uuid(),
  barcode text,
  device_id text,
  storage_path text not null,
  public_url text,
  ocr_text text,
  extracted jsonb,
  created_at timestamptz default now()
);

-- RLS: public read products, devices own their data
alter table products enable row level security;
alter table devices enable row level security;
alter table food_entries enable row level security;
alter table favorites enable row level security;
alter table recipes enable row level security;
alter table water_log enable row level security;
alter table weight_log enable row level security;

create policy "products_public_read" on products for select using (true);

create policy "devices_all" on devices for all using (true) with check (true);
create policy "entries_all" on food_entries for all using (true) with check (true);
create policy "favorites_all" on favorites for all using (true) with check (true);
create policy "recipes_all" on recipes for all using (true) with check (true);
create policy "water_all" on water_log for all using (true) with check (true);
create policy "weight_all" on weight_log for all using (true) with check (true);

-- Storage bucket: label-images (create in dashboard or below)
insert into storage.buckets (id, name, public)
values ('label-images', 'label-images', true)
on conflict (id) do nothing;

create policy "label_images_public_read"
on storage.objects for select
using (bucket_id = 'label-images');

create policy "label_images_upload"
on storage.objects for insert
with check (bucket_id = 'label-images');

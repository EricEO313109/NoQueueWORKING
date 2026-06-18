-- Ingredients catalog + custom meals + parse history

create table if not exists ingredients (
  id text primary key,
  name text not null,
  variant text default '',
  search_terms text[] default '{}',
  per_100g jsonb not null default '{}',
  default_grams numeric default 100,
  source text default 'seed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ingredients_name_idx on ingredients (name);

create table if not exists custom_meals (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  name text not null,
  items jsonb not null default '[]',
  totals jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists custom_meals_device_idx on custom_meals (device_id, updated_at desc);
create index if not exists custom_meals_name_idx on custom_meals (device_id, name);

create table if not exists meal_parses (
  id uuid primary key default gen_random_uuid(),
  device_id text,
  input_text text,
  result jsonb,
  created_at timestamptz default now()
);

alter table ingredients enable row level security;
alter table custom_meals enable row level security;
alter table meal_parses enable row level security;

create policy "ingredients_public_read" on ingredients for select using (true);
create policy "custom_meals_all" on custom_meals for all using (true) with check (true);
create policy "meal_parses_all" on meal_parses for all using (true) with check (true);

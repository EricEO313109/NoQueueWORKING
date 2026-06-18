-- Nutrition verification & source tracking
alter table products
  add column if not exists nutrition_source text default 'barcode'
    check (nutrition_source in ('barcode', 'openfoodfacts', 'ai_label', 'user_verified')),
  add column if not exists confidence_score numeric default 1,
  add column if not exists last_verified_at timestamptz;

-- Backfill from legacy columns
update products
set
  nutrition_source = case
    when source in ('openai-vision', 'label-scan', 'ocr') then 'ai_label'
    when source = 'openfoodfacts' then 'openfoodfacts'
    else coalesce(nutrition_source, 'barcode')
  end,
  confidence_score = coalesce(confidence, confidence_score, 1)
where nutrition_source is null or confidence_score is null;

create index if not exists products_nutrition_source_idx on products (nutrition_source);
create index if not exists products_last_verified_idx on products (last_verified_at desc nulls last);

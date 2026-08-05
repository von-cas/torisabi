-- Torisabi — initial schema (MASTER-PLAN.md task T0.4)
--
-- Security model:
--   anon          → no access to any base table. Reads the public_products view only.
--   authenticated → full CRUD. Public signups are disabled and only the owner's and
--                   Von's accounts exist, so "authenticated" means "admin".
--   service_role  → used server-side only, by the Hermes API routes.
--
-- Money is stored as integer centavos everywhere (₱1,250.00 → 125000).

-- ---------------------------------------------------------------- types

create type product_status as enum (
  'draft',      -- admin-only, never public (Hermes photo uploads land here)
  'available',
  'limited',
  'reserved',
  'sold_out'
);

create type order_status as enum (
  'inquiry',
  'awaiting_confirmation',
  'reserved',
  'awaiting_payment',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled'
);

create type payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');

-- ------------------------------------------------------------ sequences
-- Sequences (not max()+1) so concurrent inserts can never collide.

create sequence product_code_seq start 1;
create sequence order_number_seq start 1;
create sequence invoice_number_seq start 1;

-- ------------------------------------------------------------- products

create table products (
  id                        uuid primary key default gen_random_uuid(),
  code                      text not null unique
                              default 'TS-' || lpad(nextval('product_code_seq')::text, 3, '0'),
  slug                      text not null unique,
  name                      text not null,
  description               text,
  category                  text,
  price_centavos            bigint not null check (price_centavos >= 0),
  discounted_price_centavos bigint check (discounted_price_centavos >= 0),
  -- PRIVATE. Purchase cost, used for margin reporting. Excluded from public_products.
  cost_centavos             bigint check (cost_centavos >= 0),
  variations                text[] not null default '{}',
  status                    product_status not null default 'draft',
  featured                  boolean not null default false,
  source                    text not null default 'manual' check (source in ('manual', 'hermes')),
  archived_at               timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint discount_below_price
    check (discounted_price_centavos is null or discounted_price_centavos <= price_centavos)
);

create index products_public_idx on products (status, featured, created_at desc)
  where archived_at is null;
create index products_category_idx on products (category) where archived_at is null;

-- -------------------------------------------------------- product_photos

create table product_photos (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products (id) on delete cascade,
  display_path text not null,   -- Supabase Storage path, ~1600px WebP
  thumb_path   text not null,   -- Supabase Storage path, ~400px WebP
  alt_text     text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index product_photos_product_idx on product_photos (product_id, sort_order);

-- --------------------------------------------------------------- orders

create table orders (
  id                     uuid primary key default gen_random_uuid(),
  order_number           text not null unique
                           default 'ORD-' || lpad(nextval('order_number_seq')::text, 4, '0'),
  order_date             date not null default current_date,
  customer_name          text not null,
  instagram_username     text,
  mobile_number          text,
  product_total_centavos bigint not null default 0 check (product_total_centavos >= 0),
  shipping_fee_centavos  bigint not null default 0 check (shipping_fee_centavos >= 0),
  discount_centavos      bigint not null default 0 check (discount_centavos >= 0),
  final_amount_centavos  bigint generated always as
                           (product_total_centavos + shipping_fee_centavos - discount_centavos) stored,
  payment_method         text,
  payment_state          payment_status not null default 'unpaid',
  delivery_address       text,
  courier                text,
  tracking_number        text,
  status                 order_status not null default 'inquiry',
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index orders_date_idx on orders (order_date desc);
create index orders_status_idx on orders (status);

-- ---------------------------------------------------------- order_items
-- Name/code/price/cost are snapshotted so past orders stay accurate even if the
-- product is later renamed, repriced, or deleted.

create table order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references orders (id) on delete cascade,
  product_id            uuid references products (id) on delete set null,
  product_name          text not null,
  product_code          text,
  quantity              integer not null default 1 check (quantity > 0),
  unit_price_centavos   bigint not null check (unit_price_centavos >= 0),
  unit_cost_centavos    bigint check (unit_cost_centavos >= 0),
  line_total_centavos   bigint generated always as (quantity * unit_price_centavos) stored,
  created_at            timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);

-- ------------------------------------------------------------- invoices
-- An invoice points at its order rather than copying the amounts, so the two can
-- never disagree.

create table invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique
                   default 'INV-' || lpad(nextval('invoice_number_seq')::text, 4, '0'),
  order_id       uuid not null references orders (id) on delete restrict,
  invoice_date   date not null default current_date,
  notes          text,
  created_at     timestamptz not null default now()
);

create index invoices_order_idx on invoices (order_id);

-- ------------------------------------------------------------- expenses

create table expenses (
  id                 uuid primary key default gen_random_uuid(),
  expense_date       date not null default current_date,
  category           text not null,
  payee              text,
  description        text,
  amount_centavos    bigint not null check (amount_centavos > 0),
  payment_method     text,
  receipt_reference  text,
  related_order_id   uuid references orders (id) on delete set null,
  related_product_id uuid references products (id) on delete set null,
  source             text not null default 'manual' check (source in ('manual', 'hermes')),
  needs_review       boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index expenses_date_idx on expenses (expense_date desc);
create index expenses_category_idx on expenses (category);

-- ------------------------------------------------------- updated_at trigger

create function set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger expenses_updated_at before update on expenses
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- row level security
-- Default deny: RLS on, and the only policies granted are to `authenticated`.

alter table products       enable row level security;
alter table product_photos enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table invoices       enable row level security;
alter table expenses       enable row level security;

create policy admin_all on products
  for all to authenticated using (true) with check (true);
create policy admin_all on product_photos
  for all to authenticated using (true) with check (true);
create policy admin_all on orders
  for all to authenticated using (true) with check (true);
create policy admin_all on order_items
  for all to authenticated using (true) with check (true);
create policy admin_all on invoices
  for all to authenticated using (true) with check (true);
create policy admin_all on expenses
  for all to authenticated using (true) with check (true);

-- Note: no policy exists for `anon` on any base table, so every anonymous read of
-- a base table returns zero rows even before the grants below are considered.

-- --------------------------------------------------------------- public views
-- RLS filters rows, not columns. To make a cost-price leak structurally
-- impossible, the public role is given no privileges on `products` at all and
-- reads through these views instead. The views are SECURITY DEFINER (the
-- Postgres default) so they can read the base table on the caller's behalf while
-- exposing only the columns listed here.

create view public_products as
  select id, code, slug, name, description, category,
         price_centavos, discounted_price_centavos, variations,
         status, featured, created_at, updated_at
  from products
  where status <> 'draft'
    and archived_at is null;

create view public_product_photos as
  select ph.id, ph.product_id, ph.display_path, ph.thumb_path, ph.alt_text, ph.sort_order
  from product_photos ph
  join products p on p.id = ph.product_id
  where p.status <> 'draft'
    and p.archived_at is null;

revoke all on products, product_photos, orders, order_items, invoices, expenses
  from anon;

-- Granted explicitly rather than leaning on Supabase's default privileges, so the
-- schema is self-contained and the RLS probe tests what production actually has.
-- RLS policies above still decide which rows these privileges can touch.
grant select, insert, update, delete
  on products, product_photos, orders, order_items, invoices, expenses
  to authenticated;

grant usage on sequence product_code_seq, order_number_seq, invoice_number_seq
  to authenticated;

grant select on public_products, public_product_photos to anon, authenticated;

-- ------------------------------------------------------------------ storage
-- Public read so product photos can be served straight from the Supabase CDN.
-- Writes require an authenticated admin.

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product photos are publicly readable" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-photos');

create policy "admins manage product photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-photos')
  with check (bucket_id = 'product-photos');

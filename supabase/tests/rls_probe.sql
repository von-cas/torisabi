-- Torisabi RLS probe — the gate for MASTER-PLAN.md tasks T0.4 and T1.14.
--
-- Proves that an anonymous visitor cannot reach private data, and that the public
-- views expose exactly what they should. Raises an exception on the first failure,
-- so "no error" means every assertion passed.
--
-- Run against a scratch database, or against production with:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_probe.sql
-- It creates its own fixtures under codes PROBE-* and deletes them at the end.

begin;

-- ------------------------------------------------------------------ fixtures

insert into products (code, slug, name, price_centavos, cost_centavos, status)
values
  ('PROBE-PUB',  'probe-public',   'Probe public product',   150000, 90000, 'available'),
  ('PROBE-DRAFT','probe-draft',    'Probe draft product',    150000, 90000, 'draft'),
  ('PROBE-SOLD', 'probe-sold',     'Probe sold product',     150000, 90000, 'sold_out');

update products set archived_at = now() where code = 'PROBE-SOLD';

insert into product_photos (product_id, display_path, thumb_path)
select id, 'probe/d.webp', 'probe/t.webp' from products where code = 'PROBE-PUB';

insert into orders (customer_name, product_total_centavos, shipping_fee_centavos, discount_centavos)
values ('Probe Customer', 250000, 15000, 5000);

insert into expenses (category, amount_centavos, description)
values ('website and domain', 73101, 'probe expense');

-- ------------------------------------------------------- anon is locked out

do $$
declare
  reachable text[] := '{}';
  t text;
begin
  foreach t in array array['products','product_photos','orders','order_items','invoices','expenses']
  loop
    begin
      set local role anon;
      execute format('select 1 from %I limit 1', t);
      -- Reaching here means the query was permitted. A zero-row result is still a
      -- pass for RLS, but any successful read of a base table means the grant
      -- revocation did not hold.
      reachable := reachable || t;
    exception
      when insufficient_privilege then null;  -- expected: no grant
    end;
    set local role postgres;
  end loop;

  if array_length(reachable, 1) is not null then
    raise exception 'FAIL: anon could query base table(s): %', array_to_string(reachable, ', ');
  end if;
  raise notice 'PASS: anon has no access to any base table';
end $$;

-- ------------------------------------------- public view exposes safe columns

do $$
declare
  leaked text;
begin
  select string_agg(column_name, ', ')
    into leaked
    from information_schema.columns
   where table_name = 'public_products'
     and column_name in ('cost_centavos', 'archived_at');

  if leaked is not null then
    raise exception 'FAIL: public_products exposes private column(s): %', leaked;
  end if;
  raise notice 'PASS: public_products hides cost_centavos';
end $$;

do $$
declare
  n integer;
begin
  set local role anon;
  select count(*) into n from public_products where code = 'PROBE-PUB';
  if n <> 1 then raise exception 'FAIL: anon cannot read the published product'; end if;

  select count(*) into n from public_products where code = 'PROBE-DRAFT';
  if n <> 0 then raise exception 'FAIL: draft product is publicly visible'; end if;

  select count(*) into n from public_products where code = 'PROBE-SOLD';
  if n <> 0 then raise exception 'FAIL: archived product is publicly visible'; end if;

  select count(*) into n from public_product_photos;
  if n <> 1 then raise exception 'FAIL: expected 1 public photo, got %', n; end if;

  set local role postgres;
  raise notice 'PASS: anon sees published rows only (drafts and archived hidden)';
end $$;

-- ---------------------------------------------- authenticated admin has CRUD

do $$
declare
  pid uuid;
  n integer;
begin
  set local role authenticated;

  insert into products (slug, name, price_centavos, status)
  values ('probe-admin-write', 'Probe admin write', 50000, 'available')
  returning id into pid;

  update products set name = 'Probe admin edit' where id = pid;
  select count(*) into n from expenses;
  if n < 1 then raise exception 'FAIL: admin cannot read expenses'; end if;
  delete from products where id = pid;

  set local role postgres;
  raise notice 'PASS: authenticated admin can read and write';
end $$;

-- -------------------------------------------------- generated money columns

do $$
declare
  final_amount bigint;
begin
  select final_amount_centavos into final_amount
    from orders where customer_name = 'Probe Customer';
  -- 250000 + 15000 - 5000
  if final_amount <> 260000 then
    raise exception 'FAIL: order total is % centavos, expected 260000', final_amount;
  end if;
  raise notice 'PASS: order totals compute correctly (₱2,600.00)';
end $$;

-- ------------------------------------------------------- auto-numbering

do $$
declare
  a text;
  b text;
begin
  insert into products (slug, name, price_centavos) values ('probe-seq-1', 'Probe seq 1', 1)
    returning code into a;
  insert into products (slug, name, price_centavos) values ('probe-seq-2', 'Probe seq 2', 1)
    returning code into b;

  if a = b then raise exception 'FAIL: duplicate product codes generated (%)', a; end if;
  if a !~ '^TS-\d{3,}$' then raise exception 'FAIL: bad product code format: %', a; end if;
  if substring(b from 4)::int <> substring(a from 4)::int + 1 then
    raise exception 'FAIL: product codes not sequential: % then %', a, b;
  end if;

  delete from products where slug in ('probe-seq-1', 'probe-seq-2');
  raise notice 'PASS: product codes auto-increment (% then %)', a, b;
end $$;

rollback;  -- leaves no trace, whatever the outcome

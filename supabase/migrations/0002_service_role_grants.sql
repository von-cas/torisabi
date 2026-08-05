-- The project was created with "Automatically expose new tables" turned off, so
-- no role receives grants implicitly — which is the posture we want, but it means
-- service_role needs them stated too. The Hermes endpoints
-- (src/app/api/hermes/*) use the service key and were failing with
-- "permission denied for table products" without this.
--
-- service_role bypasses RLS, but BYPASSRLS only skips row policies; table-level
-- privileges are still required.

grant select, insert, update, delete
  on products, product_photos, orders, order_items, invoices, expenses
  to service_role;

grant usage on sequence product_code_seq, order_number_seq, invoice_number_seq
  to service_role;

grant select on public_products, public_product_photos to service_role;

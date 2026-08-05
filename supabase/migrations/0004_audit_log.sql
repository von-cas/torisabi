-- Torisabi — audit log (MASTER-PLAN.md §10 Security, task T2.7)
--
-- Who changed what, and when, for every write to the business tables. The rows
-- are written by a trigger rather than by application code: the admin talks to
-- Supabase straight from the browser and Hermes talks to it from the VPS, so
-- there is no single code path an application-level log could sit in. A trigger
-- cannot be forgotten at a call site or skipped by a script.
--
-- Reading is admin-only and behind the same MFA gate as the data itself (0003).
-- Nothing can write through the API: there is no insert/update/delete policy and
-- no write grant to any role. The only writer is the trigger function, which can
-- do it because it is `security definer` and its owner owns the table.

create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  -- auth.uid(); null when nobody is signed in (Hermes uses the service key).
  actor_id    uuid,
  -- The signed-in admin's email, or 'service_role' for a server-side write.
  actor_email text,
  action      text not null check (action in ('insert', 'update', 'delete')),
  table_name  text not null,
  record_id   uuid,
  -- insert → the new row · delete → the old row · update → only what changed.
  changes     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- The dashboard's recent-activity list (§5) reads newest first.
create index audit_log_recent_idx on audit_log (created_at desc);

-- ------------------------------------------------------------------ trigger
-- `security definer` + `set search_path = ''` matches set_updated_at (0001) and
-- mfa_satisfied (0003): the definer rights are what let the insert through, and
-- the empty search_path means every name has to be schema-qualified, so nothing
-- can be hijacked by a same-named object in a schema the caller controls.

create function public.write_audit_log() returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  diff    jsonb;
begin
  if tg_op = 'INSERT' then
    new_row := pg_catalog.to_jsonb(new);
    diff := new_row;

  elsif tg_op = 'DELETE' then
    old_row := pg_catalog.to_jsonb(old);
    diff := old_row;

  else
    old_row := pg_catalog.to_jsonb(old);
    new_row := pg_catalog.to_jsonb(new);

    -- A diff, not two copies of the row: only the keys whose value actually
    -- moved, each recorded as {from, to} so the log can answer "what was it
    -- before". `updated_at` is skipped because the set_updated_at trigger bumps
    -- it on every update — the audit row's own created_at already says when.
    select
      coalesce(
        pg_catalog.jsonb_object_agg(
          key,
          pg_catalog.jsonb_build_object('from', old_row -> key, 'to', new_row -> key)
        ),
        '{}'::jsonb
      )
      into diff
      from pg_catalog.jsonb_object_keys(new_row) as key
     where key <> 'updated_at'
       and new_row -> key is distinct from old_row -> key;

    -- Re-saving a form without editing anything is not an event worth logging.
    if diff = '{}'::jsonb then
      return null;
    end if;
  end if;

  insert into public.audit_log (
    actor_id, actor_email, action, table_name, record_id, changes
  )
  values (
    auth.uid(),
    -- No JWT means no signed-in user: the write came from a server-side key
    -- (Hermes) or the SQL editor. Recorded as such rather than refused — an
    -- audit trigger must never be the reason a legitimate write fails.
    coalesce(auth.jwt() ->> 'email', 'service_role'),
    pg_catalog.lower(tg_op),
    tg_table_name,
    coalesce(new_row ->> 'id', old_row ->> 'id')::uuid,
    diff
  );

  return null;  -- after trigger: the return value is ignored
end;
$$;

-- product_photos is deliberately not audited: photo rows carry no business
-- meaning of their own and always accompany a products change that is logged.

create trigger products_audit
  after insert or update or delete on public.products
  for each row execute function public.write_audit_log();

create trigger orders_audit
  after insert or update or delete on public.orders
  for each row execute function public.write_audit_log();

create trigger order_items_audit
  after insert or update or delete on public.order_items
  for each row execute function public.write_audit_log();

create trigger invoices_audit
  after insert or update or delete on public.invoices
  for each row execute function public.write_audit_log();

create trigger expenses_audit
  after insert or update or delete on public.expenses
  for each row execute function public.write_audit_log();

-- --------------------------------------------------------------------- rls
-- Read-only for admins, and only after MFA — the log records the same private
-- data the audited tables hold, so it cannot be a way around 0003.

alter table audit_log enable row level security;

create policy admin_read on audit_log
  for select to authenticated using (true);

create policy require_mfa on audit_log
  as restrictive to authenticated
  using (public.mfa_satisfied());

-- No insert/update/delete policy exists on purpose: the log is append-only from
-- the API's point of view, and even a compromised admin session cannot edit
-- history through PostgREST.

revoke all on audit_log from anon;
grant select on audit_log to authenticated;

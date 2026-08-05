-- Require a completed MFA challenge before any admin data can be touched.
--
-- Without this, the `admin_all` policies in 0001 grant full CRUD to any
-- `authenticated` session, including one stuck at aal1 — password accepted but
-- the TOTP step abandoned. Someone with only the password could then read and
-- write everything through the Data API, which would make MFA decorative.
--
-- These are RESTRICTIVE policies, so they AND with the existing permissive
-- `admin_all` policies rather than replacing them: a request must satisfy both.
--
-- The check reads "if this user has a verified MFA factor, their session must be
-- aal2; if they have none yet, aal1 is acceptable". That second branch is what
-- lets a brand-new account sign in and enrol its authenticator in the first
-- place — a flat `aal = 'aal2'` requirement would lock every new user out of the
-- very screen where they enrol.

create or replace function public.mfa_satisfied() returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select array[(select auth.jwt() ->> 'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where user_id = (select auth.uid())
      and status = 'verified'
  );
$$;

grant execute on function public.mfa_satisfied() to authenticated;

create policy require_mfa on products
  as restrictive to authenticated
  using (public.mfa_satisfied()) with check (public.mfa_satisfied());

create policy require_mfa on product_photos
  as restrictive to authenticated
  using (public.mfa_satisfied()) with check (public.mfa_satisfied());

create policy require_mfa on orders
  as restrictive to authenticated
  using (public.mfa_satisfied()) with check (public.mfa_satisfied());

create policy require_mfa on order_items
  as restrictive to authenticated
  using (public.mfa_satisfied()) with check (public.mfa_satisfied());

create policy require_mfa on invoices
  as restrictive to authenticated
  using (public.mfa_satisfied()) with check (public.mfa_satisfied());

create policy require_mfa on expenses
  as restrictive to authenticated
  using (public.mfa_satisfied()) with check (public.mfa_satisfied());

-- Product photo writes go through Storage, so the same gate applies there.
create policy "admin photo writes require mfa" on storage.objects
  as restrictive to authenticated
  using (bucket_id <> 'product-photos' or public.mfa_satisfied())
  with check (bucket_id <> 'product-photos' or public.mfa_satisfied());

-- 0004 granted `select` on audit_log to `authenticated` only, matching how the
-- admin reads it. But the project was created with "Automatically expose new
-- tables" off, so nothing is granted implicitly — and the weekly backup
-- (scripts/backup.mjs) reads every table with the service key. Without this the
-- audit history would be the one thing silently missing from every backup.
--
-- Same pattern as 0002, which had to do this for the other six tables.

grant select on audit_log to service_role;

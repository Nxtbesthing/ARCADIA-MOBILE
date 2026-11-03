# Arcadia Mobile Implementation Readiness Verification

**Date:** 2026-11-03  
**Configured project reference:** `vkpqylpesjknfrujwmag`  
**Prior reports reviewed:** `copilot-live-audit.md`, `copilot-deep-audit.md`  
**Scope:** Focused, read-only re-verification of permissions, RLS, Storage, migration provenance, and readiness. No data rows, customer files, API keys, or credentials were retrieved. All SQL executed began with `SELECT`. No project or repository changes were made other than this report.

## 1. Project Identity

- The workspace `.mcp.json` configures `https://mcp.supabase.com/mcp?project_ref=vkpqylpesjknfrujwmag&features=database,docs,development&read_only=true`.
- The target Supabase API URL supplied for this project is `https://vkpqylpesjknfrujwmag.supabase.co`.
- The live MCP tools responded, but none of the database metadata responses returned the project reference. The configured reference is established from local configuration; the connected database's project identity is **not independently verified**.
- The application's runtime `VITE_SUPABASE_URL` value was not read from `.env`; no secret/config file was opened.

## 2. Database Grants and RLS

### Schema-level privileges

The live schema ACL check returned the same result for each requested role:

| Schema | Role | USAGE | CREATE |
|---|---|---:|---:|
| `auth` | `anon` | Yes | No |
| `auth` | `authenticated` | Yes | No |
| `auth` | `service_role` | Yes | No |
| `public` | `anon` | Yes | No |
| `public` | `authenticated` | Yes | No |
| `public` | `service_role` | Yes | No |
| `storage` | `anon` | Yes | No |
| `storage` | `authenticated` | Yes | No |
| `storage` | `service_role` | Yes | No |

This reports effective `has_schema_privilege` results for the named roles, not a reconstruction of every original grant statement or grantor.

### Public table-level privileges

The live per-table privilege check returned identical results for `anon`, `authenticated`, and `service_role` on every one of these 15 public tables:

`carts`, `categories`, `manufacturer_models`, `manufacturer_series`, `manufacturers`, `model_storage_colors`, `model_storage_options`, `order_items`, `orders`, `product_images`, `product_variants`, `products`, `profiles`, `repair_requests`, `wishlists`.

| Role | SELECT | INSERT | UPDATE | DELETE | TRUNCATE | REFERENCES | TRIGGER | MAINTAIN |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `anon` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `authenticated` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `service_role` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

These are effective table ACL checks, not proof that each role can affect/read every row through the Supabase Data API. `anon` and `authenticated` have `rolbypassrls=false`; their row access is constrained by RLS. `service_role` has `rolbypassrls=true`, as does table owner `postgres`; both are privileged server-side identities. No service-role credential was accessed. All public tables are owned by `postgres`.

### RLS flags

| Relation group | RLS enabled | RLS forced |
|---|---:|---:|
| All 15 public application tables listed above | Yes | No |
| `storage.objects` | Yes | No |

RLS not being forced is not, on its own, a customer/anon bypass here: the exposed API roles do not own these tables and do not have `BYPASSRLS`. The `postgres` owner and `service_role` can bypass RLS by role attributes; those are privileged identities and must remain server-side.

### Live policy inventory

All listed policies are `PERMISSIVE`. For permissive policies, qualifying policies for the same operation are OR-combined. `PUBLIC` applies to anon and authenticated roles unless a more restrictive condition limits the operation.

| Table | Role and operation | Live policy condition |
|---|---|---|
| `manufacturers` | `PUBLIC SELECT` | `USING (true)` |
| `manufacturers` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `manufacturer_series` | `PUBLIC SELECT` | `USING (true)` |
| `manufacturer_series` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `manufacturer_models` | `PUBLIC SELECT` | `USING (true)` |
| `manufacturer_models` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `model_storage_options` | `PUBLIC SELECT` | `USING (true)` |
| `model_storage_options` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `model_storage_colors` | `PUBLIC SELECT` | `USING (true)` |
| `model_storage_colors` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `categories` | `PUBLIC SELECT` | `USING (active = true)` |
| `categories` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `products` | `PUBLIC SELECT` | `USING (active = true)` |
| `products` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `product_variants` | `PUBLIC SELECT` | Availability is `active` or `out_of_stock`, and parent product is active |
| `product_variants` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `product_images` | `PUBLIC SELECT` | Parent product is active |
| `product_images` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `profiles` | `authenticated SELECT` | `id = auth.uid()` |
| `profiles` | `authenticated UPDATE` | `USING` and `WITH CHECK id = auth.uid()` |
| `profiles` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `carts` | `authenticated ALL` | `user_id = auth.uid()` in `USING` and `WITH CHECK` |
| `wishlists` | `authenticated ALL` | `user_id = auth.uid()` in `USING` and `WITH CHECK` |
| `orders` | `authenticated SELECT` | `user_id = auth.uid()` |
| `orders` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `order_items` | `authenticated SELECT` | Parent order belongs to `auth.uid()` |
| `order_items` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `repair_requests` | `authenticated SELECT` | `user_id = auth.uid()` |
| `repair_requests` | `authenticated INSERT` | `WITH CHECK user_id = auth.uid()` |
| `repair_requests` | `authenticated ALL` | `USING is_admin()` and `WITH CHECK is_admin()` |
| `repair_requests` | `anon INSERT` | `WITH CHECK user_id IS NULL` |

No direct customer INSERT policy was present for `orders` or `order_items`; the order flow uses `place_arcadia_order`. Customers have no direct UPDATE policy on orders, order items, or repairs. The `profiles` role trigger and profile update policy constrain role escalation. The live `is_admin()` body checks the current `auth.uid()` against `public.profiles.role='admin'`; it returns only a boolean. The full behavior still merits role tests, but no cross-user ownership gap was identified in the returned policies for profiles, carts, wishlists, orders, or order items.

**Confirmed repair-field integrity gap:** Table ACLs permit anon/authenticated INSERT into all repair columns. Column checks confirmed both roles can insert `status`, `contacted`, `repair_cost`, and `communication_notes`. The repair INSERT policies constrain only `user_id`; there is no repair validation trigger (the only repair trigger sets `updated_at`). Therefore a guest or customer can create a new repair row while supplying staff-managed fields such as `status='completed'`, `contacted=true`, a repair cost, or communication notes. This does not let them update another row, but it lets untrusted clients falsify workflow state on newly created requests.

### Function permissions and security-definer review

Live routine metadata returned six public routines, all owned by `postgres`:

| Routine | `SECURITY DEFINER` | `search_path` | `anon` EXECUTE | `authenticated` EXECUTE | Notes |
|---|---:|---|---:|---:|---|
| `handle_new_user()` | Yes | `public` | Yes | Yes | Auth trigger; live body copies `full_name` only, not phone |
| `is_admin()` | Yes | `public` | Yes | Yes | Returns boolean based on current user's profile role |
| `place_arcadia_order(jsonb,text,text,text,text,text,text)` | Yes | `public, pg_temp` | No | Yes | Order RPC; `service_role` can execute |
| `prevent_profile_role_escalation()` | Yes | `public` | Yes | Yes | Profile update trigger |
| `set_updated_at()` | No | No explicit setting | Yes | Yes | Timestamp trigger |
| `validate_customer_order()` | Yes | `public` | Yes | Yes | Order insert trigger |

All six also report `service_role` EXECUTE. Trigger-returning routines are not ordinary RPCs; this ACL result alone does not establish that they can be invoked via PostgREST. The `place_arcadia_order` definition output was truncated by the host; its header confirms the definer, path, and signature, while the local migration contains the intended server-authoritative price/stock/order logic. Do not treat the incomplete live body response as full verification.

The `SECURITY DEFINER` functions are owned by `postgres` (an RLS-bypass role), so their bodies and execute grants are security-sensitive. The inspected bodies use qualified `public` objects and fixed `search_path` settings; `public` has no CREATE privilege for the three API roles. `place_arcadia_order` puts `pg_temp` last. No unsafe dynamic SQL or confirmed search-path exploit was observed in the available definitions.

## 3. Storage

The accessible bucket query returned one bucket:

| Bucket | Public | Limit | MIME types |
|---|---:|---:|---|
| `product-images` | Yes | 10 MiB | JPEG, PNG, WebP, AVIF |

The live Storage object policies are:

| Role | Operation | Condition |
|---|---|---|
| `PUBLIC` | SELECT | `bucket_id = 'product-images'` |
| `authenticated` | INSERT | bucket is `product-images` and `is_admin()` |
| `authenticated` | UPDATE | `USING` and `WITH CHECK` require that bucket and `is_admin()` |
| `authenticated` | DELETE | bucket is `product-images` and `is_admin()` |

No other policy on `storage.objects` was returned. Storage ACL checks show anon/authenticated effective SELECT/INSERT/UPDATE/DELETE privileges, but no TRUNCATE/REFERENCES/TRIGGER/MAINTAIN; `service_role` has all those queried privileges. RLS and the policies above constrain normal API access. Because the bucket is public, object URLs are public regardless of the database metadata row's RLS; keep this bucket exclusively for public product images. No storage objects were read, so whether any non-product files are present is unverified. No private/customer file use is supported safely by this public-bucket setup.

## 4. Migration Provenance

The live migration-list tool returned an empty list. A catalog lookup did not return a visible `supabase_migrations.schema_migrations` relation. This confirms that the current MCP view exposes no migration entries or conventional ledger relation, but does not establish whether the ledger is absent, hidden/unavailable to this connection, or omitted by the migration tool.

| Local migration | Intended content | Corresponding live evidence | Assessment |
|---|---|---|---|
| `20260930000000_initial_schema.sql` | 15 application tables/types, keys/checks/indexes, RLS, policies, functions and triggers | The 15 tables, core keys/FKs/selected checks, RLS flags, policies, six functions and 15 triggers are present | Schema appears applied or equivalently created; provenance is unknown. Do not replay. |
| `20261001220000_production_foundation.sql` | Category seed, public product image bucket/policies, variant read-policy change, removes direct customer order inserts, creates secure order RPC | Bucket, Storage policies, `place_arcadia_order`, active/out-of-stock variant policy, and absence of direct customer order/item INSERT policies are live | Structural effects appear applied or equivalently created. All categories are currently reported at zero rows, so category seed is absent now or rows were later removed. |

The initial migration is not safely rerunnable: it creates types, tables, indexes, triggers, and policies directly. The production migration is only partly idempotent; `ALTER POLICY` requires the target policy to exist. The most plausible explanation for the empty migration list is manual/equivalent SQL deployment without a visible migration ledger, or migration tool/metadata visibility behavior. Available evidence cannot choose between these explanations. Do not repair migration history or apply either file until the exact project and schema baseline are independently established.

## 5. Implementation Readiness Findings

Readiness labels mean:

- **Must resolve before implementation:** resolve before beginning the affected database/API feature or using it in production; isolated code-only work elsewhere may proceed.
- **Can safely resolve during implementation:** no prerequisite security blocker, but include the correction and tests in that feature's implementation.
- **Does not block implementation:** no defect found in the reviewed boundary; retain verification at staging/release.

### R1. Repair requests accept client-supplied staff workflow fields

**Severity:** High (confirmed integrity issue).  
**Readiness:** Must resolve before implementing live repair administration or relying on repair status/cost/contact data.  
**Evidence:** `anon` and `authenticated` have INSERT ACLs on the repair columns. Live policies check only `user_id IS NULL` for anon and `user_id = auth.uid()` for authenticated. No repair validation trigger exists.  
**Affected objects:** `public.repair_requests` columns `status`, `contacted`, `repair_cost`, `communication_notes`; policies `guests may submit unowned repairs` and `customers create own repairs`.  
**Correction:** Restrict customer/guest insert policy checks to default-safe values (`status='requested'`, `contacted=false`, `repair_cost IS NULL`, `communication_notes IS NULL`) or enforce equivalent non-admin normalization in a reviewed trigger. Preserve admin-only update/manage. Avoid relying on UI-supplied values.  
**Proposed migration:** `supabase/migrations/20261104090000_restrict_repair_insert_fields.sql` (conditional on reviewed current policy baseline).  
**Risk:** Security-sensitive but narrow; may reject clients that currently send workflow fields.  
**Tests:** Anon/customer submit valid requests; attempts to set completed/contacted/cost/notes are rejected or normalized; customers cannot update existing requests or see another user's rows; admin can manage all intended fields.  
**Rollback:** Restore only the captured prior policy/trigger definition after review; rollback reopens the confirmed integrity issue, so do not roll back without disabling untrusted repair submission or an alternative guard.

### R2. API roles have excessive table ACLs

**Severity:** Medium (confirmed least-privilege excess; public exploitability not demonstrated).  
**Readiness:** Must resolve before adding new public SQL/RPC surfaces or relying on table ACLs as a security boundary; does not by itself block isolated client-code implementation under existing RLS.  
**Evidence:** All eight queried table privileges are true for anon/authenticated on all 15 public tables. RLS is enabled and these roles have no RLS bypass. Current policies deny most unauthorized CRUD, but RLS does not filter `TRUNCATE`; availability of a public Data API path to invoke truncate/maintain was not established.  
**Affected objects:** ACLs for the 15 public tables listed in Section 2; `anon`, `authenticated`, and API-facing surfaces.  
**Correction:** Narrow to documented API needs per table. Remove unused `TRUNCATE`, `MAINTAIN`, `REFERENCES`, and `TRIGGER`; replace broad CRUD with explicit per-table grants while preserving required catalog reads, owner-scoped operations, guest repair insertion after R1, and admin actions. Keep RLS as a separate row boundary.  
**Proposed migration:** `supabase/migrations/20261104100000_narrow_api_table_grants.sql`.  
**Risk:** Potentially breaking; build the allowlist from the current code paths and role tests first.  
**Tests:** Anon catalog SELECT/guest repair path; customer own cart/profile/wishlist/history; denied customer inventory/order-admin mutations; admin CRUD; verify grant booleans and policy behavior independently.  
**Rollback:** Compensating migration from a captured exact prior ACL baseline, restoring only required privileges. Never use blanket grants.

### R3. Migration history is empty/unavailable despite live schema objects

**Severity:** High deployment risk (origin unverified).  
**Readiness:** Must resolve before any database migration, seed migration, or remote schema deployment; app-only development can continue.  
**Evidence:** MCP migration list is empty; no conventional ledger relation is visible; live DDL objects match much of both local migrations, including the production RPC/bucket/policies. Category seed rows are absent now.  
**Affected objects:** migration ledger; `supabase/migrations/20260930000000_initial_schema.sql`; `supabase/migrations/20261001220000_production_foundation.sql`; `categories`; live schema objects.  
**Correction:** Establish target identity and obtain an authorized schema-only diff/deployment record. Determine whether migrations were applied manually/equivalently, whether the ledger is inaccessible, and whether categories were later removed. Reconcile history only using the supported procedure after equivalence is reviewed. Do not rerun these migration files.  
**Proposed migration:** None until provenance is resolved; ledger baseline/reconciliation is not a schema migration.  
**Risk:** Sensitive; false history repair hides drift; replay can collide or fail partway.  
**Tests:** Compare live definitions to migration DDL in a disposable clone; after approved reconciliation confirm list output and no schema drift.  
**Rollback:** Preserve pre-reconciliation metadata; do not drop objects or erase migration history. Follow the platform's supported inverse/repair procedure only after review.

### R4. Remote project identity is not independently established

**Severity:** High operational safety prerequisite for remote changes.  
**Readiness:** Must resolve before any remote migration, seed, or permission change.  
**Evidence:** `.mcp.json` embeds the reference; live table/function responses do not echo it.  
**Affected objects:** MCP project target; all remote database objects.  
**Correction:** Obtain a response/approved project metadata that explicitly identifies the reference before remote writes.  
**Migration:** None.  
**Risk:** Wrong-project change.  
**Tests:** Verify project ref through supported project metadata and independently confirm URL before any deployment.  
**Rollback:** Not applicable; prevent rather than recover from wrong-target writes.

### R5. Category/master data and live product catalog are empty

**Severity:** High for storefront launch; not a security defect.  
**Readiness:** Can safely resolve during implementation after R3/R4; must be complete before live purchases.  
**Evidence:** Refreshed table metadata reports zero rows in all 15 public tables, including `categories`, catalog tables, products, variants, and image metadata. The inventory form requires an existing category.  
**Affected objects:** `categories`, `manufacturers`, `manufacturer_series`, `manufacturer_models`, `model_storage_options`, `model_storage_colors`, `products`, `product_variants`, `product_images`; existing `supabase/seed/master-catalog-seed.sql`.  
**Correction:** Add reviewed categories and master reference data; enter actual products, stock, price, and images only after identity/provenance checks.  
**Proposed migration:** Optional additive `supabase/migrations/20261104110000_seed_missing_categories.sql`; use the existing generated catalog seed separately.  
**Risk:** Additive but affects product selection/FKs; no demo inventory.  
**Tests:** Read-only counts/relationships, live catalog mapping, admin selectors, checkout only for real UUID-backed inventory.  
**Rollback:** Do not delete referenced seed rows automatically; correct only after FK/reference review.

### R6. Signup trigger does not persist phone metadata

**Severity:** Medium (confirmed live behavior).  
**Readiness:** Can safely resolve during implementation; fix before relying on phone as a saved profile field.  
**Evidence:** Live `handle_new_user()` inserts `id` and `full_name` only. `script.js` returns early if signup has no session, before its profile update; the project email-confirmation setting was not inspected.  
**Affected objects:** `public.handle_new_user()`, `public.profiles.phone`, `auth.users` trigger `on_auth_user_created`, `script.js`.  
**Correction:** Add `phone` from `new.raw_user_meta_data` in the definer trigger with safe search path/conflict behavior; surface client profile update errors. Do not bulk backfill users without separate approval.  
**Proposed migration:** `supabase/migrations/20261104120000_capture_signup_phone.sql`.  
**Risk:** Sensitive function change but narrow; no user-row updates required.  
**Tests:** Immediate-session and email-confirmed signup, empty phone handling, duplicate profile conflict, customer role cannot be changed, own-profile visibility only.  
**Rollback:** Restore captured prior function definition; do not remove the Auth trigger.

### R7. Wishlist remains localStorage-only

**Severity:** Medium feature gap.  
**Readiness:** Can safely resolve during implementation.  
**Evidence:** `public.wishlists` has an authenticated owner-only ALL policy; `script.js` reads/writes localStorage and does not query the table.  
**Affected objects:** `public.wishlists`, `script.js`.  
**Correction:** Add signed-in sync/merge and account-switch isolation using existing schema.  
**Migration:** None if current policy/grants remain; no new table.  
**Risk:** Low-to-medium application change.  
**Tests:** Guest persistence, merge, two-user isolation, sign-out, duplicate handling, network failure.  
**Rollback:** Revert to local-only behavior; leave unused rows intact.

### R8. Live order/repair admin workflows are absent

**Severity:** High operational gap.  
**Readiness:** Can safely resolve during implementation, but resolve R1/R2/R3/R4 before enabling live repair/admin APIs.  
**Evidence:** `src/admin-inventory.js` manages inventory/images only; legacy order/repair panels in `script.js` use localStorage and the local admin predicate always returns false. Live tables and admin policies exist.  
**Affected objects:** `orders`, `order_items`, `repair_requests`; `src/admin-inventory.js`; `script.js`; existing admin RLS policies.  
**Correction:** Extend the Supabase-authenticated admin flow with order/payment and repair queues, after defining authorized transitions and staff access to customer PII. Reuse existing tables.  
**Proposed migration:** Conditional `supabase/migrations/20261104130000_admin_operations_policies.sql` only if verified policy behavior does not match the needed operations.  
**Risk:** Sensitive customer-data and payment workflow.  
**Tests:** Admin-only status/payment edits; customer own-history isolation; R1 field checks; staff repair updates; anon cannot read records.  
**Rollback:** Hide/revert UI and restore captured policy state if changed; do not delete records.

### R9. Public image bucket

**Severity:** Low for the current product-only use; high if customer files are placed there.  
**Readiness:** Does not block current public product-image implementation.  
**Evidence:** One visible bucket is public; live policy allows `PUBLIC SELECT` for every object in `product-images`, admin-only writes. No objects were inspected.  
**Affected objects:** `storage.buckets('product-images')`, `storage.objects` policies, image client code.  
**Correction:** Keep only approved public product images in the bucket. For customer/private uploads, use a separate private bucket with owner-scoped access and signed URLs.  
**Migration:** None for current product-only use; conditional Storage policy/bucket migration only for a separately approved private-file requirement.  
**Tests:** Public product image URL read; anon upload denied; non-admin update/delete denied; admin upload/remove allowed. Never test against customer files.  
**Rollback:** Revert only after validating product URL behavior; do not make a public bucket private without a planned URL migration.

### R10. RLS forced state and admin boundaries

**Severity:** No defect found for current API roles; privileged-role boundary remains important.  
**Readiness:** Does not block implementation.  
**Evidence:** All public tables and `storage.objects` have RLS enabled, not forced. `anon`/`authenticated` lack `BYPASSRLS`; all table owners are `postgres`; `service_role` and `postgres` bypass. Policies apply owner/admin checks described above.  
**Affected objects:** All public tables, `storage.objects`, `public.is_admin()`, definer functions.  
**Correction:** No change recommended solely to FORCE RLS; retain owner/service-role credentials server-side and continue policy tests. Do not broaden RLS to compensate for table ACLs.  
**Migration:** None.  
**Tests:** Staging anon/customer/admin separation, including profile role change, stock/price, and order status.  
**Rollback:** Not applicable; avoid changing the current RLS forced state absent a separately justified requirement.

### R11. Order RPC/security-definer path

**Severity:** No confirmed defect; function body verification incomplete.  
**Readiness:** Does not block application-only work; verify full live body before relying on or changing the RPC.  
**Evidence:** Live ACL denies anon EXECUTE and allows authenticated/service_role. Owner is postgres; function is `SECURITY DEFINER`, path `public, pg_temp`. Local migration implements server-derived pricing/stock and transactional order snapshots. Live function body output was truncated.  
**Affected objects:** `public.place_arcadia_order(...)`, `orders`, `order_items`, `product_variants`, `carts`.  
**Correction:** Compare complete deployed function definition to local migration using an authorized schema export. No change recommended from the metadata alone.  
**Migration:** None unless the full diff finds a defect.  
**Tests:** In staging, forged totals/IDs, out-of-stock, concurrent last-unit purchase, duplicate variants, customer ownership, pending initial status, and cart cleanup.  
**Rollback:** Preserve captured function definition; only deploy a reviewed replacement with a compensating version, without removing an in-use RPC.

## 6. Final Checklist

- [x] Read both existing audit reports and rechecked the local config/migrations.
- [x] Confirmed configured MCP URL/reference; did not claim independent project identity.
- [x] Checked exact effective table privileges for anon/authenticated/service_role on all 15 public tables.
- [x] Checked schema USAGE/CREATE for the three roles.
- [x] Checked RLS enabled/forced for all 15 public tables and `storage.objects`.
- [x] Retrieved the complete live policy list for all Arcadia tables and Storage objects.
- [x] Checked repair column INSERT privileges and identified writable staff-owned fields.
- [x] Checked role RLS-bypass flags and table/function owners.
- [x] Checked bucket metadata and policies without reading objects.
- [x] Compared live objects/policies with local migration content; migration history remains unresolved.
- [x] Preserved the existing reports and all pre-existing uncommitted changes.
- [ ] Independent project identity verification remains unavailable from current MCP responses.
- [ ] Migration provenance requires an authorized schema/deployment baseline before any remote migration.

**Conclusion:** Most customer/admin row boundaries are present and effective under RLS, and broad table ACLs alone do not prove a public Data API vulnerability. However, the live repair INSERT policies allow untrusted users to set staff-managed repair status/contact/cost/notes, which must be constrained before implementing live repair operations. Resolve project identity and migration provenance before any remote database change. Public image access is appropriate only while the bucket contains public product imagery.

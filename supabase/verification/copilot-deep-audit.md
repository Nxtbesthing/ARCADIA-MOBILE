# Arcadia Mobile Deep Audit Review

**Review date:** 2026-11-03  
**Reviewed report:** `supabase/verification/copilot-live-audit.md`  
**Scope:** Read-only verification of the previous report, current repository, and available live Supabase metadata for configured project reference `vkpqylpesjknfrujwmag`.

No application rows, Auth users, Storage objects, keys, or credentials were read. Every SQL statement issued in this review began with `SELECT`. No database, migration, application, or configuration changes were made. The only local change is creation of this second report.

## 1. Executive Review

The first report's main application findings remain supported by the current source, and its cautions about missing database metadata are appropriate. The live metadata still reports 15 public tables with zero rows and an empty migration list. It also confirms a live order RPC, Auth/profile/order triggers, a public image bucket, six public routines, and broad API-role table ACLs on multiple public tables.

The configured MCP URL contains `project_ref=vkpqylpesjknfrujwmag`; no live database response independently returned that reference. Thus the configured project reference is confirmed from local configuration, while remote identity remains unverified.

Three refinements to the first report:

1. The broad-grant query response was truncated. Broad privileges are confirmed on multiple public relations, but the complete affected relation/privilege matrix is not available. Do not generalize the visible rows to every table or assert a demonstrated anonymous exploit.
2. The live trigger and routine metadata match much of the local migration design, but function bodies were not retrieved. The phone omission is directly present in local migration source; whether the deployed `handle_new_user()` body has the same behavior is unverified.
3. The live schema strongly suggests that at least some structural content from both local migrations exists remotely, but does not prove whether either migration was applied by the migration runner, manually, or through equivalent SQL. Missing categories could mean the seed was not applied or that seeded rows were later removed.

## 2. Evidence and Limitations

### Connection and tools

- Local `.mcp.json` config points at `https://mcp.supabase.com/mcp?project_ref=vkpqylpesjknfrujwmag&features=database,docs,development&read_only=true`.
- The Supabase MCP responded to metadata tools and read-only catalog SQL. The configured project reference is not independently confirmed by the live database response.
- Available tools observed: `mcp_supabase_list_tables`, `mcp_supabase_list_extensions`, `mcp_supabase_get_publishable_keys`, `mcp_supabase_list_migrations`, and `mcp_supabase_execute_sql`. The key tool was not called. `mcp_supabase_execute_sql` can execute arbitrary SQL; only SELECT statements were used here.
- The MCP URL requests read-only behavior. Enforcement was not tested with a write, and no write was attempted.

### Live inventory

The verbose table-list tool returned the following public tables, all with RLS reported enabled and row count reported as zero: `manufacturers`, `manufacturer_series`, `manufacturer_models`, `model_storage_options`, `model_storage_colors`, `categories`, `profiles`, `products`, `product_variants`, `product_images`, `carts`, `wishlists`, `orders`, `order_items`, and `repair_requests`.

The same tool exposed column names/types, nullability/defaults, primary keys, foreign keys, selected unique/check metadata, and the catalog relationships described in the first report. It confirms the manufacturer-to-series-to-model-to-storage/color relationships and product/variant/image/cart/wishlist/order links. It does not provide a complete substitute for PostgreSQL catalogs.

### Security and metadata limits

- RLS is reported enabled on all 15 tables. Forced-RLS status was not returned.
- The full `pg_policies` response and broad relation/index/constraint catalog outputs were withheld or truncated by the MCP host. The prior visible policy excerpt is not a complete policy audit. No attempt was made to bypass this limit.
- The broad table ACL result visibly grants `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE` among other privileges to `anon` and `authenticated` on multiple public relations. Because that result was truncated, exact affected relations and the complete privilege set are unknown. Schema ACL output showed `USAGE` for API roles on `auth`, `public`, and `storage`; it did not show `CREATE` for those roles or `PUBLIC` on those schemas.
- Column-level ACLs were not inspected. A table ACL does not establish whether column-level grants exist.
- The relation inventory did not establish the full view/materialized-view inventory. No live view is confirmed or ruled out.
- Live trigger catalog returned 15 enabled triggers: the Auth user profile trigger, profile role-protection trigger, order validation trigger, and update-timestamp triggers for tables with `updated_at`. The information-schema trigger view returned no rows, but a direct `pg_trigger` query exposed these triggers; therefore the empty information-schema response was a visibility limitation, not evidence that triggers are absent.
- Live routine metadata returned `handle_new_user`, `is_admin`, `place_arcadia_order`, `prevent_profile_role_escalation`, `set_updated_at`, and `validate_customer_order`. Five are reported `SECURITY DEFINER`; `set_updated_at` is not. Paths are reported as `public` for the first group other than order RPC (`public, pg_temp`); `set_updated_at` has no explicit setting. `place_arcadia_order` is not executable by `anon` and is executable by `authenticated`/`service_role`. `is_admin()` reports executable by `anon` but returns only boolean. Trigger functions report execute privileges but have trigger return types; their ordinary RPC exposure was not tested.
- Live Storage metadata confirms bucket `product-images`, public flag true, 10 MiB limit, and JPEG/PNG/WebP/AVIF MIME allowlist. The complete live Storage object policy list was not available. No objects were read.
- The migration-list tool returned an empty list. This is a confirmed tool result, not proof that no migration was ever run.
- The extension tool identifies installed versions for `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, and `plpgsql`.

### Repository evidence rechecked

Current uncommitted repository changes were present before this review, including `package.json`, `script.js`, several `src` files, `.mcp.json`, and the existing verification/test files. They were preserved. The prior report exists and was read in full. `npm test` was rerun: 25 passed, 0 failed.

The review reconfirmed:

- `src/supabase.js` initializes `@supabase/supabase-js` from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; no service-role/secret-key symbol was found under `src/`. `.env` was not opened.
- `src/storefront-data.js` reads live products/categories/variants/catalog mappings and product image URLs. `src/catalog-state.js` labels fallback products as preview-only and prevents their checkout.
- `script.js` uses Supabase Auth for signup/login/reset/session; profile read/update; own order/repair reads; cart sync; the `place_arcadia_order` RPC; and repair submission/tracking. Guest cart and wishlist state use localStorage. Static fallback products remain for unavailable/empty live catalog.
- `src/admin-inventory.js` signs in with Supabase Auth, checks the current user's `profiles.role`, and performs live product/variant/image operations. The older `#admin/*` panels are unreachable because `isLocalAdminAuthenticated()` always returns false; their products, catalog, orders, repairs, and billboard flows are localStorage-based. The `#admin/inventory` route is the active Supabase-admin path.
- Initial migration `20260930000000_initial_schema.sql` is not replay-safe: it creates types/tables/indexes/triggers/policies directly. Production migration `20261001220000_production_foundation.sql` seeds categories, creates the image bucket/policies/index, changes the variant read policy, removes customer direct order/item insert policies, creates the order RPC, and restricts its execute grant. It is not wholly idempotent: for example, `ALTER POLICY` requires the target policy to exist.
- `supabase/seed/generate-master-catalog-sql.js` emits deterministic upsert SQL for the six local device catalogs. The generated seed is DML and was not executed.

## 3. Application-to-Database Map

| Feature | Current integration | Status / gap |
|---|---|---|
| Supabase client | Environment-provided URL and anon/publishable key in `src/supabase.js` | Present; no privileged key found in source scan |
| Catalog and categories | Live SELECTs and model/storage/color mapping in `src/storefront-data.js` | Implemented; live metadata reports empty tables |
| Fallback storefront | Static products in `script.js`, classified by `src/catalog-state.js` | Display fallback only; marked preview and not purchasable |
| Inventory | `src/admin-inventory.js` reads/writes `products` and `product_variants` | Supabase Auth/profile-gated create/edit/stock; blocked at create when no categories exist |
| Master catalog/category editing | Selects existing catalog hierarchy; no active Supabase UI to create/edit categories or master hierarchy | Missing in current admin workflow; seed/out-of-band operations are required |
| Pricing | Generated DB amount/final fields; storefront normalizes display in `src/storefront-pricing.js` | Server-side price authority intended for checkout; live order function body not inspected |
| Product images | Public URL construction and admin Storage upload/delete + `product_images` metadata | Bucket exists; policy behavior not fully verified |
| Registration/login/session | Supabase Auth flows in `script.js`, shared session state in `src/auth-state.js` | Implemented; no end-to-end live auth test performed |
| Profile/phone | Auth metadata includes `full_name` and `phone`; profile query/update uses `profiles` | Email-confirmation phone persistence depends on live trigger body, which is not exposed; local migration trigger only copies full name |
| Admin authorization | `/admin/inventory` verifies `profiles.role === 'admin'`; DB policies are intended to call `is_admin()` | UI gate exists; full live policies and role-isolation behavior unverified |
| Cart | Guest localStorage; signed-in cart sync/read via `public.carts` | Implemented; limited to 100 loaded rows; actual user isolation not tested |
| Wishlist | `localStorage` only | DB table exists but app never persists to it; also not scoped per account on a shared browser |
| Checkout | Authenticated live UUID-backed cart calls `place_arcadia_order` with variant IDs/quantities | Present; server source computes prices/stock/totals; no live invocation performed |
| Payment | Bank-transfer instructions and pending status | Intended bank-transfer-only flow; no automatic transfer verification or active live admin status UI |
| Order history | Reads current user's orders, newest first, limit 25 | Present but capped; customer RLS not independently tested |
| Order operations | Legacy localStorage screen only; local admin gate always false | No functional live order/payment admin workflow |
| Repair submission | Supabase insert to `repair_requests`, guest or signed-in | Present; database policy/rate limits not fully verified |
| Repair tracking | Signed-in query filters by ticket and own `user_id` | Guests cannot track their unowned submission; staff admin view is localStorage-only |
| Admin repair operations | Legacy localStorage screen only | No functional live repair queue/status/cost/notes workflow |

## 4. Findings and Remediation Plans

The labels below distinguish **Confirmed**, **Suspected**, and **Unverified** evidence. No confirmed critical exploit was established. An unverified authorization boundary is not considered safe until tested.

### D1. Excessive API-role table ACLs

**Severity:** High, confirmed grant configuration; exploitability through the exposed Data API not demonstrated.  
**Evidence:** The live ACL query returned broad `anon` and `authenticated` table privileges, including `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE`, on multiple public relations. The result was truncated, so the exact complete relation/privilege matrix is unknown. All 15 listed tables report RLS enabled, but RLS does not govern `TRUNCATE`.  
**Affected:** Public table ACLs; roles `anon` and `authenticated`; all relations shown in the full live ACL response; policies must be reviewed before narrowing grants.  
**Correction:** Capture the complete effective grants and RLS policy matrix, then revoke unused table privileges and explicitly grant only API-required operations per table. In particular remove `TRUNCATE`, `MAINTAIN`, `REFERENCES`, and `TRIGGER` from API roles unless a documented need exists. Preserve public catalog SELECT, intended guest repair INSERT, owner-scoped customer operations, and admin writes only where required. Do not rely on frontend role checks as a substitute for DB policies.  
**Proposed migration:** `supabase/migrations/20261104090000_restrict_api_role_grants.sql`.  
**Risk:** Sensitive and potentially breaking; exact ACL baseline and role tests are prerequisites. No privilege change is proposed until the complete list is available.  
**Tests:** Anon catalog SELECT; guest repair submission; customer A/B isolation; customer attempts to edit price/stock/role/order ownership/status; admin inventory/order/repair writes; verify API roles lack truncate/DDL-adjacent table grants. Use staging accounts and no production customer data.  
**Rollback:** A reviewed compensating migration restoring only captured, necessary grants. Never use blanket `GRANT ALL` as rollback.

### D2. Actual RLS policy matrix and forced-RLS state remain unverified

**Severity:** High verification blocker; no specific bypass confirmed.  
**Evidence:** Table tool says RLS is enabled on all listed tables. Forced status is unknown. Only a truncated policy excerpt was delivered; the first migration's intended policies cannot establish current live behavior.  
**Affected:** `profiles`, catalog/product tables, `product_images`, `carts`, `wishlists`, `orders`, `order_items`, `repair_requests`, and `storage.objects`; `is_admin()`; customer/admin API boundaries.  
**Correction:** Obtain the complete live policy list and `relrowsecurity`/`relforcerowsecurity` values through the normal authorized metadata interface. Compare each command and role to the app's required access. Test with separate anon/customer/admin accounts; if an actual policy gap is confirmed, write narrowly scoped policies and review them before deployment.  
**Proposed migration:** Conditional only: `supabase/migrations/20261104100000_reconcile_rls_policies.sql`; do not create/apply unless the complete diff identifies a real mismatch.  
**Risk:** Sensitive; a broad or incorrect policy can expose customer PII or block checkout/admin workflows.  
**Tests:** Customer A cannot read/change customer B profile/cart/wishlist/order/repair; customer cannot write inventory or modify order/payment status; admin can perform intended operations; anon can only read intended active catalog and submit allowed guest repair.  
**Rollback:** Restore the exact prior policy definitions from a captured schema baseline in a compensating migration. Keep a staging rollback rehearsal; never disable RLS as rollback.

### D3. Live catalog and categories are empty

**Severity:** High, confirmed by table tool's reported zero rows.  
**Evidence:** All 15 public tables are reported empty, including categories, master catalog, products, variants, and image metadata. `src/admin-inventory.js` disables product creation when no category exists. Storefront fallback items are explicitly preview-only and cannot be purchased.  
**Affected:** `categories`, `manufacturers`, `manufacturer_series`, `manufacturer_models`, `model_storage_options`, `model_storage_colors`, `products`, `product_variants`, `product_images`; `src/storefront-data.js`; `src/admin-inventory.js`; `script.js`; existing catalog generator/seed.  
**Correction:** After confirming remote project identity and migration baseline, add only missing categories and master reference data from the reviewed local catalog. Add real products, prices, stock, and reviewed images through the admin flow. Do not use preview fixtures as live inventory.  
**Proposed migration:** `supabase/migrations/20261104110000_seed_missing_categories.sql` for additive category seeding only. Use existing `supabase/seed/master-catalog-seed.sql` only after review; no new schema migration is required for master data.  
**Risk:** Additive category/master-data changes are relatively safe but affect storefront options and foreign-key references. Product inventory is business data and must be approved; no bulk import is proposed here.  
**Tests:** Read-only category/model counts and FK joins; storefront live-state mapping; inventory selectors; purchase disabled for preview and enabled only for actual live stock.  
**Rollback:** Do not automatically delete seeded rows because products may reference them. Corrections require a reference check and explicit data-owner approval.

### D4. Migration ledger and actual schema diverge

**Severity:** Medium deployment safety; confirmed mismatch, origin suspected.  
**Evidence:** Live migration-list tool returns no entries. Live tables/functions/triggers and the `place_arcadia_order` RPC exist. The production migration also defines the live `product-images` bucket. Conversely, its ten category inserts are not reflected in the tool's zero category count. This suggests an empty/untracked ledger and partially applied/equivalent SQL or later data deletion, but does not prove which.  
**Affected:** Migration metadata; `supabase/migrations/20260930000000_initial_schema.sql`; `supabase/migrations/20261001220000_production_foundation.sql`; `supabase/seed/master-catalog-seed.sql`.  
**Correction:** Obtain an authorized schema-only dump/diff and deployment history; match live definitions to each migration. Reconcile the migration ledger using the supported CLI repair/baseline procedure only after explicit review. Never replay the initial migration against this schema: it creates types, tables, indexes, triggers, and policies without broad idempotency guards. The production migration is also not fully rerunnable because `ALTER POLICY` requires an existing policy.  
**Proposed migration:** N/A for now. Ledger reconciliation is deployment metadata/provenance work, not an assumed schema migration. Any actual schema drift should get a separately reviewed migration after baseline.  
**Risk:** Sensitive; false baseline can hide drift, while rerunning local files can fail midway or duplicate/conflict with existing objects.  
**Tests:** Compare relation/type/constraint/index/policy/function/trigger/bucket metadata against both migrations; verify CLI migration list after approved reconciliation in a clone/staging project.  
**Rollback:** Do not erase migration history or drop database objects. Preserve a pre-reconciliation metadata backup and follow the CLI's supported inverse/repair procedure only with a reviewed plan.

### D5. Live order/payment and repair administration are missing

**Severity:** High, confirmed application gap.  
**Evidence:** `script.js` legacy order and repair sections read/write localStorage; `isLocalAdminAuthenticated()` always returns false, making those screens unavailable. `src/admin-inventory.js` is the active Supabase admin UI but only manages catalog, variants, and images. Live `orders`/`repair_requests` tables and status fields exist.  
**Affected:** `orders`, `order_items`, `repair_requests`; `src/admin-inventory.js`; `script.js`; relevant policies.  
**Correction:** Add order/payment and repair queues inside the existing Supabase-authenticated admin flow, reusing current tables. Define permitted status transitions and fields with operations staff. Keep payment/order mutations admin-only and customer PII visible only to authorized admins.  
**Proposed migration:** Conditional `supabase/migrations/20261104130000_admin_operations_policies.sql` only if verified live policies do not already permit the intended admin operations; UI work itself needs no new table.  
**Risk:** Sensitive because it changes staff access to customer names, phone, email, delivery address, and repair details; potentially breaking if policies are tightened incorrectly.  
**Tests:** Admin can review an order and set approved statuses/payment state; customers cannot change either; customer history remains own-row only; admin can update repair status/cost/contact notes; customer cannot edit staff-only fields.  
**Rollback:** Hide/revert the new UI and use a compensating policy migration restoring the captured policy state. Do not delete order/repair data.

### D6. Signup phone persistence depends on email-confirmation behavior

**Severity:** Medium, local codepath confirmed; live function behavior suspected/unverified.  
**Evidence:** `script.js` passes `full_name` and `phone` as signup user metadata, then returns early when `data.session` is absent. The local initial migration's `handle_new_user()` inserts only `full_name`. The live trigger is confirmed but its body was not read.  
**Affected:** `public.profiles.phone`; `public.handle_new_user()`; `auth.users` trigger `on_auth_user_created`; `script.js`.  
**Correction:** Compare the deployed function body through an authorized schema review. If it matches local source, update profile creation to copy both metadata values while preserving conflict safety and customer role defaults. Surface failed profile updates rather than silently proceeding. Do not bulk backfill without approval.  
**Proposed migration:** Conditional `supabase/migrations/20261104120000_capture_signup_phone.sql`.  
**Risk:** Sensitive function change because it runs as definer on Auth signup; no existing user data should be rewritten.  
**Tests:** Confirmed and immediate-session signup; metadata omission/invalid fields; duplicate trigger-safe behavior; verify customer cannot change role; ensure phone is not exposed to other customers.  
**Rollback:** Restore the captured function body with a compensating migration; keep the trigger and profiles intact.

### D7. Wishlist persistence is browser-local

**Severity:** Medium, confirmed.  
**Evidence:** `script.js` reads/writes wishlist IDs in localStorage. No Supabase wishlist query/write is present, despite `public.wishlists` and local migration intent.  
**Affected:** `public.wishlists`; `script.js`; customer identity-change handling.  
**Correction:** Sync signed-in wishlist rows to the existing table, retain guest local state, merge on login with duplicate handling, and account-scope/reset displayed state on sign-out or account switch.  
**Proposed migration:** N/A, application-only if complete live wishlist policies/grants already match. Conditional policy migration: `20261104101000_wishlist_owner_policy.sql` only if the verified policy is missing or wrong.  
**Risk:** Low-to-medium application change; policy changes are sensitive.  
**Tests:** Guest persistence, login merge, logout/account switching, duplicate product/variant behavior, RLS A/B isolation, offline/error recovery.  
**Rollback:** Revert wishlist synchronization and continue localStorage-only; database rows may remain unused and should not be deleted automatically.

### D8. Guest repair submit has no guest tracking path

**Severity:** Medium, confirmed UX gap; data-exposure controls unverified.  
**Evidence:** `script.js` permits `user_id=null` repair submissions. Tracking requires a signed-in user and filters by `user_id`, so an unowned guest request cannot be found there. Legacy staff repair management is local-only.  
**Affected:** `repair_requests`; `script.js`; `src/admin-inventory.js` if operations UI is extended; Storage/auth policies are not implicated.  
**Correction:** First provide authorized staff repair management. Then either require account authentication for trackable requests or use a cryptographically random tracking token stored safely (preferably store a verifier/hash) with a narrowly scoped lookup. Never authorize by ticket number alone. Review abuse/rate limiting for public submissions.  
**Proposed migration:** Optional `supabase/migrations/20261104140000_guest_repair_tracking_token.sql` only if the token design is approved; staff workflow uses D5.  
**Risk:** Sensitive if introducing token access to repair PII; avoid adding a token until threat review.  
**Tests:** Guest cannot enumerate/look up another ticket; valid token only sees minimal status; account-owned requests remain owner-scoped; request spam/validation controls.  
**Rollback:** Disable guest tracking or require login; do not expose token verifiers, and avoid bulk token changes for active requests.

### D9. Product and variant writes are not atomic in admin UI

**Severity:** Medium, confirmed reliability risk.  
**Evidence:** `src/admin-inventory.js` inserts a product then inserts its variant in a separate request. If the second fails, it attempts a product delete, but the cleanup result is not checked. Editing product then variant is also split across requests.  
**Affected:** `public.products`, `public.product_variants`; `src/admin-inventory.js`; admin RLS policies.  
**Correction:** Use a narrowly authorized transactional RPC for product-plus-variant create/update, or design a recoverable compensating flow with verified cleanup and clear partial-state handling. Keep validation and role checks in the database, not only in the browser.  
**Proposed migration:** `supabase/migrations/20261104150000_atomic_inventory_write_rpc.sql` if the RPC approach is chosen; otherwise N/A for a fully tested application compensation design.  
**Risk:** Sensitive definer/write-path change; needs transaction and privilege review.  
**Tests:** Force variant insert/update failure and confirm no orphan or partial product mutation; customer cannot call/write; admin success; valid model/storage/color FKs; duplicate SKU rollback.  
**Rollback:** Restore prior UI flow only after disabling the RPC call; do not drop RPC while clients may still call it. Keep database objects until usage is confirmed.

### D10. Category and master catalog maintenance is not available in active admin UI

**Severity:** Medium, confirmed.  
**Evidence:** The live inventory admin reads categories/manufacturer hierarchy and offers product/variant entry, but no active Supabase UI creates or edits categories or master hierarchy. The old catalog management panel is localStorage-based and hidden behind a permanently false local-admin predicate.  
**Affected:** `categories`, manufacturer/series/model/storage/color tables; `src/admin-inventory.js`; `script.js`; existing seed generator.  
**Correction:** Continue reviewed seed/deployment workflow for master reference data or add role-gated CRUD to the Supabase admin if frequent maintenance is required. Avoid a new table; preserve validated FK relations.  
**Proposed migration:** N/A for seed-based operation; conditional `supabase/migrations/20261104160000_master_catalog_admin_policies.sql` only if verified policies need adjustment.  
**Risk:** Medium; bad reference-data edits can invalidate product choices or block inserts.  
**Tests:** Admin-only CRUD, FK rejection of invalid relationships, catalog selector refresh, existing product integrity.  
**Rollback:** Prefer deactivation/versioned data over deletion; restore captured values only after checking product references.

### D11. Customer order history is capped at 25 rows

**Severity:** Low, confirmed.  
**Evidence:** `refreshCustomerRecords()` selects orders newest-first with `.limit(25)`.  
**Affected:** `orders`; `script.js`.  
**Correction:** Add keyset/range pagination or separate recent and full-history views; preserve RLS ownership filter.  
**Proposed migration:** N/A.  
**Risk:** Low, application-only.  
**Tests:** More than 25 own orders across pages; stable ordering; no cross-user rows.  
**Rollback:** Revert to recent-25 display; no data changes.

## 5. Unverified Areas and No-Finding Conclusions

These are not asserted as confirmed defects:

- **Full RLS policies and forced RLS:** not received. Missing/unsafe policy conclusions require full policy metadata and role tests.
- **Complete indexes, constraints, and views:** primary/FK and selected checks are visible in verbose table metadata; full composite unique/check/index/view inventory is not. No index/constraint defect was confirmed. Compare live metadata with local migration intent before changing it.
- **Column ACLs:** not queried/returned; table grants are not a column-level audit.
- **Storage policies:** public bucket is confirmed; upload/update/delete policy behavior is not. Local migration text is not proof of deployed policies.
- **Routine bodies and owners:** function names, security-definer flags, paths, and API execute booleans are available; live bodies and owner details are not. Local source suggests the order RPC validates variant availability/stock, uses DB prices, locks stock rows, snapshots order lines, decrements stock transactionally, and deletes cart rows. Do not treat source as a live function-body verification.
- **Direct API exploitability of broad table ACLs:** no write was attempted. PostgreSQL RLS does not filter `TRUNCATE`, but actual exposure through Supabase API pathways was not established. Treat broad grants as a serious least-privilege issue requiring immediate authorized review, not as a demonstrated exploit.
- **Migration provenance:** empty migration list is confirmed; manual execution is only a likely explanation. Category rows may have been deleted, or migration content may have been selectively/equivalently applied.
- **Auth confirmation setting and phone behavior:** project auth settings were not inspected. Email-confirmation branch exists in source; whether it is active and whether the live trigger copies phone are unknown.
- **Admin role provisioning:** active admin route checks the profile role. Role creation/provisioning procedure and complete DB enforcement were not independently tested.
- **Guest repair abuse/rate limit:** no service configuration or abuse test was available.

## 6. Safe Remediation Sequence (No Changes Applied)

1. **Identity and baseline:** confirm the exact remote project using approved project metadata; obtain a schema-only backup/diff and complete catalog permissions/policies through the normal authorized path. Preserve the current live database and repository baseline.
2. **Migration provenance:** reconcile the empty migration list against deployment records and the exact definitions of local migrations. Do not replay either existing migration. Use supported migration-ledger reconciliation only after reviewed schema equivalence.
3. **Authorization review:** complete RLS, forced-RLS, table/column/schema/function grants, storage-policy, and owner checks. Run two-customer/admin/anon tests in staging. Only then author `20261104090000_restrict_api_role_grants.sql` and any conditional RLS/Storage policy migration. This step is sensitive and can disrupt the app.
4. **Phone profile creation:** after verifying the live trigger body, prepare `20261104120000_capture_signup_phone.sql` if needed. No user-row backfill without separate approval.
5. **Additive catalog bootstrap:** if approved after identity/baseline, add missing categories via `20261104110000_seed_missing_categories.sql`, then review and run the existing generated master-catalog seed separately. Enter real product/price/stock/image data through the admin route. These are additive but business data must be reviewed.
6. **Application gaps:** implement wishlist sync (no schema migration unless policy gap), transactional inventory writes (proposed RPC migration), and live order/repair admin workflows (UI-only unless policy changes are verified). Add guest repair tracking only after a token/account design review. Do not create tables by default.
7. **Release:** run unit tests, build, staging role-isolation and workflow tests, concurrency/stock and forged-price tests, and backup/restore rehearsal. Confirm staff payment/repair procedures and real catalog data before launch.

### Destructive or potentially breaking work to avoid

Do not replay the initial schema migration; drop/recreate objects; modify or delete existing customer/order/repair records; bulk-change prices/stock/roles; weaken RLS; expose repair records by ticket number; or change Auth/Storage project settings as part of this plan. Grant tightening is potentially breaking and must follow an exact baseline plus staging tests. Seed rollback must not delete referenced rows automatically.

## 7. Verification Checklist

- [x] Read the existing audit report in full and compare its main claims with current source/live metadata.
- [x] Confirmed configured reference from local `.mcp.json`; remote project identity still not independently confirmed.
- [x] Refreshed live public table metadata, migration list, and extension inventory.
- [x] Refreshed live routine and trigger metadata without retrieving function bodies.
- [x] Reviewed local migrations, seed generator, Supabase/auth/catalog/inventory modules, and customer/admin code paths.
- [x] Re-ran tests: 25 passed, 0 failed.
- [x] Preserved pre-existing uncommitted changes; created only this second report.
- [ ] Obtain complete live RLS policies, forced-RLS state, relation/view/index/constraint inventory, column grants, complete table ACLs, routine owners/bodies, and Storage object policies through normal authorized metadata access.
- [ ] Reconcile the migration ledger and verify target project identity before deployment planning becomes executable.
- [ ] Complete staging anon/customer/admin and storage boundary tests.
- [ ] Approve real catalog data and customer-facing payment/repair operations before launch.

**Conclusion:** The first report's principal feature and readiness assessments are supported, but live policy enforcement, exact ACL scope, storage policies, index inventory, function bodies, and migration provenance remain incomplete. The most actionable confirmed problems are broad API-role grants on multiple tables, an empty live catalog, missing live order/repair administration, local-only wishlist, and a non-atomic inventory write flow. The report proposes an ordered, risk-labeled plan; none of those changes has been implemented or applied.

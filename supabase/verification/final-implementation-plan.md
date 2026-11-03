# Arcadia Mobile: Final Implementation Preparation

**Status:** Preparation only. No Supabase migrations were applied; no database writes, app-code changes, auth/storage setting changes, commits, or pushes were made during this preparation. Existing uncommitted work was preserved.

**Configured Supabase project:** `vkpqylpesjknfrujwmag`  
**Project URL verification:** The read-only project URL tool returned `https://vkpqylpesjknfrujwmag.supabase.co`, matching the configured reference.  
**Audits reviewed in full:** `copilot-live-audit.md`, `copilot-deep-audit.md`, and `implementation-readiness.md`.

## 1. Executive Summary

The site already has a substantial Supabase-backed foundation. Its existing schema is sufficient for catalog, inventory, customer profiles, carts, wishlists, orders, order items, repairs, and public product images. Do not create duplicate versions of these objects.

The most urgent confirmed issue remains in `public.repair_requests`: the live INSERT policies check ownership only, and the live `anon` and `authenticated` roles have INSERT privileges on staff-managed columns (`status`, `contacted`, `repair_cost`, and `communication_notes`). A fresh read-only catalog query confirmed the columns, policies, and effective column INSERT privileges. The checked-in repair-policy migration is an unapplied draft. This plan adds a database-only submission RPC, removes direct API-role table INSERT, and keeps customer repair reads away from internal staff fields.

The live database also has broad direct table ACLs for API roles, but its RLS matrix restricts normal customer rows. The prepared grant allowlist is intentionally staged after the frontend is wired to the RPCs; it must not be used as a blind revoke. The database already has a bank-transfer-only order constraint and an order RPC. A fresh metadata-only check confirmed the deployed order routine contains a variant row lock, reads the database final price, checks stock, and creates pending bank-transfer orders. No customer data or secrets were read.

The migration tool still returns an empty migration list despite existing live tables, policies, functions, and triggers. That provenance mismatch is unresolved. The original schema migrations must not be replayed, and migration history must not be repaired or marked applied as part of this package.

## 2. Read-Only Findings and Boundaries

### Confirmed by fresh metadata reads

- The project URL matches `vkpqylpesjknfrujwmag`.
- The migration-list tool returned no migrations.
- Live public tables include the existing catalog/profile/cart/wishlist/order/repair objects. The table tool reported zero rows; no application rows were selected.
- `repair_requests` has non-null `ticket_number` without a default; customer-submittable fields and staff-managed fields are on the same table.
- The live customer repair INSERT policies constrain `user_id` only. Both API roles have INSERT privileges for all repair columns, including workflow/cost/notes fields.
- `handle_new_user()` exists and does not copy `phone` from Auth user metadata.
- The order RPC exists and metadata-only source checks found database `final_price`, a stock check, a variant row lock, and bank-transfer/pending status handling.
- The live table ACLs are direct grants to API roles; no explicit per-column ACLs were found. RLS remains the row boundary for `anon` and `authenticated`.
- The existing public `product-images` bucket and its public-read/admin-write design are for product imagery only.

### Confirmed from checked-in code and the reports

- Existing Auth, catalog retrieval, server-priced checkout, order history, repair submission, and authenticated cart synchronization are present.
- Wishlist rows exist in the database, but the site currently stores wishlists in browser localStorage only.
- The active Supabase admin UI manages inventory, not live order/payment or repair operations. Legacy order/repair screens use localStorage and are not an enabled substitute.
- Inventory creation currently makes separate product and variant writes; an unapplied `admin_save_inventory_item` RPC draft already exists.
- Email-confirmation signup can return before the browser updates the profile. The signup trigger currently omits phone.
- Guest repair submissions are supported, but guest self-service tracking is not. Ticket number alone must never become authorization.
- Existing static/fallback products are labelled preview-only; the current catalog state prevents preview items from checkout.
- Existing local migrations describe much of the live schema, but neither a live schema equivalence diff nor migration provenance is established.

### Not verified or not changed

- No application row, Auth user, private file, Storage object, publishable key, secret, or `.env` value was retrieved.
- No migration, SQL DML/DDL, permission change, RLS change, Auth setting, or Storage setting was executed.
- The exact remote migration-ledger origin and a full schema/deployment baseline remain unknown.
- No live anon/customer/admin integration test was run.
- Public product images remain public by design; this bucket must not contain customer/private uploads.

## 3. Security Design

### Repair submissions

Use the prepared `submit_repair_request` RPC for both guest and signed-in submissions. It accepts only the customer/device/problem fields; it derives `user_id` from `auth.uid()`, lets the database generate the ticket, and returns only the new ticket, initial status, and timestamp. It does not accept `status`, `contacted`, `repair_cost`, `communication_notes`, `id`, or timestamps. Revoke direct `INSERT` on the table from `PUBLIC`, `anon`, and `authenticated`; retain the existing RLS ownership policies with their safe-value checks as defense in depth.

For staff, retain the existing `is_admin()` RLS policy and use the prepared, guarded `admin_list_repair_requests` RPC for a paginated queue. Grant authenticated customers column-level reads only for their own customer-visible repair fields; do not grant them `contacted`, `repair_cost`, or `communication_notes`. Grant update privileges only for staff-managed columns; RLS still allows those updates to admins only. The admin list RPC must reject non-admin callers and use a fixed `search_path`.

### Other API grants

The live grants are broader than the UI requires. The last prepared migration revokes only API-role table grants on the 15 confirmed Arcadia tables, then grants a role/feature allowlist. It leaves RLS enabled and does not alter `service_role`, object ownership, schema usage, default privileges, or unrelated tables. Its dependencies include the app's switch to the prepared inventory and repair RPCs; applying it before that app release may break the current admin screen.

### Customer/admin boundaries

- Customers cannot set their profile role; the existing role-protection trigger and self-row RLS remain the database authority.
- Customers can only read their own profile, cart, wishlist, order, order-item, and repair rows.
- Orders are created through the existing `place_arcadia_order` RPC, which uses database prices and stock and supports bank transfer only. Keep `payment_status` pending until staff confirms transfer.
- Staff order/payment updates remain behind the existing admin RLS policy. No customer order update/insert policy should be added.
- Keep the service-role key out of all frontend modules and Vite-exposed variables. Add a configuration guard against secret/service-role key formats and a built-asset secret scan.
- Keep product image access public only for approved public product images; do not put repair/customer files in that bucket.

## 4. Migration Inventory and Application Order

All files below are local proposals/reference files only. **None is approved for execution.** Before any database deployment, verify the migration baseline and run the complete sequence against a disposable/staging clone. Do not add old migrations to the remote ledger or replay them.

### Existing baseline files (reference only; do not replay)

| File | Purpose and objects | Security and dependency | Verification and rollback |
|---|---|---|---|
| `../migrations/20260930000000_initial_schema.sql` | Historical creation of app enums, 15 tables, indexes, policies, triggers, and helper functions. | Existing live objects substantially match this schema. The file is not rerunnable and is not part of this release batch. | Compare every live object against a schema-only baseline. Do not execute or mark applied without a separately verified reconciliation plan. No rollback is proposed. |
| `../migrations/20261001220000_production_foundation.sql` | Historical category seed, `product-images` bucket/policies, variant read policy, and order RPC/security grants. | Live structural effects are present or equivalent; category rows are currently absent. The file is not fully rerunnable (`ALTER POLICY`). | Compare exact live definitions. Do not replay. Do not roll back existing schema or public image access as part of this task. |

### Prepared migration drafts

| Order | File | Purpose and exact objects | Security implications and dependencies | Verification and rollback |
|---|---|---|---|---|
| 1 | `../migrations/20261103100000_restrict_repair_request_submission_fields.sql` | Tightens `customers create own repairs` and `guests may submit unowned repairs` policies on `public.repair_requests`; requires initial status, `contacted=false`, null cost, and null staff notes. | RLS defense-in-depth; depends on the confirmed enum/columns and exact live policy names. Does not remove table INSERT privileges by itself. | Test anon/customer valid submission and rejection of forged staff values; admin updates remain allowed. Rollback restores the exact reviewed prior policy and reopens the integrity issue, so do not roll back without disabling untrusted submission or another guard. |
| 2 | `../migrations/20261103120000_capture_signup_phone_metadata.sql` | Replaces `public.handle_new_user()` to copy `full_name` and `phone` metadata when creating `profiles`; conflict does not overwrite existing profiles. | `SECURITY DEFINER` with fixed path and qualified table; no bulk user backfill. Depends on confirming the existing trigger binding/function owner. | Test immediate and email-confirmed signup, empty phone, conflict, and role protection. Restore the captured prior function definition with a compensating migration if needed; retain the trigger. |
| 3 | `../migrations/20261103130000_admin_save_inventory_item.sql` | Adds `public.admin_save_inventory_item(...)` to create/update `products` and `product_variants` atomically, validating admin role, inputs, stock/availability, and relational constraints. | `SECURITY DEFINER`, fixed path, explicit execute grants, and server-side authorization. The current `src/admin-workflows.js` integration calls this RPC. | Test create/update, invalid relationships/SKU, non-admin call, and rollback on variant failure. Keep the function until all clients have stopped using it; roll back through a reviewed replacement, not by dropping an in-use RPC. |
| 4 | `../migrations/20261103140000_seed_arcadia_categories.sql` | Idempotently adds the existing ten Arcadia categories to `public.categories`; no new schema objects. | Additive data only. Requires project identity/baseline review and owner approval of category names. Does not seed demo products or real stock. | Read back category list/count and selectors. Do not delete categories during rollback because future products may reference them. |
| 5 | `../migrations/20261103150000_secure_repair_request_submission.sql` | Adds a server-generated `ticket_number` default and `public.submit_repair_request(...)`; returns only ticket/status/time. It deliberately leaves direct INSERT privileges in place temporarily so the app can be deployed before the grant reduction. | `SECURITY DEFINER`, `search_path = pg_catalog, public, auth, pg_temp`, explicit execute grants to anon/authenticated, input validation, user ID from `auth.uid()`, and no staff-managed RPC parameters. `script.js` now submits through this RPC. | In staging verify guest/customer success, malformed requests fail, no user can choose ticket/owner/status/cost/notes, and response exposes no extra PII. Rollback only after capturing the previous default/function state and providing a safe alternate submission path. |
| 6 | `../migrations/20261103155000_admin_repair_queue_rpc.sql` | Adds guarded, paginated `public.admin_list_repair_requests(...)`, returning repair details only to a verified administrator. | `SECURITY DEFINER`, fixed `search_path`, explicit execute grant only to authenticated, explicit `is_admin()` check, and bounded page size. The current admin UI calls this RPC for staff-only fields. | Test anon/customer calls are denied, admin pagination is stable, and the RPC is the only staff read path for internal fields after column grants are narrowed. Roll back through a compensating function/grant change only after disabling dependent UI. |
| 7 | `../verification/staged-migrations/stage-c/20261103160000_narrow_api_table_privileges.sql` | Preliminary partial reduction of API-role privileges on the 15 public tables and anonymous Storage writes. | Not a final allowlist; it is deliberately outside the default migration directory. Apply only after the frontend release and staging tests, immediately before the final grant migration. | Verify every customer/admin workflow after each step. Roll back only with a reviewed exact ACL snapshot, never `GRANT ALL`. |
| 8 | `../verification/staged-migrations/stage-c/20261103161000_least_privilege_api_grants.sql` | Replaces anon/authenticated grants for the 15 Arcadia tables with explicit catalog, profile, cart, wishlist, order, image, and customer-safe repair column privileges. | Removes broad authenticated CRUD and direct repair table INSERT only after the app uses the inventory/order/repair RPCs. Preserves RLS; does not touch service-role grants, auth/storage settings, schema privileges, or other tables. Depends on full ACL review and staging role tests. | Assert effective table/column grants plus anon/customer A/customer B/admin workflows. Roll back only to a captured ACL baseline with compensating grants; a broad grant restore is prohibited. |

After an approved provenance reconciliation and successful staging rehearsal, use this coordinated order:

1. Apply the six pending files in `../migrations/` in filename order: `20261103100000_restrict_repair_request_submission_fields.sql`, `20261103120000_capture_signup_phone_metadata.sql`, `20261103130000_admin_save_inventory_item.sql`, `20261103140000_seed_arcadia_categories.sql`, `20261103150000_secure_repair_request_submission.sql`, and `20261103155000_admin_repair_queue_rpc.sql`.
2. Separately review and apply `../seed/master-catalog-seed.sql` if the manufacturer/model/storage/color reference data is absent; approve category and catalog seed content before applying either data seed. These scripts do not create real products, prices, stock, or images.
3. Deploy the frontend release that calls `admin_save_inventory_item`, `place_arcadia_order`, `submit_repair_request`, and `admin_list_repair_requests`; verify guest repair submission, customer signup/cart/order/history, and admin inventory/order/repair operations in staging.
4. Capture and review the complete effective ACL baseline. Only then apply `20261103160000_narrow_api_table_privileges.sql` followed immediately by `20261103161000_least_privilege_api_grants.sql` from `../verification/staged-migrations/stage-c/`, and rerun the role/workflow tests.

The order RPC is already provided by the historical production foundation migration; do not replay that file to create it. The staged grant files are intentionally outside the default migration directory. Do not run any migrations, seeds, or ACL changes against production until project identity and migration provenance are reconciled and an authorized operator approves the deployment. No live database change is part of this implementation.

## 5. Existing Objects Reused (No Duplicate Schema)

| Feature | Existing objects/design | Migration need |
|---|---|---|
| Catalog and categories | `categories`, `manufacturers`, `manufacturer_series`, `manufacturer_models`, `model_storage_options`, `model_storage_colors`, `products`, `product_variants`, `product_images`; relational FKs and price/stock constraints. | Category seed draft only. The generated `supabase/seed/master-catalog-seed.sql` is separate and must be reviewed before any data load. |
| Profiles/auth/admin | Supabase Auth, `profiles`, `app_role`, `handle_new_user`, role-escalation trigger, `is_admin()`, existing admin RLS policies. | Phone metadata function draft; no new roles/table. Admin role provisioning remains privileged/out-of-band. |
| Cart/wishlist | Existing owner-scoped `carts` and `wishlists`, unique keys/indexes, and RLS. | No schema change for persistence; frontend synchronization only. |
| Checkout/orders | `orders`, `order_items`, bank-transfer constraint, pending status, `place_arcadia_order`. | No duplicate order tables/RPC. Verify actual deployed function against the live metadata source and test in staging. |
| Repairs | `repair_requests`, `repair_status`, owner/admin RLS policies, timestamp trigger. | Safe submission RPC/default and least-privilege grants; no repair table duplication. |
| Images | Existing public `product-images` bucket and `product_images` metadata. | No change for public product imagery; verify only approved images are stored there. |

## 6. Frontend Implementation Map

No frontend source file was changed for this preparation. Implement the following as a coordinated application phase, preserving existing branding, visual hierarchy, breakpoints, mobile layout, and customer flow.

| File | Required implementation |
|---|---|
| `script.js` | Keep current catalog/customer experience. Route repair submissions through `submit_repair_request` and display only its returned ticket/status/time; stop sending a client-generated ticket or `user_id`. Keep guest tracking unavailable unless a separate high-entropy token design is approved. Add wishlist load/merge/save for signed-in users using existing `wishlists`; preserve guest-only local state and isolate it from account changes/sign-out. Add live order/payment and repair admin sections to the active Supabase-admin route rather than enabling legacy localStorage admin flows. Surface signup profile-update errors; retain order RPC checkout and account-scoped history. |
| `src/supabase.js` | Continue creating only the public-key Supabase client. Never import or embed service-role credentials. Use the existing auth/session lifecycle; do not expose privileged server credentials. |
| `src/supabase-config.js` | Fail closed for missing/invalid config and reject secret/service-role key formats (including a JWT whose role is `service_role`). Extend config tests. Keep URL and public anon/publishable key in browser configuration only. |
| `src/storefront-data.js` | Continue fetching live catalog relationships and safely reporting incomplete/error state. Ensure UI uses live UUID-backed variants for all persistence and checkout; do not treat fallback products as database inventory. |
| `src/storefront-pricing.js` | Keep display-only normalization. It must not be used as checkout authority; submitted totals/prices are never accepted by the order RPC. |
| `src/catalog-state.js` | Preserve `catalogSource`/UUID checks and preview-only behavior. Ensure preview products cannot enter persisted cart rows or checkout even if manipulated in localStorage. |
| `src/admin-inventory.js` | Replace separate product/variant writes and unchecked cleanup with `admin_save_inventory_item`. Add order list/detail and bank-transfer payment/order status updates through the existing admin authorization boundary. Add a repair queue via `admin_list_repair_requests`, and update only staff fields under admin RLS. Keep PII visible only to authorized admins. Keep Storage upload constraints and existing CSS patterns. |
| `src/auth-state.js` | Ensure identity changes clear prior account state before hydrating another account; account-specific cart, wishlist, profile, orders, and repairs must never bleed between users. Make service hydration errors visible and preserve subscription cleanup. |
| `styles.css` | Reuse current typography, spacing, colors, focus states, and mobile breakpoints for admin order/repair panels; do not redesign the storefront. Add accessible responsive tables/forms or mobile equivalents as needed. |
| `index.html` | Keep the current app shell and routes unless mounting the expanded admin panel requires a minimal hook; do not replace page structure or branding. |
| `tests/*.test.js` | Extend focused unit/config/catalog/auth/inventory tests, and add staging integration coverage described below. Keep all current tests passing. |
| `supabase/seed/generate-master-catalog-sql.js` and generated seed | Review and use only for reference/master catalog data after baseline approval. Do not promote fallback/demo product data to real purchasable inventory. |

## 7. Automated and Integration Test Plan

Run unit tests without a live database by injecting/mocking the Supabase client. Run integration tests only against an isolated staging project with synthetic accounts/data; never use production customer records. Every negative test must assert the request is rejected and no unintended row changes.

| Area | Automated checks | Staging integration checks |
|---|---|---|
| Anonymous visitor | Unconfigured/error behavior; preview/live state; no service-key formats accepted. | Anonymous catalog/category/image reads work; private customer tables are unreadable; no direct repair table INSERT or admin RPC access. |
| Registration/login | Auth state restoration, event transitions, config, signup input validation, profile update error display. | Register, confirm email, sign in/out/reset; profile trigger creates a customer profile with phone; second registration cannot set admin role. |
| Profile/admin authorization | Test role guards and account switch cleanup. | Customer can read/update own name/phone only; cannot change role or read another profile. Non-admin fails inventory/order/repair admin RPC/UI; approved admin succeeds. |
| Catalog/inventory | Catalog mapping, pagination, missing FK/color handling, live/empty/error states, price normalization, inventory input validation. | Catalog reads match relational hierarchy; admin create/edit runs atomic RPC; invalid category/model/storage/color/SKU is rejected; non-admin cannot write stock or price. |
| Cart | Mock owner-keyed upsert/delete/load, persistence errors, identity change. | Customer A cart persists across sessions; customer B cannot select/update/delete A's rows; preview items never sync. |
| Wishlist | Guest local persistence, sign-in merge, duplicate handling, sign-out/account switch isolation, network errors. | Existing `wishlists` owner policy prevents cross-user read/write; no new table is created. |
| Checkout/order | Checkout rejects guests, empty/preview/mixed cart; only bank transfer choice; no client total sent as authority. | Forged prices/discounts/totals are ignored; invalid/inactive/out-of-stock variants fail; row-lock concurrency cannot oversell; order and lines snapshot server data; cart clears only on success; initial payment status remains pending. |
| Order history/payment | UI shows only returned records, status display and pagination. | Customer A cannot read/change customer B orders/items or any payment/order status; admin can update approved status/payment fields; bank transfer remains the only method. |
| Repair submission/staff | RPC payload excludes staff fields; inputs and response shape are tested; failure is surfaced. | Guest and customer submissions succeed with server ticket/default status; attempts to set status/contacted/cost/internal notes/owner/ticket are impossible or rejected; customer A/B isolation holds; only admin can list internal notes or change staff fields. |
| Storage | Validate image type/size/path and upload failure cleanup. | Public product image read; anon upload denied; non-admin write/delete denied; admin upload/update/delete allowed. Do not place customer/private files in the public bucket. |
| ACL/RLS migration | Assert intended SQL grant allowlist and fixed function search paths in a migration review/test. | Verify effective grants, RLS policies, and role behavior before/after staged migration; test exact rollback in disposable staging. |
| Release integrity | `npm test`; `npm run build`; scan built assets for service-role/secret key patterns. | Smoke test responsive storefront, account, admin, order, repair, and storage flows on desktop/mobile with synthetic data. |

Existing focused tests include `auth-state.test.js`, `catalog-state.test.js`, `inspection-script.test.js`, `storefront-data.test.js`, `storefront-pricing.test.js`, and `supabase-config.test.js`. The suite and production build are run as part of this preparation; their results are reported with the deliverables.

## 8. Outstanding Decisions and Blockers

1. **Migration provenance:** The live migration list is empty although schema objects exist. Obtain an authorized schema-only diff and deployment history; independently confirm how the existing schema was created. Do not replay or mark the historical files applied without an explicitly reviewed reconciliation plan.
2. **Migration rollout ordering:** The prepared `20261103110000` file precedes the RPC drafts by version but requires the RPC-based repair frontend; `20261103160000` also requires the frontend to stop direct inventory writes. Decide on a staged migration/reconciliation mechanism or revise the unapplied draft set through an approved process before any automated migration run.
3. **Grant rollout timing:** The final allowlist revokes direct inventory writes after frontend code uses `admin_save_inventory_item`; coordinate browser cache/support window and deployment order to avoid breaking active clients.
4. **Admin workflow rules:** Approve permitted order/payment and repair status transitions, staff roles, visibility of customer PII, and manual bank-transfer confirmation procedures.
5. **Guest repair tracking:** Decide whether guest tracking stays unavailable (recommended until approved) or requires a separately reviewed high-entropy token design. Never authorize by ticket number.
6. **Catalog data:** Approve category/master data and real products/prices/stock/images separately. Live public table metadata reports zero rows; this package does not seed the live database.
7. **Admin reference data:** Current active Supabase admin UI does not create categories or manufacturer/model/storage/color reference rows. Decide whether reviewed seed operations are sufficient or a future role-gated UI is required.
8. **Business values:** Reconfirm delivery fee logic, transfer instructions, order/payment operations, repair staffing, privacy retention, monitoring, and backup/restore before launch.
9. **Project verification:** The Supabase URL returned by the tool matches the configured reference, but production migration execution still requires approval and a documented baseline.

## 9. Stop Point

The prepared migration drafts and plan are for review only. No migration, data seed, grant change, RLS change, authentication/storage setting change, commit, or push was performed. Do not execute any migration until the migration history/schema baseline, rollout dependencies, and outstanding business/security decisions are approved.

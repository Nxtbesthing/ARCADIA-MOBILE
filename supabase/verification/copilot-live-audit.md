# Arcadia Mobile Supabase and Website Audit

**Audit date:** 2026-11-03  
**Scope:** Read-only inspection of the local Arcadia Mobile website and Supabase metadata. No application rows, authentication users, storage objects, keys, or credentials were read. No SQL writes, migrations, or local source edits were performed.

## 1. Connection and Scope

- The workspace `.mcp.json` configures the Supabase MCP URL with `project_ref=vkpqylpesjknfrujwmag`, `features=database,docs,development`, and `read_only=true`.
- Supabase MCP responded to the table, migration, extension, function, trigger, grants, schema ACL, and bucket metadata reads below. The returned database metadata did not echo a project reference. The configured target is therefore `vkpqylpesjknfrujwmag`, but the database's independent project identity was not established by a response field.
- Available MCP tools in this session: `mcp_supabase_list_tables`, `mcp_supabase_list_extensions`, `mcp_supabase_get_publishable_keys`, `mcp_supabase_list_migrations`, and `mcp_supabase_execute_sql`. The key tool was not called. `mcp_supabase_execute_sql` is a general SQL tool, not inherently read-only; every SQL statement issued in this audit began with `SELECT`.
- The MCP URL requests read-only behavior, but enforcement of that setting was not independently tested. No write operation was attempted.
- The live migration-list tool returned an empty list. This does not prove that no migrations were applied: live application tables, functions, and triggers exist, and two local migration files are present. Reconcile the migration ledger and live schema before applying any migration.
- Some broad catalog-query outputs (columns, constraints, indexes, relation RLS flags, and the full policy list) were withheld or truncated by the MCP host. Those details are marked unverified below rather than inferred to be absent.

## 2. Live Database Inventory

### Relations and data readiness

The verbose table-list tool returned these 15 `public` tables, each with RLS enabled and a tool-reported row count of zero:

`manufacturers`, `manufacturer_series`, `manufacturer_models`, `model_storage_options`, `model_storage_colors`, `categories`, `profiles`, `products`, `product_variants`, `product_images`, `carts`, `wishlists`, `orders`, `order_items`, and `repair_requests`.

No application rows were selected. The row counts above are the metadata returned by the MCP table tool. That tool did not establish whether public views exist; the separate relation-catalog query was not shared, so view inventory is unverified.

### Columns, types, defaults, and nullability

The live verbose table metadata provided the following column inventory. `?` means nullable; columns without `?` were reported non-null. `PK` is a primary key; `FK` is a foreign key. Timestamps commonly default to `now()`, and UUID primary keys commonly default to `gen_random_uuid()` as indicated.

| Table | Live columns and notable metadata |
|---|---|
| `manufacturers` | `id uuid PK` (generated UUID), `name text` (unique), `created_at timestamptz`, `updated_at timestamptz` |
| `manufacturer_series` | `id uuid PK`, `manufacturer_id uuid FK`, `name text`, `created_at timestamptz`, `updated_at timestamptz` |
| `manufacturer_models` | `id uuid PK`, `series_id uuid FK`, `name text`, `created_at timestamptz`, `updated_at timestamptz` |
| `model_storage_options` | `id uuid PK`, `model_id uuid FK`, `storage_label text`, `created_at timestamptz`, `updated_at timestamptz` |
| `model_storage_colors` | `storage_option_id uuid FK`, `color_name text`, `created_at timestamptz`; composite PK is `(storage_option_id, color_name)` |
| `categories` | `id uuid PK`, `name text` (unique), `slug text` (unique), `active boolean` default `true`, `created_at timestamptz`, `updated_at timestamptz` |
| `profiles` | `id uuid PK, FK auth.users.id`, `full_name text?`, `phone text?`, `role app_role` default `customer`, `created_at timestamptz`, `updated_at timestamptz`; role labels reported: `customer`, `admin` |
| `products` | `id uuid PK`, `manufacturer_model_id uuid FK`, `category_id uuid FK`, `name text`, `description text?`, `active boolean` default `true`, `created_at timestamptz`, `updated_at timestamptz` |
| `product_variants` | `id uuid PK`, `product_id uuid FK`, `manufacturer_model_id uuid`, `model_storage_option_id uuid`, `color_name text`, `sku text`, `stock_quantity integer` default `0`, check `>= 0`, `availability product_availability` default `active`, `condition text` default `New`, `original_price numeric` check `>= 0`, `discount_percentage numeric` default `0`, check `0..100`, `discount_amount numeric` generated, `final_price numeric` generated, `warranty text` default `No Warranty`, `battery_health smallint?` check `0..100`, `created_at timestamptz`, `updated_at timestamptz`; availability labels: `active`, `out_of_stock`, `hidden` |
| `product_images` | `id uuid PK`, `product_id uuid FK`, `variant_id uuid? FK`, `storage_path text` (unique), `alt_text text?`, `sort_order integer` default `0`, check `>= 0`, `is_primary boolean` default `false`, `created_at timestamptz`, `updated_at timestamptz` |
| `carts` | `id uuid PK`, `user_id uuid FK auth.users.id`, `product_id uuid FK`, `variant_id uuid FK`, `quantity integer` check `> 0`, `created_at timestamptz`, `updated_at timestamptz` |
| `wishlists` | `id uuid PK`, `user_id uuid FK auth.users.id`, `product_id uuid FK`, `variant_id uuid? FK`, `created_at timestamptz` |
| `orders` | `id uuid PK`, `user_id uuid? FK auth.users.id`, `order_number text` (unique), `status order_status` default `pending`, `subtotal numeric` check `>= 0`, `discount_total numeric` default `0`, `delivery_fee numeric` default `0`, `grand_total numeric`, `payment_method text` default `bank_transfer` with bank-transfer-only check, `payment_status payment_status` default `pending`, `delivery_method text` constrained to delivery/pickup, `delivery_state text?`, `delivery_city text?`, `delivery_address text?`, `customer_name text`, `customer_phone text`, `customer_email text`, `created_at timestamptz`, `updated_at timestamptz`; status labels: pending, confirmed, processing, shipped, delivered, cancelled; payment labels: pending, awaiting_confirmation, paid, failed, refunded |
| `order_items` | `id uuid PK`, `order_id uuid FK`, `product_id uuid? FK`, `variant_id uuid? FK`, `product_name text`, `variant_description text?`, `sku text`, `quantity integer` check `> 0`, `unit_price numeric` check `>= 0`, `discount_amount numeric` default `0`, `final_unit_price numeric`, `warranty text?`, `line_total numeric` generated, `created_at timestamptz` |
| `repair_requests` | `id uuid PK`, `ticket_number text` (unique), `user_id uuid? FK auth.users.id`, `customer_name text`, `customer_phone text`, `customer_email text`, `device text`, `device_details text?`, `problem text`, `description text?`, `contacted boolean` default `false`, `repair_cost numeric?` check `>= 0` when present, `communication_notes text?`, `status repair_status` default `requested`, `preferred_date date?`, `created_at timestamptz`, `updated_at timestamptz`; status labels: requested, received, diagnosing, awaiting_approval, repairing, testing, ready, completed, cancelled |

The live metadata confirmed the primary keys and extensive foreign-key relationships. In particular, variants are constrained to the product's model, an option belonging to that model, and a color belonging to that storage option; images and cart/wishlist/order items are linked back to their product/variant. The live tool also exposed column-level check constraints and single-column unique markers noted above. Full composite-unique/check-constraint catalog output and the full index list were not available from the MCP response.

The local initial migration additionally defines composite uniqueness and indexes, including case-insensitive unique SKU and one primary image per product. Treat those as local intended schema, not fully verified live indexes, until the live index query is available.

### RLS, policies, grants, and triggers

- The live table-list tool reports RLS enabled on all 15 listed public tables. The live `relforcerowsecurity` result was withheld; forced-RLS status is unknown.
- The visible portion of the live policy result included owner-scoped cart management, public read of active categories and catalog models, and authenticated admin category/model policies. The complete policy result was truncated. Do not treat the local policy files as proof of the complete live policy matrix.
- The local migrations define own-row policies for profile, cart, wishlist, order history, order items, and repairs, plus `is_admin()`-gated admin policies. The production-foundation migration removes direct customer order/order-item creation policies in favor of the RPC. These definitions are useful as design intent but need a complete live comparison.
- Live schema ACL metadata showed `USAGE` for `anon`, `authenticated`, and `service_role` on `auth`, `public`, and `storage`; `PUBLIC` also has `USAGE` on `public`. No `CREATE` schema grant was shown for those roles.
- The table ACL query showed broad privileges including `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE` for `anon`, `authenticated`, and `service_role` on public tables (the response was truncated, but the pattern is visible across multiple tables). RLS restricts row operations where applicable, but PostgreSQL `TRUNCATE` is not filtered by RLS. The normal Supabase Data API does not expose a SQL `TRUNCATE` endpoint, so this audit does not claim an anonymous truncate exploit; the ACL is nevertheless excessive and should be reduced to the minimum supported API operations.
- The live trigger catalog returned 15 enabled user triggers: `on_auth_user_created` on `auth.users`; `prevent_profile_role_escalation` on `profiles`; `validate_customer_order_before_insert` on `orders`; and `set_updated_at` triggers on profiles, manufacturers, series, models, storage options, categories, products, variants, images, carts, orders, and repairs. No trigger rows were returned for `wishlists` or `order_items`; neither has an `updated_at` column in the reported schema.
- Trigger functions and routine ACLs need careful handling: the live routine metadata reports `SECURITY DEFINER` for `handle_new_user`, `is_admin`, `place_arcadia_order`, `prevent_profile_role_escalation`, and `validate_customer_order`; `set_updated_at` is not security definer. Live configured paths are `public` for the first group other than `place_arcadia_order`, whose path is `public, pg_temp`; `set_updated_at` has no explicit function setting. The `is_admin()` routine is callable by anon and authenticated and returns only a boolean. The order RPC is not executable by anon and is executable by authenticated/service_role. Trigger-returning routines report execute grants to API roles, but are not ordinary PostgREST RPCs. The local schema grants no CREATE on `public`, which reduces search-path object-shadowing risk; retain fixed, safe paths and explicit object qualification.
- The full live table-policy matrix, forced-RLS flags, and per-table grant list were not delivered. No customer data or policy-bypass tests were performed.

### Functions and RPCs

Live public routine metadata returned six routines:

| Routine | Live metadata |
|---|---|
| `handle_new_user()` | trigger, PL/pgSQL, `SECURITY DEFINER`, `search_path=public`; API roles report execute |
| `is_admin()` | boolean, SQL, stable, `SECURITY DEFINER`, `search_path=public`; API roles report execute |
| `place_arcadia_order(jsonb,text,text,text,text,text,text)` | JSONB, PL/pgSQL, `SECURITY DEFINER`, `search_path=public, pg_temp`; anon cannot execute, authenticated/service_role can |
| `prevent_profile_role_escalation()` | trigger, PL/pgSQL, `SECURITY DEFINER`, `search_path=public`; API roles report execute |
| `set_updated_at()` | trigger, PL/pgSQL, not security definer, no explicit function settings; API roles report execute |
| `validate_customer_order()` | trigger, PL/pgSQL, `SECURITY DEFINER`, `search_path=public`; API roles report execute |

Function bodies were not fetched from the live database. Local migration source for `place_arcadia_order` uses server-side variant prices, validates variant availability and stock, locks selected product rows, derives totals/delivery fee on the server, creates order/item snapshots, decrements stock transactionally, and clears the customer's cart. It accepts variant IDs and quantities from the client rather than trusting client-supplied prices. This is a strong intended design; validate the deployed definition against source before release.

### Storage, migrations, extensions

- Live storage metadata returned bucket `product-images`: public read, 10 MiB size limit, MIME allowlist `image/jpeg`, `image/png`, `image/webp`, `image/avif`. No storage objects were read. The full live storage policy list was not available; the local production migration defines public read and `is_admin()`-gated upload/update/delete policies, but live policies still need confirmation.
- Live migration-list tool returned `[]`, although the database contains the schema and routines described above. Local files are `supabase/migrations/20260930000000_initial_schema.sql` and `supabase/migrations/20261001220000_production_foundation.sql`. Do not replay either against this existing schema without reconciling migration state and taking a schema diff.
- The extension tool reported installed versions for `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, and `plpgsql`. Its full output also lists available-but-not-installed extensions; those are not treated as installed.

## 3. Website and Database Compatibility

Reviewed the Supabase client/config modules, storefront data/pricing/catalog state, Supabase inventory screen, auth state, main `script.js`, both migrations, both verification SQL files, catalog seed generator, package scripts, and existing tests.

- **Catalog/categories:** `src/storefront-data.js` reads active categories and products, then maps manufacturer/series/model/storage/color, variants, and image paths. Database foreign keys support the required manufacturer → series → model → storage → valid color hierarchy. The client also rejects malformed or incomplete mappings. However, the live tool reports zero rows for every public table, including categories and catalog data. The Supabase inventory form disables product creation when categories are absent. The local production migration intends to seed categories, and `supabase/seed/master-catalog-seed.sql` is generated from the existing device catalog, but the live data state does not show those rows.
- **Inventory, price, discounts:** `product_variants` contains stock and price fields with checks and generated discount/final-price columns. `src/admin-inventory.js` authenticates with Supabase Auth, checks `profiles.role === 'admin'`, and writes to the existing catalog tables. These database-backed admin operations are appropriately role-gated in the UI and intended RLS policies. Live empty catalog data means inventory cannot yet be operational.
- **Images:** product metadata is stored in `product_images`; the web client constructs public URLs from the public bucket. The dedicated inventory screen validates file type/size and writes metadata. Bucket limits match the UI's 10 MiB and accepted MIME types. Confirm live storage object policies before allowing uploads.
- **Customer auth/profile:** the site uses Supabase Auth for signup, password login, password reset, session restore, sign-out, and profile read/update. Signup sends `full_name` and `phone` as Auth user metadata. The local/live auth trigger function's migration definition only copies `full_name` into `profiles`; the browser updates both fields only when signup immediately returns a session. With email confirmation enabled, signup returns before that browser update, so the profile phone is omitted. The update error is also ignored when it is attempted.
- **Admin authentication:** `#admin/inventory` uses Supabase Auth and checks the database profile role before loading or mutating inventory. The live role-escalation trigger exists, and the local policy design uses `is_admin()`. This is a sound boundary in principle. Full live RLS policies were not available, so authorization should be rechecked with actual anon/customer/admin sessions before launch. Legacy `#admin/*` administration is disabled (`isLocalAdminAuthenticated()` returns false); it is not the Supabase admin console.
- **Cart:** guest cart uses localStorage; authenticated carts sync to `public.carts` and reload from the signed-in user's rows. The code only syncs purchasable live UUID-backed variants and constrains ownership in the request. This supports cross-session cart persistence subject to live RLS verification.
- **Wishlist:** `public.wishlists` exists, but `script.js` stores and loads the wishlist only from localStorage. It is not synchronized to the database, so it is device/browser-local and not available across devices or sessions.
- **Checkout/orders/payment:** the frontend requires a signed-in user and live catalog items, then calls `place_arcadia_order`. The local RPC design computes price, discount, stock, delivery fee, order totals, and snapshots on the server, and the database enforces bank transfer as the only payment method. The app presents transfer instructions and leaves payment pending for manual confirmation. Customer order history reads the authenticated user's orders. These customer paths are present, but live empty inventory means no real checkout can currently succeed.
- **Order operations:** the database has status/payment fields and admin-oriented policies in local migrations, but the legacy admin order screen reads localStorage. The Supabase inventory screen manages products/images only; it has no live order/payment-status management UI. Staff cannot reliably manage live order lifecycle through the current operations UI.
- **Repairs:** request submission uses `repair_requests`, supports authenticated and guest submissions, and signed-in customers can see their own requests. Guest requests are stored with `user_id=null`; the tracking flow requires login and filters by the signed-in user, so guests cannot use it to track their guest request. The legacy admin repair screen reads/writes localStorage, not Supabase; database repair status/cost/notes management is not connected.
- **Customer order history:** supported for signed-in accounts by querying the user's own orders. The account display currently shows recent orders only (up to 25), not paginated full history.
- **Credentials:** source references `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, which are expected browser-side configuration values. A source scan found no `service_role`, `sb_secret`, or service-role key symbol under `src/`. `.env` is ignored by git and was not opened or read. No key values were retrieved.

## 4. Findings and Priorities

No confirmed critical exploit was established in this read-only audit. The policy output was incomplete, so absence of a demonstrated exploit is not a substitute for authorization tests.

### HIGH — Public API roles have excessive table ACLs

**Exists:** Live table ACL output shows `anon` (and `authenticated`) granted broad table privileges including insert/update/delete and `TRUNCATE` on public relations; all listed application tables have RLS enabled.  
**Problem:** RLS controls row access but does not protect `TRUNCATE`; grants also exceed the operations needed by the storefront. The visible policy output is incomplete, and the audit did not attempt writes.  
**Objects:** Public table ACLs, RLS policies, `.mcp.json` read-only setting (tool-level), and client-facing Supabase API roles.  
**Impact:** Excess privilege increases the impact of a future or overlooked policy/API exposure and is especially risky for non-RLS operations. A direct anonymous exploit through the current HTTP API was not demonstrated.  
**Correction:** After capturing the full live ACL/policy matrix, revoke non-API privileges (at minimum `TRUNCATE`, `MAINTAIN`, `REFERENCES`, and `TRIGGER`) from `anon` and `authenticated`; replace blanket grants with an explicit per-table operation allowlist. Preserve only guest repair insert, public catalog reads, customer-owned operations, and admin operations required by the app. Verify RLS independently.

### HIGH — Live catalog and categories are empty

**Exists:** MCP metadata reports zero rows for all 15 public tables. The storefront uses live Supabase catalog data for purchasable inventory.  
**Problem:** No category, manufacturer, device master catalog, product, variant, or image metadata is available. The Supabase inventory form cannot create products without a category.  
**Objects:** `categories`, `manufacturers`, `manufacturer_series`, `manufacturer_models`, `model_storage_options`, `model_storage_colors`, `products`, `product_variants`, `product_images`; `src/storefront-data.js`; `src/admin-inventory.js`; existing catalog seed.  
**Impact:** Storefront falls back to clearly marked non-purchasable preview products; product creation and checkout are blocked until reference data and real inventory exist.  
**Correction:** After verifying the target project and migration baseline, seed the existing category set and generated master catalog, then enter reviewed actual products, stock, prices, and images. Do not import preview/demo inventory as real stock.

### HIGH — Migration ledger does not match the live schema evidence

**Exists:** Live migration-list API returns no migrations, while live tables, functions, and triggers exist and two local migrations describe their creation.  
**Problem:** Deployment provenance is unresolved; blindly replaying the initial schema could collide with existing objects or cause destructive changes.  
**Objects:** Supabase migration history; `supabase/migrations/20260930000000_initial_schema.sql`; `supabase/migrations/20261001220000_production_foundation.sql`.  
**Impact:** Future deploys may fail or drift; an unsafe attempt to recover migration history can damage an existing project.  
**Correction:** Compare a full live schema dump/diff with both migrations and deployment records. Reconcile migration history only after verifying the exact project and reviewed baseline. Do not rerun the initial schema migration against the existing database.

### HIGH — Live order and repair operations are not connected to the admin UI

**Exists:** Supabase inventory is role-gated, while the legacy operations sections in `script.js` use localStorage for orders and repairs and legacy local admin is disabled.  
**Problem:** Database orders, payments, and repair requests have no usable live admin workflow in the current website.  
**Objects:** `orders`, `order_items`, `repair_requests`; `src/admin-inventory.js`; `script.js`.  
**Impact:** Staff cannot reliably confirm bank transfers, progress orders, or manage repair status/cost/notes from the website; local browser data does not represent live customer submissions.  
**Correction:** Add role-gated order and repair views to the existing Supabase admin flow, using the existing database tables and policies. Keep order total and payment status updates admin-only.

### MEDIUM — Signup phone metadata is not reliably copied into profiles

**Exists:** Signup sends name and phone as Auth metadata; the profile trigger copies name only; the browser updates name/phone only when a session is immediately returned.  
**Problem:** Email-confirmation signup skips the client profile update, and the current client ignores update errors.  
**Objects:** `handle_new_user()`; `profiles.phone`; `script.js`; both auth migration definitions.  
**Impact:** New customers may have no saved phone after signup, requiring re-entry at checkout/repair and creating inconsistent profiles.  
**Correction:** Update `handle_new_user()` to insert the phone metadata as well as full name without overwriting an existing profile. Keep the profile self-update policy constrained to the caller's row and preserve role protection. Surface client update failures where applicable.

### MEDIUM — Wishlist table is unused by the application

**Exists:** `wishlists` and local own-row policy design exist; `script.js` uses only localStorage for wishlist state.  
**Problem:** No database persistence or account merge exists.  
**Impact:** Wishlists are lost across browsers/devices and are not tied to account lifecycle.  
**Correction:** Sync the existing table for authenticated users, keep local guest state, merge on login, and clear/account-scope state on sign-out. No new table is needed.

### MEDIUM — Guest repair tracking has no usable ownership path

**Exists:** The app permits guest submissions (`user_id=null`) but tracking requires an authenticated user and filters by that user's ID.  
**Problem:** A guest's request cannot be retrieved by the current tracking form after submission. Admin repair management is also local-only.  
**Impact:** Guests cannot self-serve request status; operations staff may not see the live request in the website admin.  
**Correction:** First connect the admin repair queue. For guest tracking, use a high-entropy, separate tracking token with narrowly scoped lookup or require account sign-in before submission; do not expose repair records by sequential ticket number alone.

### LOW — Customer order history is capped

**Exists:** The account fetch requests at most 25 orders.  
**Impact:** Older orders do not appear in the account history.  
**Correction:** Add pagination or an explicit recent/history split when needed; preserve RLS ownership filtering.

## 5. Functional Requirement Summary

| Requirement | Assessment |
|---|---|
| Catalog/category management | Schema supports it; zero live rows and missing admin category creation/seed currently block useful inventory |
| Manufacturer → series → model → storage → valid colors | Supported by live FK metadata and application mapping/validation |
| Inventory and stock | Variant schema and Supabase admin UI exist; empty catalog blocks use |
| Pricing/discounts | Generated DB prices and server-side RPC pricing design; do not trust browser totals |
| Product images | Metadata and public bucket exist; verify full live Storage policies |
| Registration/login/session | Supabase Auth flow and session restore exist |
| Profile/phone | Profile exists; email-confirmed signup can omit phone as described |
| Admin auth/roles | Supabase inventory checks profile role; live role-escalation trigger exists; full policy matrix still required |
| Inventory create/edit/stock | Implemented in Supabase inventory UI; requires seeded category/master catalog |
| Cart persistence | Local guest cart plus authenticated database cart |
| Wishlist persistence | Local only; database table unused |
| Bank-transfer checkout | Implemented; database check and pending state support it |
| Orders/order items | Tables and server RPC exist; empty inventory prevents live use |
| Payment/order status | Database fields exist; no live admin operations UI |
| Repair requests | Live submission/customer reads exist; guest tracking and admin management are incomplete |
| Customer order history | Supported for signed-in users, limited to 25 most recent |

## 6. Ordered Implementation Plan (Not Applied)

### Phase 0 — Establish a safe baseline

1. Verify the MCP/database project identity from a response that explicitly includes the project reference; the local config alone does not establish remote identity.
2. Obtain a full, reviewed live schema diff: relations/views, column metadata, constraints, indexes, RLS enabled/forced flags, complete policies, table/schema/function ACLs, triggers, storage policies, and migration history. Use catalog-only SELECTs and do not read user rows.
3. Export/backup the current schema and ACL/policy state. Reconcile the empty MCP migration list with deployment records and the two local migration files. Do not replay `20260930000000_initial_schema.sql` or `20261001220000_production_foundation.sql`.

### Phase 1 — Reduce API grants (security-sensitive, compatibility-affecting)

**Proposed migration:** `supabase/migrations/20261104090000_harden_api_role_grants.sql`  
**Intended changes:** Remove blanket grants from `anon`/`authenticated`; explicitly grant only the needed operations per table/role. Remove at least `TRUNCATE`, `MAINTAIN`, `REFERENCES`, and `TRIGGER` where not required. Preserve anon public catalog SELECT and the intentionally supported guest `repair_requests` INSERT. Preserve authenticated own-cart/wishlist operations, profile self-read/update, order/repair self-read, and admin inventory/order/repair writes as required. Keep RLS policies as the row-ownership boundary; do not broaden them to compensate for grants.

**Dependency:** Complete live policy/grant review and Phase 0 baseline.  
**Verification:** Test anonymous catalog reads and guest repair insert; customer A/B isolation for profile/cart/wishlist/orders/repairs; customer attempts to change prices, stock, role, order ownership/status; admin inventory/order/repair operations. Confirm `anon` has no non-RLS destructive privileges.  
**Rollback:** Use a reviewed compensating migration restoring only the exact captured prior grants needed for service continuity. Do not use blanket `GRANT ALL` as a rollback.

### Phase 2 — Persist signup phone metadata

**Proposed migration:** `supabase/migrations/20261104100000_capture_signup_phone.sql`  
**Intended changes:** Replace `public.handle_new_user()` to insert `full_name` and `phone` from `auth.users.raw_user_meta_data`, retaining `SECURITY DEFINER`, a fixed safe `search_path`, explicit object qualification, and conflict behavior that does not overwrite existing profiles. No bulk backfill of customer records is proposed.

**Dependency:** Phase 0 confirms function owner/ACL and trigger binding.  
**Verification:** Test signup with immediate session and email confirmation; verify the profile trigger records phone without exposing Auth metadata; verify profile updates cannot change `role`.  
**Rollback:** Restore the captured prior function definition through a new compensating migration; do not drop the trigger or profiles.

### Phase 3 — Seed reference data (additive data change)

**Proposed migration:** `supabase/migrations/20261104110000_seed_missing_categories.sql`  
**Intended changes:** Idempotently insert the existing ten category definitions from `20261001220000_production_foundation.sql` using conflict handling; do not update or delete existing categories.

**Then use:** Existing generated `supabase/seed/master-catalog-seed.sql` to upsert manufacturer/series/model/storage/color reference data after verifying generator output and target identity. Seed only actual, reviewed inventory records afterward through the admin flow; do not promote preview fixtures to live products.

**Dependency:** Phase 0 migration reconciliation and Phase 1 grant compatibility.  
**Verification:** Read back category/master-data counts and relationship joins without returning customer data; confirm the storefront reports live catalog state and inventory form selectors populate.  
**Rollback:** These are additive seeds. Do not delete rows automatically because future products may reference them; any cleanup requires FK/reference review and an approved data plan.

### Phase 4 — Persist wishlist using existing schema (application-only)

**Files:** `script.js` and focused tests, reusing `public.wishlists`.  
**Intended changes:** Load/save a signed-in user's wishlist, preserve guest local state, merge safely on login, handle duplicate constraints, and prevent one account's items from appearing after account switching. No database table is needed.

**Dependency:** Phase 0 confirms live wishlist policies; Phase 1 grants.  
**Verification:** Guest, sign-in merge, sign-out, two-user isolation, product removal, and network error tests.

### Phase 5 — Connect live order/payment and repair operations

**Files:** extend `src/admin-inventory.js` and the `#admin/*` routing in `script.js`, reusing the existing admin Auth/profile gate and existing `orders`, `order_items`, and `repair_requests` tables.  
**Intended changes:** Add live order list/detail and admin-only order/payment status actions; add live repair queue/detail with status, cost, contacted, and communication-note handling. Keep customer PII limited to authorized admin views. Add a guest tracking design only after choosing account-required submission or a high-entropy tracking token; never expose records by ticket number alone. No new tables are planned unless a reviewed requirement demands one.

**Dependency:** Phases 0 and 1; confirm status-transition rules with business owner before release.  
**Verification:** Customer cannot update order/payment state; admin can process a bank-transfer order and repair; customers see only their own history; guest repair lookup cannot enumerate another customer's record.

### Phase 6 — Release checks

1. Run `npm test`, add focused tests for the new wishlist and admin data adapters, and run `npm run build` only in a controlled environment where generated output changes are reviewed.
2. In staging, test anon/customer/admin role behavior, concurrent order attempts against low stock, forged client totals, invalid variants/colors, cart cleanup, email-confirmed signup, and image upload/read/delete boundaries.
3. Confirm real category/catalog/product/price/stock/image data, delivery rates, transfer instructions, order/payment state procedures, repair staffing, backup/restore, and monitoring with the business owner.
4. Re-run the metadata audit and confirm migration ledger, grants, RLS policies, forced-RLS status, indexes, triggers, RPC ACLs/search paths, and Storage policies before production.

### Destructive or potentially breaking work to avoid

Do not replay the initial schema migration, drop/recreate tables, delete or rewrite existing catalog records, bulk-change order/payment/repair records, loosen RLS, or change auth/storage settings as part of this plan. Grant tightening can break clients if the allowlist is incomplete, so stage it with a captured ACL baseline and role-based tests. No destructive migration is proposed.

## 7. Verification and Launch Readiness

- [x] Confirmed configured Supabase project reference in local MCP config; independent remote project identity remains unverified.
- [x] Confirmed MCP database response and read-only table/function/trigger/grant/storage metadata calls.
- [x] Inspected public table/column/FK metadata and extension/migration tool outputs without selecting customer rows.
- [x] Inspected local Supabase config/auth/catalog/inventory code, migrations, seed generator, verification SQL, package scripts, and tests.
- [x] Ran `npm test`: 25 passed, 0 failed.
- [ ] Obtain complete live policy, index, constraints, views, RLS forced-state, Storage policy, and ACL results; withheld/truncated areas remain unverified.
- [ ] Reconcile the live migration ledger before any deployment.
- [ ] Verify project identity from live response/approved project metadata.
- [ ] Seed real reference and inventory data after approved baseline.
- [ ] Test customer/admin role isolation and order/repair workflows in staging.
- [ ] Confirm backup/restore and operational payment/repair procedures before launch.

**Audit outcome:** The repository contains a substantial Supabase-backed foundation, and the live database responds with matching Arcadia schema objects. However, live inventory is empty, the remote migration ledger is unresolved, public API role grants are broader than required, and live order/repair administration and wishlist persistence are incomplete. Complete the live authorization review and staged implementation plan above before treating the website as production-ready.

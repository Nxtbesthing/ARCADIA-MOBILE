# Arcadia Mobile: Independent Pre-Deployment Review

**Review date:** 2026-11-03  
**Scope:** Read-only review of `final-implementation-plan.md`, all migration files currently in `supabase/migrations`, the existing schema and order-function migrations, and the website's Supabase/auth/catalog/cart/checkout/admin integration code. No SQL was executed, no Supabase state was accessed or changed, and no customer data or secrets were read. No code or migration was modified; this report is the requested deliverable.

## Executive assessment

**Do not deploy the migration set or describe the site as launch-ready yet.** The repair RPC and admin queue RPC have appropriately constrained inputs/authorization in their current drafts, and their `SECURITY DEFINER` settings are fixed with explicit execute grants. The repair integrity issue is **MEDIUM** based on available evidence, not HIGH: it permits forged workflow values on a newly submitted repair but does not itself grant staff access, alter an existing request, or expose records.

There are, however, deployment blockers:

1. The browser Supabase configuration accepts any non-empty key, including a service-role key if one is mistakenly supplied as `VITE_SUPABASE_ANON_KEY`.
2. The grant migrations are not compatible with the current frontend unless the planned RPC wiring is implemented and deployed first. The current website still performs direct repair and inventory writes.
3. Migration provenance is unresolved, and the grant rollback depends on an ACL snapshot not included in the repository. Do not execute migrations until those baselines and an ordered rollout/rollback procedure are reviewed.

## Findings

### Finding 1 — Frontend configuration does not reject privileged Supabase keys

**Severity: HIGH deployment-security risk, conditional; no privileged key exposure was confirmed.**

- [`src/supabase-config.js:1-15`](../../src/supabase-config.js) treats any non-empty key as configured. It validates the URL but does not validate the key type or JWT role.
- [`src/supabase.js:4-10`](../../src/supabase.js) passes `VITE_SUPABASE_ANON_KEY` directly to `createClient`. Vite exposes `VITE_*` values in browser assets.
- [`tests/supabase-config.test.js`](../../tests/supabase-config.test.js) currently accepts placeholder keys and has no privileged-key rejection case.
- The plan's recommendation in Section 6 to reject service-role/secret formats and scan built assets is not implemented in the reviewed source.

If a deployment mistakenly supplies a service-role/secret key in that variable, the key would be shipped to visitors and could bypass RLS. No environment file or key value was read, so this is a configuration vulnerability, not evidence that a privileged key is currently deployed. Reject known secret formats and JWTs with `role: service_role`, add tests, and scan the production bundle before release.

### Finding 2 — Grant narrowing breaks existing repair and inventory writes until frontend RPC wiring ships

**Severity: MEDIUM functional/deployment blocker; confidence high.**

- [`20261103110000_narrow_api_table_privileges.sql:45-55`](../migrations/20261103110000_narrow_api_table_privileges.sql) revokes anonymous `SELECT` on `repair_requests` and re-grants only `INSERT`.
- [`script.js:1904`](../../script.js) still performs `.from("repair_requests").insert(payload).select("ticket_number,status,created_at").single()`. Guest submissions require a read-after-insert response; the live guest policy has no SELECT path. This operation is incompatible with that grant migration. The planned `submit_repair_request` RPC is not called by current frontend code.
- [`20261103160000_least_privilege_api_grants.sql:7-35`](../migrations/20261103160000_least_privilege_api_grants.sql) removes API-role table privileges before re-granting catalog reads; it does not restore direct repair INSERT or product/variant writes.
- [`src/admin-inventory.js:534-555`](../../src/admin-inventory.js) still directly updates/inserts `products` and `product_variants`. It does not call `admin_save_inventory_item`. Applying the final allowlist would therefore break inventory create/edit until the UI is migrated to that RPC.
- Product image metadata writes remain granted at [`20261103160000_least_privilege_api_grants.sql:66-67`](../migrations/20261103160000_least_privilege_api_grants.sql); the current image workflow's database writes are not removed by that grant statement.

Deploy and verify the RPC-based frontend before the grant changes that depend on it. Test anonymous and authenticated repair submission plus admin inventory create/update against the final grants. This is not a reason to retain broad grants permanently; it is a rollout-order requirement.

### Finding 3 — Migration timestamps do not implement the required compatibility sequence

**Severity: MEDIUM deployment blocker; confidence high.**

- [`20261103110000_narrow_api_table_privileges.sql`](../migrations/20261103110000_narrow_api_table_privileges.sql) sorts before [`20261103150000_secure_repair_request_submission.sql`](../migrations/20261103150000_secure_repair_request_submission.sql), [`20261103155000_admin_repair_queue_rpc.sql`](../migrations/20261103155000_admin_repair_queue_rpc.sql), and [`20261103160000_least_privilege_api_grants.sql`](../migrations/20261103160000_least_privilege_api_grants.sql).
- The plan's Section 4 warns not to run the pending directory as-is, but a normal timestamp-ordered migration run would apply the earlier partial grant migration before the new RPCs and the frontend changes exist.
- The repair policy guard in [`20261103100000_restrict_repair_request_submission_fields.sql:7-25`](../migrations/20261103100000_restrict_repair_request_submission_fields.sql) is an important dependency: [`20261103150000_secure_repair_request_submission.sql:50-73`](../migrations/20261103150000_secure_repair_request_submission.sql) does not itself revoke direct table INSERT. If the RPC migration is applied without the policy guard or final INSERT revocation, direct table inserts remain available under existing grants.

The security posture depends on the guard being active while direct INSERT remains and on deploying the RPC-using frontend before the final grant revocation. Record this as an explicit deployment sequence, not merely an order in a plan table. Do not use the empty remote migration list as evidence that the earlier local migrations are safe to replay.

### Finding 4 — Grant rollback is a prerequisite, not a prepared rollback

**Severity: MEDIUM deployment-safety blocker; confidence high.**

- [`20261103160000_least_privilege_api_grants.sql:7-67`](../migrations/20261103160000_least_privilege_api_grants.sql) revokes existing API-role privileges and installs a different allowlist.
- [`final-implementation-plan.md`, Sections 4 and 8](./final-implementation-plan.md) says rollback must restore a captured ACL baseline, and also records that the migration ledger is empty/unresolved.
- No effective ACL snapshot or compensating rollback SQL is included in the reviewed artifacts. The initial repair policy rollback would also restore the known integrity gap.

This is appropriately described as a deployment gate, but it is not an executable rollback yet. Capture and review the exact schema/ACL/policy baseline and prepare a compensating plan before applying grant or repair-policy changes. Never use blanket grants as rollback.

### Finding 5 — Public repair submission has no abuse/rate control in the new RPC

**Severity: LOW-to-MEDIUM operational abuse risk; confidence medium.**

- [`20261103150000_secure_repair_request_submission.sql:13-21, 37-48, 80-85`](../migrations/20261103150000_secure_repair_request_submission.sql) grants `EXECUTE` to `anon` and `authenticated` and validates field format/length, but has no rate limit, challenge, or abuse-control mechanism.
- Guest submission is an intentional feature, so this is not a reason to deny legitimate requests. However, the exposed RPC can be called repeatedly with syntactically valid synthetic requests.

Before launch, decide whether the existing public form has an edge/API rate limit or bot challenge; otherwise include abuse monitoring and a tested rate-control design. Do not add a weak client-only limit.

## Review checklist

### Repair RPC integrity

The proposed `submit_repair_request` accepts only customer/device/problem fields (`20261103150000_secure_repair_request_submission.sql:13-21`). Its INSERT names only customer-owned columns and derives `user_id` from `auth.uid()` (`:50-70`); the database supplies `ticket_number`, `status`, `contacted`, `repair_cost`, and `communication_notes`. The function returns only ticket, status, and creation time (`:23-26, 72-76`). Thus **the RPC path prevents callers from choosing staff-managed values**.

This conclusion assumes the RPC is used and the deployment applies the repair safe-value policy before leaving direct INSERT grants active, then removes direct API-role INSERT in the final allowlist. The RPC migration alone does not close direct table writes. The frontend has not yet been switched to the RPC.

### Admin repair queue

`admin_list_repair_requests` is `SECURITY DEFINER` (`20261103155000_admin_repair_queue_rpc.sql:13`), denies null/non-admin identities using `auth.uid()` and `public.is_admin()` (`:17-19`), bounds pagination (`:21-25`), and revokes execute from `PUBLIC`, `anon`, and `authenticated` before granting it only to `authenticated` (`:36-39`). `public.is_admin()` checks the caller's profile role in the original migration [`20260930000000_initial_schema.sql:234-247`](../migrations/20260930000000_initial_schema.sql). The check is adequate in the reviewed design; test anonymous, customer, and admin tokens in staging.

The function returns full repair rows (`:11, 27-32`), including customer contact details and internal notes. This is appropriate only for the verified admin role; keep that function behind the explicit check and do not expose the result to ordinary customer UI.

### SECURITY DEFINER path and EXECUTE review

- New repair submission and admin queue functions use fixed paths with `pg_catalog` first and `pg_temp` last, schema-qualify application tables, revoke default execute, and grant only intended API roles (`20261103150000_secure_repair_request_submission.sql:28-30, 50-60, 80-85`; `20261103155000_admin_repair_queue_rpc.sql:12-14, 27-39`).
- The inventory RPC uses a fixed path and explicit admin guard, revokes default execute, and grants authenticated execution (`20261103130000_admin_save_inventory_item.sql:26-36, 147-155`).
- The existing order RPC has a fixed `public, pg_temp` path and revokes `PUBLIC`/anon execution before granting authenticated execution (`20261001220000_production_foundation.sql:79-95, 285-286`). Its database-derived prices/stock and transaction locks are preserved by the new grants.
- The phone migration replaces the existing definer trigger function with a fixed path and qualified profile table (`20261103120000_capture_signup_phone_metadata.sql:7-26`) but does not change its pre-existing EXECUTE ACL. The original migration creates the definer trigger functions without explicit EXECUTE revokes (`20260930000000_initial_schema.sql:234-290`). Their trigger return type prevents ordinary PostgREST RPC invocation, so this is not a demonstrated exploit; explicitly restricting trigger-only routine execution is still a least-privilege cleanup worth considering.
- `is_admin()` is callable by API roles in the original design and returns only a boolean; it is used by existing RLS policies and does not by itself return another user's data.

No unsafe unqualified table access or caller-controlled search path was found in the new RPCs.

### RLS and grants together

- The repair policies in [`20261103100000_restrict_repair_request_submission_fields.sql:7-25`](../migrations/20261103100000_restrict_repair_request_submission_fields.sql) retain owner checks and require safe initial staff fields. The existing admin `FOR ALL` repair policy remains separate in [`20260930000000_initial_schema.sql:358`](../migrations/20260930000000_initial_schema.sql).
- The final grant migration's customer repair reads omit customer phone/name/email and staff-only cost/contact/notes (`20261103160000_least_privilege_api_grants.sql:51-64`); RLS still filters rows by `user_id`. Staff reads use the guarded queue RPC.
- Profile `SELECT`/`UPDATE` grants expose only the fields needed by account flows and do not grant role updates (`:42-45`); existing self-row RLS and role-protection trigger remain in effect.
- Cart/wishlist grants are CRUD for authenticated users only (`:37-40`) and rely on existing owner-row RLS.
- Orders and order items remain readable to authenticated users under owner/admin RLS. Order status/payment updates are column-limited and still subject to the existing admin-only RLS policy (`:47-49`; original schema `:356, 365-372`). The order RPC has its own authenticated execute grant.
- Catalog table SELECT grants preserve public reads (`:25-35`). Product image metadata writes remain available to authenticated admins by RLS, and the existing public image bucket/storage policy is unchanged.

The grant/RLS design is consistent for the covered operations, subject to the exact live ACL/policy baseline and the frontend dependencies above. The grant migration revokes from `anon` and `authenticated`, not `PUBLIC`; confirm the captured effective ACL has no inherited `PUBLIC` grants before treating this as a complete allowlist.

### Conflicts, feature preservation, and rollback

- The original schema migration [`20260930000000_initial_schema.sql`](../migrations/20260930000000_initial_schema.sql) creates the tables/types/policies/functions directly and is not safely rerunnable. The production foundation migration [`20261001220000_production_foundation.sql`](../migrations/20261001220000_production_foundation.sql) has an `ALTER POLICY` dependency and duplicates the category seed intent. The plan correctly says not to replay either.
- The category draft [`20261103140000_seed_arcadia_categories.sql:7-20`](../migrations/20261103140000_seed_arcadia_categories.sql) is additive and uses `ON CONFLICT DO NOTHING`; it does not create duplicate categories but silently leaves any existing conflicting category untouched.
- The repair policy migration and final privilege migration overlap as defense-in-depth, not as duplicate schema. The RPC migrations create new routines; no duplicate table is proposed. Exact schema reconciliation remains necessary because the migration ledger is empty.
- Authentication, profile reads/updates, catalog retrieval, checkout/order history, carts/wishlists, and product image handling have matching grants/RLS in the final allowlist. Bank transfer and server-side order pricing/stock remain in the existing order RPC. The storefront's preview-only checkout guard is unchanged.
- The active admin inventory UI still writes directly to `products`/`product_variants`; it will break after the final grant migration until changed to the atomic inventory RPC. Live order/payment administration, live repair administration, and database-backed wishlist synchronization are planned work, not present functionality.
- The category migration is not automatically reversible without checking product references. The repair policy rollback deliberately reopens the flaw. The grant migration rollback requires an exact saved baseline. These considerations are noted in the plan, but no executable rollback artifacts are present.

## Repair severity determination

**MEDIUM is justified on the reviewed evidence.** A customer or guest can forge the initial status/contact/cost/notes on a request they are creating. That can mislead staff or make the customer-facing status inaccurate. The policy does not let the caller update another user's request, read another user's repair, become an administrator, or alter orders/payment state. No evidence shows these fields trigger automatic payment or privileged actions. A HIGH classification would require evidence of a downstream consequence such as unauthorized financial action, broad operational disruption, or access to sensitive records.

## Validation and release blockers

- `npm test`: **passed, 25/25**.
- `npm run build`: **succeeded**.
- Tests/build do not validate SQL syntax, PostgREST return behavior, RLS/grant interactions, function owners, or RPC integration. No SQL or live integration test was run, per instruction.
- Before deployment, resolve the privileged-key configuration guard, implement and test the planned frontend RPC calls, confirm effective grants including `PUBLIC`/default privileges, reconcile the empty migration ledger, and prepare a tested staging rollback/rollout sequence.

**Conclusion:** The new repair and admin RPC designs are sound in isolation, but the complete implementation package is not deployable as-is. Preserve all drafts as unapplied until the listed blockers are resolved and deployment is explicitly approved.

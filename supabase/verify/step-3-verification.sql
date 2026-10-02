-- Run this file in the Supabase SQL editor after applying the migration.
-- It is read-only and does not insert, update, or delete application data.

-- Tables and RLS state.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'manufacturers', 'manufacturer_series', 'manufacturer_models',
    'model_storage_options', 'model_storage_colors', 'categories',
    'profiles', 'products', 'product_variants', 'product_images',
    'carts', 'wishlists', 'orders', 'order_items', 'repair_requests'
  )
order by c.relname;

-- Foreign keys, unique constraints, and indexes.
select conrelid::regclass as table_name, conname, contype
from pg_constraint
where connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- Policies, including customer ownership and admin policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Required functions and auth profile trigger.
select routine_schema, routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'set_updated_at', 'is_admin', 'handle_new_user',
    'prevent_profile_role_escalation', 'validate_customer_order'
  )
order by routine_name;

select event_object_schema, event_object_table, trigger_name
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;

select trigger_schema, event_object_table, trigger_name
from information_schema.triggers
where trigger_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';

-- Public read smoke checks. These should return zero rows until seed data is imported.
select id, name, slug from public.categories where active = true limit 5;
select id, name, active from public.products where active = true limit 5;

-- Manual authenticated-user isolation checks:
-- 1. Sign in as customer A and confirm carts, wishlists, orders, and repairs only
--    return rows whose user_id equals auth.uid().
-- 2. Sign in as customer B and query the same tables; A's rows must not appear.
-- 3. As a non-admin, attempt to insert/update products or set profiles.role = 'admin';
--    both operations must be rejected or the role change must be prevented.
-- 4. As an admin, verify catalog, inventory, order, and repair management succeeds.

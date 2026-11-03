-- Arcadia Mobile Step 4B: live PostgreSQL metadata inspection.
-- Run in the authenticated Supabase Dashboard SQL Editor.
-- This file contains SELECT statements only. It does not read application rows,
-- invoke business functions, or return function bodies or secret values.

-- 1. Public tables and views, including partition information.
select
  n.nspname as schema_name,
  c.relname as relation_name,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    when 'f' then 'foreign table'
    else c.relkind::text
  end as relation_type,
  c.relpersistence as persistence,
  c.relispartition as is_partition,
  parents.parent_relations
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join lateral (
  select string_agg(parent.relname, ', ' order by parent.relname) as parent_relations
  from pg_inherits inheritance
  join pg_class parent on parent.oid = inheritance.inhparent
  where inheritance.inhrelid = c.oid
) parents on true
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by relation_type, relation_name;

-- 2. Exact public column names, types, nullability, defaults, and generation.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  format_type(column_attribute.atttypid, column_attribute.atttypmod) as exact_data_type,
  udt_schema,
  udt_name,
  is_nullable,
  column_default,
  is_identity,
  identity_generation,
  is_generated,
  generation_expression
from information_schema.columns columns
join pg_namespace namespace on namespace.nspname = columns.table_schema
join pg_class relation on relation.relnamespace = namespace.oid
  and relation.relname = columns.table_name
join pg_attribute column_attribute on column_attribute.attrelid = relation.oid
  and column_attribute.attname = columns.column_name
  and column_attribute.attnum > 0
  and not column_attribute.attisdropped
where columns.table_schema = 'public'
order by table_name, ordinal_position;

-- 3. Primary keys, foreign keys, unique constraints, checks, and exclusions.
select
  constraint_ns.nspname as constraint_schema,
  relation.relname as table_name,
  constraint_row.conname as constraint_name,
  case constraint_row.contype
    when 'p' then 'primary key'
    when 'f' then 'foreign key'
    when 'u' then 'unique'
    when 'c' then 'check'
    when 'x' then 'exclusion'
    else constraint_row.contype::text
  end as constraint_type,
  array(
    select attribute.attname
    from unnest(constraint_row.conkey) with ordinality key_column(attnum, position)
    join pg_attribute attribute on attribute.attrelid = constraint_row.conrelid
      and attribute.attnum = key_column.attnum
    order by key_column.position
  ) as local_columns,
  referenced_ns.nspname as referenced_schema,
  referenced_relation.relname as referenced_table,
  array(
    select attribute.attname
    from unnest(constraint_row.confkey) with ordinality key_column(attnum, position)
    join pg_attribute attribute on attribute.attrelid = constraint_row.confrelid
      and attribute.attnum = key_column.attnum
    order by key_column.position
  ) as referenced_columns,
  pg_get_constraintdef(constraint_row.oid, true) as constraint_definition,
  constraint_row.condeferrable as is_deferrable,
  constraint_row.condeferred as initially_deferred,
  constraint_row.convalidated as is_validated
from pg_constraint constraint_row
join pg_class relation on relation.oid = constraint_row.conrelid
join pg_namespace constraint_ns on constraint_ns.oid = relation.relnamespace
left join pg_class referenced_relation on referenced_relation.oid = constraint_row.confrelid
left join pg_namespace referenced_ns on referenced_ns.oid = referenced_relation.relnamespace
where constraint_ns.nspname = 'public'
order by table_name, constraint_type, constraint_name;

-- 4. Index definitions and validity for public relations.
select
  namespace.nspname as schema_name,
  relation.relname as table_name,
  index_relation.relname as index_name,
  index_row.indisprimary as is_primary,
  index_row.indisunique as is_unique,
  index_row.indisexclusion as is_exclusion,
  index_row.indisvalid as is_valid,
  index_row.indisready as is_ready,
  index_row.indislive as is_live,
  pg_get_indexdef(index_row.indexrelid) as index_definition
from pg_index index_row
join pg_class relation on relation.oid = index_row.indrelid
join pg_namespace namespace on namespace.oid = relation.relnamespace
join pg_class index_relation on index_relation.oid = index_row.indexrelid
where namespace.nspname = 'public'
order by table_name, index_name;

-- 5. RLS enablement and forced-RLS status on application and storage relations.
select
  namespace.nspname as schema_name,
  relation.relname as relation_name,
  relation.relrowsecurity as rls_enabled,
  relation.relforcerowsecurity as rls_forced,
  case relation.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    else relation.relkind::text
  end as relation_type
from pg_class relation
join pg_namespace namespace on namespace.oid = relation.relnamespace
where relation.relkind in ('r', 'p')
  and namespace.nspname not in ('pg_catalog', 'information_schema')
  and namespace.nspname not like 'pg_toast%'
order by schema_name, relation_name;

-- 6. All non-system row-level security policies, including storage policies.
select
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname not in ('pg_catalog', 'information_schema')
  and schemaname not like 'pg_toast%'
order by schema_name, table_name, policy_name;

-- 7. Grants on user schemas.
select
  namespace.nspname as schema_name,
  case when grant_row.grantee = 0 then 'PUBLIC'
    else pg_get_userbyid(grant_row.grantee)
  end as grantee,
  grant_row.privilege_type,
  grant_row.is_grantable,
  pg_get_userbyid(grant_row.grantor) as grantor
from pg_namespace namespace
cross join lateral aclexplode(
  coalesce(namespace.nspacl, acldefault('n', namespace.nspowner))
) grant_row
where namespace.nspname not in ('pg_catalog', 'information_schema')
  and namespace.nspname not like 'pg_toast%'
order by schema_name, grantee, privilege_type;

-- 8. Grants on public, storage, and auth tables/views; no rows are read.
select
  namespace.nspname as schema_name,
  relation.relname as relation_name,
  case relation.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    when 'f' then 'foreign table'
    else relation.relkind::text
  end as relation_type,
  case when grant_row.grantee = 0 then 'PUBLIC'
    else pg_get_userbyid(grant_row.grantee)
  end as grantee,
  grant_row.privilege_type,
  grant_row.is_grantable,
  pg_get_userbyid(grant_row.grantor) as grantor
from pg_class relation
join pg_namespace namespace on namespace.oid = relation.relnamespace
cross join lateral aclexplode(
  coalesce(relation.relacl, acldefault('r', relation.relowner))
) grant_row
where namespace.nspname in ('public', 'storage', 'auth')
  and relation.relkind in ('r', 'p', 'v', 'm', 'f')
order by schema_name, relation_name, grantee, privilege_type;

-- 9. Non-internal triggers and their associated function metadata.
select
  namespace.nspname as schema_name,
  relation.relname as table_name,
  trigger_row.tgname as trigger_name,
  case
    when trigger_row.tgtype & 64 <> 0 then 'INSTEAD OF'
    when trigger_row.tgtype & 2 <> 0 then 'BEFORE'
    else 'AFTER'
  end as timing,
  trigger_row.tgtype & 1 <> 0 as fires_per_row,
  array_remove(array[
    case when trigger_row.tgtype & 4 <> 0 then 'INSERT' end,
    case when trigger_row.tgtype & 8 <> 0 then 'DELETE' end,
    case when trigger_row.tgtype & 16 <> 0 then 'UPDATE' end,
    case when trigger_row.tgtype & 32 <> 0 then 'TRUNCATE' end
  ], null) as events,
  case trigger_row.tgenabled
    when 'O' then 'origin'
    when 'D' then 'disabled'
    when 'R' then 'replica'
    when 'A' then 'always'
    else trigger_row.tgenabled::text
  end as enabled_mode,
  function_ns.nspname as function_schema,
  function_row.proname as function_name,
  pg_get_function_identity_arguments(function_row.oid) as function_arguments,
  function_row.prosecdef as function_is_security_definer
from pg_trigger trigger_row
join pg_class relation on relation.oid = trigger_row.tgrelid
join pg_namespace namespace on namespace.oid = relation.relnamespace
join pg_proc function_row on function_row.oid = trigger_row.tgfoid
join pg_namespace function_ns on function_ns.oid = function_row.pronamespace
where not trigger_row.tgisinternal
  and namespace.nspname not in ('pg_catalog', 'information_schema')
  and namespace.nspname not like 'pg_toast%'
order by schema_name, table_name, trigger_name;

-- 10. Public database functions and procedures, without emitting routine bodies.
select
  namespace.nspname as routine_schema,
  function_row.proname as routine_name,
  case function_row.prokind
    when 'f' then 'function'
    when 'p' then 'procedure'
    when 'a' then 'aggregate'
    when 'w' then 'window function'
    else function_row.prokind::text
  end as routine_kind,
  pg_get_function_identity_arguments(function_row.oid) as arguments,
  pg_get_function_result(function_row.oid) as result_type,
  language.lanname as language,
  function_row.prosecdef as is_security_definer,
  function_row.provolatile as volatility,
  function_row.proleakproof as is_leakproof,
  function_row.proparallel as parallel_safety,
  (
    select split_part(setting, '=', 2)
    from unnest(function_row.proconfig) setting
    where setting like 'search_path=%'
    limit 1
  ) as configured_search_path,
  function_row.proacl is not null as has_explicit_privileges,
  false as routine_body_emitted
from pg_proc function_row
join pg_namespace namespace on namespace.oid = function_row.pronamespace
join pg_language language on language.oid = function_row.prolang
where namespace.nspname = 'public'
order by routine_name, arguments;

-- 11. Execute grants on public functions and procedures.
select
  namespace.nspname as routine_schema,
  function_row.proname as routine_name,
  pg_get_function_identity_arguments(function_row.oid) as arguments,
  case when grant_row.grantee = 0 then 'PUBLIC'
    else pg_get_userbyid(grant_row.grantee)
  end as grantee,
  grant_row.privilege_type,
  grant_row.is_grantable,
  pg_get_userbyid(grant_row.grantor) as grantor
from pg_proc function_row
join pg_namespace namespace on namespace.oid = function_row.pronamespace
cross join lateral aclexplode(
  coalesce(function_row.proacl, acldefault('f', function_row.proowner))
) grant_row
where namespace.nspname = 'public'
order by routine_name, arguments, grantee;

-- 12. Storage bucket configuration metadata only; no storage objects are read.
select
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by name;

-- Storage object policies are included in section 6 above.

-- 13. Public enum types and their ordered labels.
select
  namespace.nspname as type_schema,
  enum_type.typname as enum_name,
  array_agg(enum_label.enumlabel order by enum_label.enumsortorder) as enum_labels
from pg_type enum_type
join pg_namespace namespace on namespace.oid = enum_type.typnamespace
join pg_enum enum_label on enum_label.enumtypid = enum_type.oid
where namespace.nspname = 'public'
group by namespace.nspname, enum_type.typname
order by enum_name;

-- 14. Public sequence definitions and owned columns; sequence values are omitted.
select
  namespace.nspname as sequence_schema,
  sequence_relation.relname as sequence_name,
  pg_get_userbyid(sequence_relation.relowner) as sequence_owner,
  sequence_data.seqtypid::regtype as sequence_data_type,
  sequence_data.seqstart as start_value,
  sequence_data.seqincrement as increment_by,
  sequence_data.seqmin as minimum_value,
  sequence_data.seqmax as maximum_value,
  sequence_data.seqcache as cache_size,
  sequence_data.seqcycle as cycles,
  owned_namespace.nspname as owned_table_schema,
  owned_relation.relname as owned_table,
  owned_column.attname as owned_column
from pg_class sequence_relation
join pg_namespace namespace on namespace.oid = sequence_relation.relnamespace
join pg_sequence sequence_data on sequence_data.seqrelid = sequence_relation.oid
left join pg_depend dependency on dependency.classid = 'pg_class'::regclass
  and dependency.objid = sequence_relation.oid
  and dependency.refclassid = 'pg_class'::regclass
  and dependency.deptype in ('a', 'i')
left join pg_class owned_relation on owned_relation.oid = dependency.refobjid
left join pg_namespace owned_namespace on owned_namespace.oid = owned_relation.relnamespace
left join pg_attribute owned_column on owned_column.attrelid = owned_relation.oid
  and owned_column.attnum = dependency.refobjsubid
where sequence_relation.relkind = 'S'
  and namespace.nspname = 'public'
order by sequence_name;

-- 15. Explicit foreign-key relationship map for the Arcadia customer/catalog domain.
select
  source_ns.nspname as source_schema,
  source_table.relname as source_table,
  constraint_row.conname as foreign_key_name,
  array(
    select attribute.attname
    from unnest(constraint_row.conkey) with ordinality key_column(attnum, position)
    join pg_attribute attribute on attribute.attrelid = constraint_row.conrelid
      and attribute.attnum = key_column.attnum
    order by key_column.position
  ) as source_columns,
  target_ns.nspname as target_schema,
  target_table.relname as target_table,
  array(
    select attribute.attname
    from unnest(constraint_row.confkey) with ordinality key_column(attnum, position)
    join pg_attribute attribute on attribute.attrelid = constraint_row.confrelid
      and attribute.attnum = key_column.attnum
    order by key_column.position
  ) as target_columns,
  pg_get_constraintdef(constraint_row.oid, true) as relationship_definition
from pg_constraint constraint_row
join pg_class source_table on source_table.oid = constraint_row.conrelid
join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
join pg_class target_table on target_table.oid = constraint_row.confrelid
join pg_namespace target_ns on target_ns.oid = target_table.relnamespace
where constraint_row.contype = 'f'
  and source_ns.nspname = 'public'
  and source_table.relname in (
    'manufacturers', 'manufacturer_series', 'manufacturer_models',
    'model_storage_options', 'model_storage_colors', 'profiles',
    'products', 'product_variants', 'product_images', 'carts',
    'wishlists', 'orders', 'order_items', 'repair_requests'
  )
order by source_table, foreign_key_name;

-- 16. Inspection access checklist. This checks metadata permissions only.
select
  inspection_area,
  checked_object,
  case
    when object_oid is null then 'NOT PRESENT'
    when has_table_privilege(current_user, object_oid, 'SELECT') then 'OBJECT SELECT GRANTED'
    else 'ADDITIONAL PERMISSION REQUIRED'
  end as access_status
from (
  values
    ('Storage bucket metadata', 'storage.buckets'),
    ('Storage object policy metadata', 'storage.objects')
) as checks(inspection_area, checked_name)
cross join lateral (
  select to_regclass(checked_name) as object_oid
) resolved
cross join lateral (
  select checked_name as checked_object
) label
order by inspection_area;

-- Checklist for interpreting the result sets:
-- [x] Public tables/views, columns, keys, checks, indexes, RLS, policies, grants,
--     triggers, routine metadata, enums, sequences, and foreign-key relationships
--     are covered by the catalog queries above when they return rows.
-- [x] Customer row data, sequence current values, routine bodies, passwords,
--     tokens, and secret values are intentionally not selected.
-- [ ] Storage bucket metadata requires SELECT access to storage.buckets.
-- [ ] Metadata object SELECT permission only; catalog visibility is not guaranteed.
-- [ ] If any metadata query is denied or incomplete, rerun as an authorized
--     project database administrator in the Supabase Dashboard SQL Editor.
-- [ ] Function behavior is not proven from metadata alone; inspect routine source
--     separately only after confirming that it contains no secret values.
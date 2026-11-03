-- PREPARED ONLY: unapplied Stage C draft; intentionally outside the default migration run path.
-- Apply only after Stage B RPC integration is deployed and verified, the complete
-- effective ACL baseline (including PUBLIC and default privileges) is captured, and
-- the migration provenance has been reconciled. This migration must fail closed if
-- any targeted table has a direct PUBLIC grant that was not reviewed.

BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    CROSS JOIN LATERAL aclexplode(
      COALESCE(relation.relacl, acldefault('r', relation.relowner))
    ) AS privilege
    WHERE namespace.nspname = 'public'
      AND relation.relname = ANY (ARRAY[
        'manufacturers',
        'manufacturer_series',
        'manufacturer_models',
        'model_storage_options',
        'model_storage_colors',
        'categories',
        'profiles',
        'products',
        'product_variants',
        'product_images',
        'carts',
        'wishlists',
        'orders',
        'order_items',
        'repair_requests'
      ])
      AND privilege.grantee = 0
  ) THEN
    RAISE EXCEPTION 'Direct PUBLIC table privileges exist; capture and review the ACL baseline before proceeding.';
  END IF;
END;
$preflight$;

REVOKE ALL PRIVILEGES ON TABLE
  public.manufacturers,
  public.manufacturer_series,
  public.manufacturer_models,
  public.model_storage_options,
  public.model_storage_colors,
  public.categories,
  public.profiles,
  public.products,
  public.product_variants,
  public.product_images,
  public.carts,
  public.wishlists,
  public.orders,
  public.order_items,
  public.repair_requests
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.manufacturers,
  public.manufacturer_series,
  public.manufacturer_models,
  public.model_storage_options,
  public.model_storage_colors,
  public.categories,
  public.products,
  public.product_variants,
  public.product_images
TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.carts,
  public.wishlists
TO authenticated;

GRANT SELECT (id, full_name, phone, role)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, phone)
  ON TABLE public.profiles TO authenticated;

GRANT SELECT ON TABLE public.orders, public.order_items TO authenticated;
GRANT UPDATE (status, payment_status)
  ON TABLE public.orders TO authenticated;

GRANT SELECT (
  id,
  ticket_number,
  device,
  problem,
  description,
  status,
  preferred_date,
  created_at,
  updated_at
)
  ON TABLE public.repair_requests TO authenticated;
GRANT UPDATE (status, contacted, repair_cost, communication_notes)
  ON TABLE public.repair_requests TO authenticated;

GRANT INSERT, UPDATE, DELETE
  ON TABLE public.product_images TO authenticated;

COMMIT;

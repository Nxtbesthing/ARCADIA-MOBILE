-- PREPARED ONLY: unapplied Stage C draft; intentionally outside the default migration run path.
-- Apply only after Stage B RPC integration is deployed and verified, and the complete
-- effective ACL baseline (including PUBLIC and default privileges) is reviewed.
-- This is a partial reduction; Stage C's final allowlist follows as a separate step.

BEGIN;

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE
    public.carts,
    public.categories,
    public.manufacturer_models,
    public.manufacturer_series,
    public.manufacturers,
    public.model_storage_colors,
    public.model_storage_options,
    public.order_items,
    public.orders,
    public.product_images,
    public.product_variants,
    public.products,
    public.profiles,
    public.repair_requests,
    public.wishlists
  FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE
    public.carts,
    public.categories,
    public.manufacturer_models,
    public.manufacturer_series,
    public.manufacturers,
    public.model_storage_colors,
    public.model_storage_options,
    public.order_items,
    public.orders,
    public.product_images,
    public.product_variants,
    public.products,
    public.profiles,
    public.repair_requests,
    public.wishlists
  FROM anon;

REVOKE SELECT
  ON TABLE
    public.carts,
    public.order_items,
    public.orders,
    public.profiles,
    public.repair_requests,
    public.wishlists
  FROM anon;

REVOKE INSERT, UPDATE, DELETE ON TABLE storage.objects FROM anon;

COMMIT;

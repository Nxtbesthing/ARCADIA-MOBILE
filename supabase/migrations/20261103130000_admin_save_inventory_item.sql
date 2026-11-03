-- PREPARED ONLY: unapplied migration draft.
-- Do not apply until project identity, migration provenance, and admin integration tests are approved.
-- Atomically create a product+variant or update an existing product+variant as an admin.

BEGIN;

CREATE FUNCTION public.admin_save_inventory_item(
  p_product_id uuid,
  p_variant_id uuid,
  p_name text,
  p_description text,
  p_category_id uuid,
  p_model_id uuid,
  p_storage_option_id uuid,
  p_color_name text,
  p_sku text,
  p_stock_quantity integer,
  p_availability public.product_availability,
  p_condition text,
  p_original_price numeric,
  p_discount_percentage numeric,
  p_warranty text
)
RETURNS TABLE (saved_product_id uuid, saved_variant_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_product_id uuid;
  v_variant_id uuid;
  v_existing_model_id uuid;
  v_availability public.product_availability;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 200
    OR p_category_id IS NULL
    OR p_model_id IS NULL
    OR p_storage_option_id IS NULL
    OR p_color_name IS NULL OR btrim(p_color_name) = ''
    OR p_sku IS NULL OR btrim(p_sku) = '' OR length(btrim(p_sku)) > 120
    OR p_condition IS NULL OR btrim(p_condition) = '' OR length(btrim(p_condition)) > 80
    OR p_warranty IS NULL OR btrim(p_warranty) = '' OR length(btrim(p_warranty)) > 120
    OR p_stock_quantity IS NULL OR p_stock_quantity < 0
    OR p_original_price IS NULL OR p_original_price < 0
    OR p_discount_percentage IS NULL OR p_discount_percentage < 0 OR p_discount_percentage > 100
  THEN
    RAISE EXCEPTION 'Inventory values are invalid.' USING ERRCODE = '22023';
  END IF;

  IF p_stock_quantity = 0 THEN
    v_availability := 'out_of_stock'::public.product_availability;
  ELSE
    IF p_availability IS NULL OR p_availability NOT IN ('active', 'hidden') THEN
      RAISE EXCEPTION 'Stocked variants must be active or hidden.' USING ERRCODE = '22023';
    END IF;
    v_availability := p_availability;
  END IF;

  IF p_product_id IS NULL THEN
    IF p_variant_id IS NOT NULL THEN
      RAISE EXCEPTION 'A new product cannot reference an existing variant.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.products (manufacturer_model_id, category_id, name, description)
    VALUES (p_model_id, p_category_id, btrim(p_name), p_description)
    RETURNING id INTO v_product_id;

    INSERT INTO public.product_variants (
      product_id,
      manufacturer_model_id,
      model_storage_option_id,
      color_name,
      sku,
      stock_quantity,
      availability,
      condition,
      original_price,
      discount_percentage,
      warranty
    ) VALUES (
      v_product_id,
      p_model_id,
      p_storage_option_id,
      btrim(p_color_name),
      btrim(p_sku),
      p_stock_quantity,
      v_availability,
      btrim(p_condition),
      p_original_price,
      p_discount_percentage,
      btrim(p_warranty)
    )
    RETURNING id INTO v_variant_id;
  ELSE
    IF p_variant_id IS NULL THEN
      RAISE EXCEPTION 'An existing product update requires its variant.' USING ERRCODE = '22023';
    END IF;

    SELECT manufacturer_model_id
    INTO v_existing_model_id
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found.' USING ERRCODE = 'P0002';
    END IF;
    IF v_existing_model_id IS DISTINCT FROM p_model_id THEN
      RAISE EXCEPTION 'The model of an existing product cannot be changed.' USING ERRCODE = '22023';
    END IF;

    UPDATE public.products
    SET name = btrim(p_name),
        description = p_description,
        category_id = p_category_id
    WHERE id = p_product_id;

    UPDATE public.product_variants
    SET model_storage_option_id = p_storage_option_id,
        color_name = btrim(p_color_name),
        sku = btrim(p_sku),
        stock_quantity = p_stock_quantity,
        availability = v_availability,
        condition = btrim(p_condition),
        original_price = p_original_price,
        discount_percentage = p_discount_percentage,
        warranty = btrim(p_warranty)
    WHERE id = p_variant_id
      AND product_id = p_product_id
    RETURNING id INTO v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant does not belong to the selected product.' USING ERRCODE = '22023';
    END IF;

    v_product_id := p_product_id;
  END IF;

  RETURN QUERY SELECT v_product_id, v_variant_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_save_inventory_item(
  uuid, uuid, text, text, uuid, uuid, uuid, text, text, integer,
  public.product_availability, text, numeric, numeric, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_inventory_item(
  uuid, uuid, text, text, uuid, uuid, uuid, text, text, integer,
  public.product_availability, text, numeric, numeric, text
) TO authenticated;

COMMIT;

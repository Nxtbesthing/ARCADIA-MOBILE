BEGIN;

CREATE FUNCTION public.admin_reorder_product_images(
  p_product_id uuid,
  p_variant_id uuid,
  p_ordered_image_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_eligible_image_ids uuid[];
  v_updated_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;

  IF p_product_id IS NULL OR p_variant_id IS NULL
    OR p_ordered_image_ids IS NULL
    OR array_position(p_ordered_image_ids, NULL) IS NOT NULL
    OR cardinality(p_ordered_image_ids) <> (
      SELECT count(DISTINCT image_id)
      FROM unnest(p_ordered_image_ids) AS requested(image_id)
    )
  THEN
    RAISE EXCEPTION 'Image order request is invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product does not exist.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.product_variants
    WHERE id = p_variant_id AND product_id = p_product_id
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'Variant does not belong to the selected product.' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(array_agg(eligible.id ORDER BY eligible.id), ARRAY[]::uuid[])
  INTO v_eligible_image_ids
  FROM (
    SELECT image.id
    FROM public.product_images AS image
    WHERE image.product_id = p_product_id
      AND (image.variant_id IS NULL OR image.variant_id = p_variant_id)
    FOR UPDATE
  ) AS eligible;

  IF cardinality(p_ordered_image_ids) <> cardinality(v_eligible_image_ids)
    OR EXISTS (
      SELECT 1
      FROM unnest(p_ordered_image_ids) AS requested(image_id)
      WHERE NOT (requested.image_id = ANY(v_eligible_image_ids))
    )
  THEN
    RAISE EXCEPTION 'Image order must include every eligible image exactly once.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.product_images AS image
  SET sort_order = (requested.ordinality - 1)::integer
  FROM unnest(p_ordered_image_ids) WITH ORDINALITY AS requested(image_id, ordinality)
  WHERE image.id = requested.image_id
    AND image.product_id = p_product_id
    AND (image.variant_id IS NULL OR image.variant_id = p_variant_id);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> cardinality(p_ordered_image_ids) THEN
    RAISE EXCEPTION 'Not all product images could be reordered.' USING ERRCODE = 'P0001';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_reorder_product_images(uuid, uuid, uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_product_images(uuid, uuid, uuid[])
  TO authenticated;

COMMIT;

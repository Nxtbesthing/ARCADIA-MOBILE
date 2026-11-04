-- Additive recovery of the verified pre-migration administration features.
-- No existing application records are updated or deleted by this migration.

BEGIN;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger
    JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname = 'profiles'
      AND trigger.tgname = 'prevent_profile_role_escalation'
      AND trigger.tgenabled <> 'D'
      AND NOT trigger.tgisinternal
  ) THEN
    RAISE EXCEPTION 'The profile role escalation trigger is missing or disabled; refusing to apply admin recovery.';
  END IF;
END;
$preflight$;

ALTER TABLE public.manufacturer_models
  ADD COLUMN IF NOT EXISTS ram_options text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS ram text,
  ADD COLUMN IF NOT EXISTS face_id text,
  ADD COLUMN IF NOT EXISTS true_tone text,
  ADD COLUMN IF NOT EXISTS display_details text,
  ADD COLUMN IF NOT EXISTS battery_details text,
  ADD COLUMN IF NOT EXISTS camera_details text,
  ADD COLUMN IF NOT EXISTS speaker_details text,
  ADD COLUMN IF NOT EXISTS microphone_details text,
  ADD COLUMN IF NOT EXISTS charging_details text,
  ADD COLUMN IF NOT EXISTS sim_details text,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS public.repair_admin_details (
  repair_id uuid PRIMARY KEY REFERENCES public.repair_requests(id),
  diagnosis text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.repair_admin_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage repair details"
  ON public.repair_admin_details
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.repair_admin_details FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'ARCADIA MOBILE',
  title text NOT NULL,
  message text NOT NULL,
  media_path text,
  media_type text CHECK (media_type IS NULL OR media_type IN ('image', 'video')),
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((media_path IS NULL) = (media_type IS NULL))
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published announcements"
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "admins manage announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.announcements FROM PUBLIC;
GRANT SELECT ON TABLE public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated;

CREATE INDEX IF NOT EXISTS announcements_public_order_idx
  ON public.announcements (sort_order, created_at DESC)
  WHERE published = true;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'announcement-media',
  'announcement-media',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admins manage announcement media"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'announcement-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'announcement-media' AND public.is_admin());

CREATE POLICY "public read published announcement media"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'announcement-media'
    AND EXISTS (
      SELECT 1
      FROM public.announcements
      WHERE announcements.media_path = storage.objects.name
        AND announcements.published = true
    )
  );

CREATE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'products', (SELECT count(*) FROM public.products),
    'active_products', (SELECT count(*) FROM public.products WHERE active),
    'variants', (SELECT count(*) FROM public.product_variants),
    'orders', (SELECT count(*) FROM public.orders),
    'repairs', (SELECT count(*) FROM public.repair_requests),
    'sales', (
      SELECT coalesce(sum(grand_total), 0)
      FROM public.orders
      WHERE payment_status = 'paid'
    ),
    'pending_transfers', (
      SELECT count(*) FROM public.orders
      WHERE payment_method = 'bank_transfer'
        AND payment_status IN ('pending', 'awaiting_confirmation')
    )
  );
END;
$function$;

CREATE FUNCTION public.admin_add_product_variant(
  p_product_id uuid,
  p_storage_option_id uuid,
  p_color_name text,
  p_sku text,
  p_stock_quantity integer,
  p_availability public.product_availability,
  p_condition text,
  p_original_price numeric,
  p_discount_percentage numeric,
  p_warranty text,
  p_battery_health smallint DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_model_id uuid;
  v_availability public.product_availability;
  v_variant_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;

  IF p_product_id IS NULL OR p_storage_option_id IS NULL
    OR p_color_name IS NULL OR btrim(p_color_name) = ''
    OR p_sku IS NULL OR btrim(p_sku) = '' OR length(btrim(p_sku)) > 120
    OR p_stock_quantity IS NULL OR p_stock_quantity < 0
    OR p_condition IS NULL OR btrim(p_condition) = '' OR length(btrim(p_condition)) > 80
    OR p_original_price IS NULL OR p_original_price < 0
    OR p_discount_percentage IS NULL OR p_discount_percentage < 0 OR p_discount_percentage > 100
    OR p_warranty IS NULL OR btrim(p_warranty) = '' OR length(btrim(p_warranty)) > 120
    OR (p_battery_health IS NOT NULL AND (p_battery_health < 0 OR p_battery_health > 100))
  THEN
    RAISE EXCEPTION 'Variant values are invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT manufacturer_model_id INTO v_model_id
  FROM public.products
  WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.model_storage_options
    WHERE id = p_storage_option_id AND model_id = v_model_id
  ) OR NOT EXISTS (
    SELECT 1 FROM public.model_storage_colors
    WHERE storage_option_id = p_storage_option_id
      AND color_name = btrim(p_color_name)
  ) THEN
    RAISE EXCEPTION 'Choose a catalog storage and color for this product model.' USING ERRCODE = '22023';
  END IF;

  IF p_availability IS NULL OR p_availability NOT IN ('active', 'hidden') THEN
    RAISE EXCEPTION 'Variants must be active or hidden.' USING ERRCODE = '22023';
  END IF;
  v_availability := CASE
    WHEN p_availability = 'hidden' THEN 'hidden'::public.product_availability
    WHEN p_stock_quantity = 0 THEN 'out_of_stock'::public.product_availability
    ELSE 'active'::public.product_availability
  END;

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
    warranty,
    battery_health
  )
  VALUES (
    p_product_id,
    v_model_id,
    p_storage_option_id,
    btrim(p_color_name),
    btrim(p_sku),
    p_stock_quantity,
    v_availability,
    btrim(p_condition),
    p_original_price,
    p_discount_percentage,
    btrim(p_warranty),
    p_battery_health
  )
  RETURNING id INTO v_variant_id;

  RETURN v_variant_id;
END;
$function$;

CREATE FUNCTION public.admin_set_product_active(p_product_id uuid, p_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION 'Product and active state are required.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.products SET active = p_active WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.' USING ERRCODE = 'P0002';
  END IF;
  RETURN true;
END;
$function$;

CREATE FUNCTION public.admin_list_repair_diagnoses(p_repair_ids uuid[])
RETURNS TABLE (repair_id uuid, diagnosis text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_repair_ids IS NULL OR cardinality(p_repair_ids) > 100 THEN
    RAISE EXCEPTION 'Repair request page is invalid.' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT details.repair_id, details.diagnosis
  FROM public.repair_admin_details AS details
  WHERE details.repair_id = ANY (p_repair_ids);
END;
$function$;

CREATE FUNCTION public.admin_update_repair_request(
  p_repair_id uuid,
  p_status public.repair_status,
  p_repair_cost numeric,
  p_contacted boolean,
  p_communication_notes text,
  p_diagnosis text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_repair_id IS NULL OR p_status IS NULL
    OR p_contacted IS NULL
    OR (p_repair_cost IS NOT NULL AND p_repair_cost < 0)
    OR length(coalesce(p_communication_notes, '')) > 4000
    OR length(coalesce(p_diagnosis, '')) > 4000
  THEN
    RAISE EXCEPTION 'Repair update values are invalid.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.repair_requests
  SET status = p_status,
      repair_cost = p_repair_cost,
      contacted = p_contacted,
      communication_notes = nullif(btrim(coalesce(p_communication_notes, '')), '')
  WHERE id = p_repair_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repair request not found.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.repair_admin_details(repair_id, diagnosis)
  VALUES (p_repair_id, nullif(btrim(coalesce(p_diagnosis, '')), ''))
  ON CONFLICT (repair_id)
  DO UPDATE SET diagnosis = excluded.diagnosis;
  RETURN true;
END;
$function$;

CREATE FUNCTION public.admin_save_inventory_item_full(
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
  p_warranty text,
  p_battery_health smallint,
  p_ram text,
  p_face_id text,
  p_true_tone text,
  p_display_details text,
  p_battery_details text,
  p_camera_details text,
  p_speaker_details text,
  p_microphone_details text,
  p_charging_details text,
  p_sim_details text,
  p_notes text
)
RETURNS TABLE (saved_product_id uuid, saved_variant_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
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
    OR p_category_id IS NULL OR p_model_id IS NULL OR p_storage_option_id IS NULL
    OR p_color_name IS NULL OR btrim(p_color_name) = ''
    OR p_sku IS NULL OR btrim(p_sku) = '' OR length(btrim(p_sku)) > 120
    OR p_stock_quantity IS NULL OR p_stock_quantity < 0
    OR p_condition IS NULL OR btrim(p_condition) = '' OR length(btrim(p_condition)) > 80
    OR p_original_price IS NULL OR p_original_price < 0
    OR p_discount_percentage IS NULL OR p_discount_percentage < 0 OR p_discount_percentage > 100
    OR p_warranty IS NULL OR btrim(p_warranty) = '' OR length(btrim(p_warranty)) > 120
    OR (p_battery_health IS NOT NULL AND (p_battery_health < 0 OR p_battery_health > 100))
    OR length(coalesce(p_ram, '')) > 80
    OR length(coalesce(p_face_id, '')) > 200
    OR length(coalesce(p_true_tone, '')) > 200
    OR length(coalesce(p_display_details, '')) > 500
    OR length(coalesce(p_battery_details, '')) > 500
    OR length(coalesce(p_camera_details, '')) > 500
    OR length(coalesce(p_speaker_details, '')) > 500
    OR length(coalesce(p_microphone_details, '')) > 500
    OR length(coalesce(p_charging_details, '')) > 500
    OR length(coalesce(p_sim_details, '')) > 500
    OR length(coalesce(p_notes, '')) > 4000
  THEN
    RAISE EXCEPTION 'Inventory values are invalid.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.model_storage_options
    WHERE id = p_storage_option_id AND model_id = p_model_id
  ) OR NOT EXISTS (
    SELECT 1 FROM public.model_storage_colors
    WHERE storage_option_id = p_storage_option_id AND color_name = btrim(p_color_name)
  ) THEN
    RAISE EXCEPTION 'Choose a catalog storage and color for this product model.' USING ERRCODE = '22023';
  END IF;

  IF p_availability IS NULL OR p_availability NOT IN ('active', 'hidden') THEN
    RAISE EXCEPTION 'Variants must be active or hidden.' USING ERRCODE = '22023';
  END IF;
  v_availability := CASE
    WHEN p_availability = 'hidden' THEN 'hidden'::public.product_availability
    WHEN p_stock_quantity = 0 THEN 'out_of_stock'::public.product_availability
    ELSE 'active'::public.product_availability
  END;

  IF p_product_id IS NULL THEN
    IF p_variant_id IS NOT NULL THEN
      RAISE EXCEPTION 'A new product cannot reference an existing variant.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.products (manufacturer_model_id, category_id, name, description)
    VALUES (p_model_id, p_category_id, btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''))
    RETURNING id INTO v_product_id;
  ELSE
    SELECT manufacturer_model_id INTO v_existing_model_id
    FROM public.products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found.' USING ERRCODE = 'P0002';
    END IF;
    IF v_existing_model_id IS DISTINCT FROM p_model_id THEN
      RAISE EXCEPTION 'The model of an existing product cannot be changed.' USING ERRCODE = '22023';
    END IF;
    UPDATE public.products
    SET name = btrim(p_name),
        description = nullif(btrim(coalesce(p_description, '')), ''),
        category_id = p_category_id
    WHERE id = p_product_id;
    v_product_id := p_product_id;
  END IF;

  IF p_variant_id IS NULL THEN
    INSERT INTO public.product_variants (
      product_id, manufacturer_model_id, model_storage_option_id, color_name,
      sku, stock_quantity, availability, condition, original_price,
      discount_percentage, warranty, battery_health, ram, face_id, true_tone,
      display_details, battery_details, camera_details, speaker_details,
      microphone_details, charging_details, sim_details, notes
    )
    VALUES (
      v_product_id, p_model_id, p_storage_option_id, btrim(p_color_name),
      btrim(p_sku), p_stock_quantity, v_availability, btrim(p_condition),
      p_original_price, p_discount_percentage, btrim(p_warranty), p_battery_health,
      nullif(btrim(coalesce(p_ram, '')), ''), nullif(btrim(coalesce(p_face_id, '')), ''),
      nullif(btrim(coalesce(p_true_tone, '')), ''), nullif(btrim(coalesce(p_display_details, '')), ''),
      nullif(btrim(coalesce(p_battery_details, '')), ''), nullif(btrim(coalesce(p_camera_details, '')), ''),
      nullif(btrim(coalesce(p_speaker_details, '')), ''), nullif(btrim(coalesce(p_microphone_details, '')), ''),
      nullif(btrim(coalesce(p_charging_details, '')), ''), nullif(btrim(coalesce(p_sim_details, '')), ''),
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    RETURNING id INTO v_variant_id;
  ELSE
    UPDATE public.product_variants
    SET model_storage_option_id = p_storage_option_id,
        color_name = btrim(p_color_name),
        sku = btrim(p_sku),
        stock_quantity = p_stock_quantity,
        availability = v_availability,
        condition = btrim(p_condition),
        original_price = p_original_price,
        discount_percentage = p_discount_percentage,
        warranty = btrim(p_warranty),
        battery_health = p_battery_health,
        ram = nullif(btrim(coalesce(p_ram, '')), ''),
        face_id = nullif(btrim(coalesce(p_face_id, '')), ''),
        true_tone = nullif(btrim(coalesce(p_true_tone, '')), ''),
        display_details = nullif(btrim(coalesce(p_display_details, '')), ''),
        battery_details = nullif(btrim(coalesce(p_battery_details, '')), ''),
        camera_details = nullif(btrim(coalesce(p_camera_details, '')), ''),
        speaker_details = nullif(btrim(coalesce(p_speaker_details, '')), ''),
        microphone_details = nullif(btrim(coalesce(p_microphone_details, '')), ''),
        charging_details = nullif(btrim(coalesce(p_charging_details, '')), ''),
        sim_details = nullif(btrim(coalesce(p_sim_details, '')), ''),
        notes = nullif(btrim(coalesce(p_notes, '')), '')
    WHERE id = p_variant_id AND product_id = v_product_id
    RETURNING id INTO v_variant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant does not belong to the selected product.' USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN QUERY SELECT v_product_id, v_variant_id;
END;
$function$;

CREATE FUNCTION public.admin_set_product_variant_active(p_variant_id uuid, p_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_variant_id IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION 'Variant and active state are required.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.product_variants
  SET availability = CASE
    WHEN NOT p_active THEN 'hidden'::public.product_availability
    WHEN stock_quantity = 0 THEN 'out_of_stock'::public.product_availability
    ELSE 'active'::public.product_availability
  END
  WHERE id = p_variant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found.' USING ERRCODE = 'P0002';
  END IF;
  RETURN true;
END;
$function$;

CREATE FUNCTION public.admin_manage_catalog_item(
  p_entity text,
  p_action text,
  p_id uuid DEFAULT NULL,
  p_parent_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_ram_options text[] DEFAULT '{}'::text[],
  p_verified boolean DEFAULT false,
  p_old_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_id uuid;
  v_ram_options text[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_entity IS NULL OR p_action IS NULL
    OR p_entity NOT IN ('manufacturer', 'series', 'model', 'storage', 'color')
    OR p_action NOT IN ('save', 'rename_color')
  THEN
    RAISE EXCEPTION 'Catalog entity or action is invalid.' USING ERRCODE = '22023';
  END IF;
  IF p_action = 'rename_color' AND p_entity <> 'color' THEN
    RAISE EXCEPTION 'Only catalog colors can be renamed.' USING ERRCODE = '22023';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 120 THEN
    RAISE EXCEPTION 'Catalog name is required and must be at most 120 characters.' USING ERRCODE = '22023';
  END IF;

  IF p_entity = 'manufacturer' THEN
    IF p_id IS NULL THEN
      INSERT INTO public.manufacturers(name) VALUES (btrim(p_name)) RETURNING id INTO v_id;
    ELSE
      UPDATE public.manufacturers SET name = btrim(p_name) WHERE id = p_id RETURNING id INTO v_id;
    END IF;
  ELSIF p_entity = 'series' THEN
    IF p_parent_id IS NULL THEN RAISE EXCEPTION 'Select a manufacturer.' USING ERRCODE = '22023'; END IF;
    IF p_id IS NULL THEN
      INSERT INTO public.manufacturer_series(manufacturer_id, name) VALUES (p_parent_id, btrim(p_name)) RETURNING id INTO v_id;
    ELSE
      IF EXISTS (SELECT 1 FROM public.manufacturer_models WHERE series_id = p_id)
        AND EXISTS (SELECT 1 FROM public.manufacturer_series WHERE id = p_id AND manufacturer_id <> p_parent_id)
      THEN
        RAISE EXCEPTION 'A series with models cannot be moved to another manufacturer.' USING ERRCODE = '23503';
      END IF;
      UPDATE public.manufacturer_series SET manufacturer_id = p_parent_id, name = btrim(p_name) WHERE id = p_id RETURNING id INTO v_id;
    END IF;
  ELSIF p_entity = 'model' THEN
    IF p_parent_id IS NULL THEN RAISE EXCEPTION 'Select a series.' USING ERRCODE = '22023'; END IF;
    SELECT coalesce(array_agg(DISTINCT btrim(option) ORDER BY btrim(option)), '{}'::text[])
      INTO v_ram_options
      FROM unnest(coalesce(p_ram_options, '{}'::text[])) AS option
      WHERE btrim(option) <> '';
    IF p_id IS NULL THEN
      INSERT INTO public.manufacturer_models(series_id, name, ram_options, verified)
      VALUES (p_parent_id, btrim(p_name), v_ram_options, coalesce(p_verified, false))
      RETURNING id INTO v_id;
    ELSE
      IF EXISTS (SELECT 1 FROM public.products WHERE manufacturer_model_id = p_id)
        OR EXISTS (SELECT 1 FROM public.product_variants WHERE manufacturer_model_id = p_id)
        OR EXISTS (SELECT 1 FROM public.model_storage_options WHERE model_id = p_id)
      THEN
        IF EXISTS (SELECT 1 FROM public.manufacturer_models WHERE id = p_id AND series_id <> p_parent_id) THEN
          RAISE EXCEPTION 'A model used by inventory or storage cannot be moved to another series.' USING ERRCODE = '23503';
        END IF;
      END IF;
      UPDATE public.manufacturer_models
      SET series_id = p_parent_id, name = btrim(p_name), ram_options = v_ram_options,
          verified = coalesce(p_verified, false)
      WHERE id = p_id RETURNING id INTO v_id;
    END IF;
  ELSIF p_entity = 'storage' THEN
    IF p_parent_id IS NULL THEN RAISE EXCEPTION 'Select a model.' USING ERRCODE = '22023'; END IF;
    IF p_id IS NULL THEN
      INSERT INTO public.model_storage_options(model_id, storage_label) VALUES (p_parent_id, btrim(p_name)) RETURNING id INTO v_id;
    ELSE
      IF EXISTS (SELECT 1 FROM public.product_variants WHERE model_storage_option_id = p_id)
        AND EXISTS (SELECT 1 FROM public.model_storage_options WHERE id = p_id AND model_id <> p_parent_id)
      THEN
        RAISE EXCEPTION 'A storage option used by inventory cannot be moved to another model.' USING ERRCODE = '23503';
      END IF;
      UPDATE public.model_storage_options SET model_id = p_parent_id, storage_label = btrim(p_name) WHERE id = p_id RETURNING id INTO v_id;
    END IF;
  ELSE
    IF p_parent_id IS NULL THEN RAISE EXCEPTION 'Select a storage option.' USING ERRCODE = '22023'; END IF;
    IF p_action = 'rename_color' THEN
      IF p_old_name IS NULL OR btrim(p_old_name) = '' THEN
        RAISE EXCEPTION 'Select the existing color to rename.' USING ERRCODE = '22023';
      END IF;
      IF EXISTS (
        SELECT 1
        FROM public.product_variants
        WHERE model_storage_option_id = p_parent_id
          AND color_name = btrim(p_old_name)
      ) THEN
        RAISE EXCEPTION 'A color used by inventory variants cannot be renamed.' USING ERRCODE = '22023';
      END IF;
      UPDATE public.model_storage_colors
      SET color_name = btrim(p_name)
      WHERE storage_option_id = p_parent_id AND color_name = btrim(p_old_name);
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Catalog color not found.' USING ERRCODE = 'P0002';
      END IF;
    ELSE
      INSERT INTO public.model_storage_colors(storage_option_id, color_name)
      VALUES (p_parent_id, btrim(p_name))
      ON CONFLICT (storage_option_id, color_name) DO NOTHING;
    END IF;
    RETURN p_parent_id;
  END IF;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Catalog entry not found.' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_repair_diagnoses(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_repair_diagnoses(uuid[]) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_repair_request(
  uuid, public.repair_status, numeric, boolean, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_repair_request(
  uuid, public.repair_status, numeric, boolean, text, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_add_product_variant(
  uuid, uuid, text, text, integer, public.product_availability, text, numeric, numeric, text, smallint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_product_variant(
  uuid, uuid, text, text, integer, public.product_availability, text, numeric, numeric, text, smallint
) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_product_active(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_product_active(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_save_inventory_item_full(
  uuid, uuid, text, text, uuid, uuid, uuid, text, text, integer,
  public.product_availability, text, numeric, numeric, text, smallint,
  text, text, text, text, text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_inventory_item_full(
  uuid, uuid, text, text, uuid, uuid, uuid, text, text, integer,
  public.product_availability, text, numeric, numeric, text, smallint,
  text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_product_variant_active(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_product_variant_active(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_manage_catalog_item(text, text, uuid, uuid, text, text[], boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_catalog_item(text, text, uuid, uuid, text, text[], boolean, text)
  TO authenticated;

COMMIT;

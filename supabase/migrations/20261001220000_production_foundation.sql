BEGIN;

INSERT INTO public.categories (name, slug, active)
VALUES
  ('Smartphones', 'smartphones', true),
  ('Tablets', 'tablets', true),
  ('Smartwatches', 'smartwatches', true),
  ('Earbuds & Audio', 'earbuds-audio', true),
  ('Chargers & Cables', 'chargers-cables', true),
  ('Power Banks', 'power-banks', true),
  ('Phone Cases', 'phone-cases', true),
  ('Screen Protectors', 'screen-protectors', true),
  ('Gadgets', 'gadgets', true),
  ('Computer Accessories', 'computer-accessories', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[])
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS product_images_product_id_idx
  ON public.product_images (product_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public can read product images'
  ) THEN
    EXECUTE 'CREATE POLICY "public can read product images" ON storage.objects FOR SELECT TO public USING (bucket_id = ''product-images'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'admins upload product images'
  ) THEN
    EXECUTE 'CREATE POLICY "admins upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''product-images'' AND public.is_admin())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'admins update product images'
  ) THEN
    EXECUTE 'CREATE POLICY "admins update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''product-images'' AND public.is_admin()) WITH CHECK (bucket_id = ''product-images'' AND public.is_admin())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'admins delete product images'
  ) THEN
    EXECUTE 'CREATE POLICY "admins delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''product-images'' AND public.is_admin())';
  END IF;
END;
$$;

ALTER POLICY "public can read active variants"
  ON public.product_variants
  USING (
    availability IN ('active', 'out_of_stock')
    AND EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id
        AND p.active = true
    )
  );

DROP POLICY IF EXISTS "customers create own pending orders" ON public.orders;
DROP POLICY IF EXISTS "customers create items for own orders" ON public.order_items;

CREATE OR REPLACE FUNCTION public.place_arcadia_order(
  p_items jsonb,
  p_delivery_method text,
  p_delivery_state text,
  p_delivery_city text,
  p_delivery_address text,
  p_customer_name text,
  p_customer_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_customer_email text;
  v_item jsonb;
  v_line record;
  v_snapshots jsonb := '[]'::jsonb;
  v_variant_ids uuid[] := ARRAY[]::uuid[];
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12, 2) := 0;
  v_discount_total numeric(12, 2) := 0;
  v_delivery_fee numeric(12, 2) := 0;
  v_state text := lower(trim(coalesce(p_delivery_state, '')));
  v_city text := lower(trim(coalesce(p_delivery_city, '')));
  v_address text := trim(coalesce(p_delivery_address, ''));
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := trim(coalesce(p_customer_phone, ''));
  v_quantity integer;
  v_status product_availability;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in before placing an order.' USING ERRCODE = '42501';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Cart must contain between 1 and 50 items.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS items(value)
    GROUP BY value ->> 'variant_id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cart contains a duplicate variant.' USING ERRCODE = '22023';
  END IF;
  IF v_name = '' OR v_phone = '' THEN
    RAISE EXCEPTION 'Customer name and phone are required.' USING ERRCODE = '22023';
  END IF;
  IF p_delivery_method NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Choose delivery or pickup.' USING ERRCODE = '22023';
  END IF;

  SELECT email INTO v_customer_email
  FROM auth.users
  WHERE id = v_user_id;
  IF coalesce(v_customer_email, '') = '' THEN
    RAISE EXCEPTION 'The signed-in account needs an email address.' USING ERRCODE = '22023';
  END IF;

  IF p_delivery_method = 'delivery' THEN
    IF v_state = '' OR v_city = '' OR v_address = '' THEN
      RAISE EXCEPTION 'State, city, and address are required for delivery.' USING ERRCODE = '22023';
    END IF;
    IF v_state IN ('plateau', 'plateau state') THEN
      v_delivery_fee := CASE
        WHEN v_city LIKE '%jos north%' THEN 2000
        WHEN v_city LIKE '%rayfield%' THEN 2500
        WHEN v_city = 'jos' OR v_city LIKE 'jos %' THEN 2000
        ELSE 3000
      END;
    ELSIF v_state IN ('lagos', 'abuja', 'kaduna') OR v_city IN ('lagos', 'abuja', 'kaduna') THEN
      v_delivery_fee := 5000;
    ELSIF v_state = 'kano' OR v_city = 'kano' THEN
      v_delivery_fee := 5500;
    ELSIF v_city = 'port harcourt' THEN
      v_delivery_fee := 5500;
    ELSE
      v_delivery_fee := 5000;
    END IF;
  END IF;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items) AS items(value)
    ORDER BY value ->> 'variant_id'
  LOOP
    IF coalesce(v_item ->> 'variant_id', '') = ''
      OR coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]*$'
    THEN
      RAISE EXCEPTION 'Each cart item needs a valid variant and positive integer quantity.' USING ERRCODE = '22023';
    END IF;
    v_quantity := (v_item ->> 'quantity')::integer;

    SELECT
      pv.id,
      pv.product_id,
      pv.stock_quantity,
      pv.availability,
      pv.sku,
      pv.condition,
      pv.original_price,
      pv.discount_amount,
      pv.final_price,
      pv.warranty,
      pv.color_name,
      so.storage_label,
      p.name AS product_name,
      model.name AS model_name
    INTO v_line
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    JOIN public.manufacturer_models model ON model.id = pv.manufacturer_model_id
    JOIN public.model_storage_options so ON so.id = pv.model_storage_option_id
      AND so.model_id = pv.manufacturer_model_id
    JOIN public.model_storage_colors color ON color.storage_option_id = pv.model_storage_option_id
      AND color.color_name = pv.color_name
    WHERE pv.id = (v_item ->> 'variant_id')::uuid
      AND p.active = true
      AND pv.availability = 'active'
    FOR UPDATE OF pv, p;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A selected product variant is unavailable.' USING ERRCODE = 'P0001';
    END IF;
    IF v_line.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for SKU %.', v_line.sku USING ERRCODE = 'P0001';
    END IF;

    v_subtotal := v_subtotal + (v_line.original_price * v_quantity);
    v_discount_total := v_discount_total + (v_line.discount_amount * v_quantity);
    v_snapshots := v_snapshots || jsonb_build_array(jsonb_build_object(
      'variant_id', v_line.id,
      'product_id', v_line.product_id,
      'product_name', v_line.product_name,
      'variant_description', concat_ws(' / ', v_line.model_name, v_line.storage_label, v_line.color_name, v_line.condition),
      'sku', v_line.sku,
      'quantity', v_quantity,
      'unit_price', v_line.original_price,
      'discount_amount', v_line.discount_amount,
      'final_unit_price', v_line.final_price,
      'warranty', v_line.warranty
    ));
    v_variant_ids := array_append(v_variant_ids, v_line.id);

    v_status := CASE WHEN v_line.stock_quantity - v_quantity = 0 THEN 'out_of_stock'::product_availability ELSE 'active'::product_availability END;
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_quantity,
        availability = v_status
    WHERE id = v_line.id;
  END LOOP;

  v_order_id := gen_random_uuid();
  v_order_number := 'ARC-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  INSERT INTO public.orders (
    id, user_id, order_number, status, subtotal, discount_total, delivery_fee, grand_total,
    payment_method, payment_status, delivery_method, delivery_state, delivery_city,
    delivery_address, customer_name, customer_phone, customer_email
  ) VALUES (
    v_order_id, v_user_id, v_order_number, 'pending', v_subtotal, v_discount_total,
    v_delivery_fee, v_subtotal - v_discount_total + v_delivery_fee,
    'bank_transfer', 'pending', p_delivery_method,
    CASE WHEN p_delivery_method = 'delivery' THEN trim(p_delivery_state) ELSE NULL END,
    CASE WHEN p_delivery_method = 'delivery' THEN trim(p_delivery_city) ELSE NULL END,
    CASE WHEN p_delivery_method = 'delivery' THEN v_address ELSE NULL END,
    v_name, v_phone, v_customer_email
  );

  INSERT INTO public.order_items (
    order_id, product_id, variant_id, product_name, variant_description, sku,
    quantity, unit_price, discount_amount, final_unit_price, warranty
  )
  SELECT
    v_order_id,
    (item ->> 'product_id')::uuid,
    (item ->> 'variant_id')::uuid,
    item ->> 'product_name',
    item ->> 'variant_description',
    item ->> 'sku',
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price')::numeric,
    (item ->> 'discount_amount')::numeric,
    (item ->> 'final_unit_price')::numeric,
    item ->> 'warranty'
  FROM jsonb_array_elements(v_snapshots) AS snapshot(item);

  DELETE FROM public.carts
  WHERE user_id = v_user_id
    AND variant_id = ANY(v_variant_ids);

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending',
    'payment_status', 'pending',
    'subtotal', v_subtotal,
    'discount_total', v_discount_total,
    'delivery_fee', v_delivery_fee,
    'grand_total', v_subtotal - v_discount_total + v_delivery_fee
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_arcadia_order(jsonb, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_arcadia_order(jsonb, text, text, text, text, text, text) TO authenticated;

COMMIT;

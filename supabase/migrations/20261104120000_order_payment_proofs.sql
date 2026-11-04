BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_proof_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "customers upload own payment proofs" ON storage.objects;
CREATE POLICY "customers upload own payment proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1
      FROM public.orders AS order_record
      WHERE order_record.id::text = split_part(name, '/', 2)
        AND order_record.user_id = (SELECT auth.uid())
        AND order_record.payment_status IN ('pending', 'awaiting_confirmation')
    )
  );

DROP POLICY IF EXISTS "customers and admins read payment proofs" ON storage.objects;
CREATE POLICY "customers and admins read payment proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (
      public.is_admin()
      OR (
        split_part(name, '/', 1) = (SELECT auth.uid())::text
        AND EXISTS (
          SELECT 1
          FROM public.orders AS order_record
          WHERE order_record.id::text = split_part(name, '/', 2)
            AND order_record.user_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE OR REPLACE FUNCTION public.attach_arcadia_payment_proof(
  p_order_id uuid,
  p_storage_path text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL
    OR p_storage_path IS NULL
    OR split_part(p_storage_path, '/', 1) <> v_user_id::text
    OR split_part(p_storage_path, '/', 2) <> p_order_id::text
    OR split_part(p_storage_path, '/', 3) = ''
    OR length(p_storage_path) - length(replace(p_storage_path, '/', '')) <> 2
  THEN
    RETURN false;
  END IF;

  UPDATE public.orders AS order_record
  SET payment_proof_path = p_storage_path
  WHERE order_record.id = p_order_id
    AND order_record.user_id = v_user_id
    AND order_record.payment_status IN ('pending', 'awaiting_confirmation')
    AND order_record.payment_proof_path IS NULL
    AND EXISTS (
      SELECT 1
      FROM storage.objects AS proof
      WHERE proof.bucket_id = 'payment-proofs'
        AND proof.name = p_storage_path
    );

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_arcadia_payment_proof(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_arcadia_payment_proof(uuid, text) TO authenticated;

COMMIT;

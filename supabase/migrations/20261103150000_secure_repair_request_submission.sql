-- PREPARED ONLY: unapplied migration draft.
-- Do not apply until project identity, migration provenance, and role tests are approved.
-- Accept customer fields through a narrow RPC; generate ticket/workflow values in the database.

BEGIN;

ALTER TABLE public.repair_requests
  ALTER COLUMN ticket_number SET DEFAULT (
    'REP-' || to_char(current_timestamp, 'YYYY') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  );

CREATE FUNCTION public.submit_repair_request(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_device text,
  p_device_details text,
  p_problem text,
  p_description text,
  p_preferred_date date
)
RETURNS TABLE (
  ticket_number text,
  status public.repair_status,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_ticket_number text;
  v_status public.repair_status;
  v_created_at timestamptz;
BEGIN
  IF p_customer_name IS NULL OR btrim(p_customer_name) = '' OR length(btrim(p_customer_name)) > 200
    OR p_customer_phone IS NULL OR btrim(p_customer_phone) = '' OR length(btrim(p_customer_phone)) > 40
    OR p_customer_email IS NULL
    OR p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR length(p_customer_email) > 254
    OR p_device IS NULL OR btrim(p_device) = '' OR length(btrim(p_device)) > 100
    OR p_device_details IS NULL OR btrim(p_device_details) = '' OR length(btrim(p_device_details)) > 200
    OR p_problem IS NULL OR btrim(p_problem) = '' OR length(btrim(p_problem)) > 200
    OR (p_description IS NOT NULL AND length(p_description) > 4000)
  THEN
    RAISE EXCEPTION 'Repair request fields are invalid.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.repair_requests (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    device,
    device_details,
    problem,
    description,
    preferred_date
  )
  VALUES (
    auth.uid(),
    btrim(p_customer_name),
    btrim(p_customer_phone),
    lower(btrim(p_customer_email)),
    btrim(p_device),
    btrim(p_device_details),
    btrim(p_problem),
    NULLIF(btrim(p_description), ''),
    p_preferred_date
  )
  RETURNING repair_requests.ticket_number, repair_requests.status, repair_requests.created_at
  INTO v_ticket_number, v_status, v_created_at;

  RETURN QUERY
  SELECT v_ticket_number, v_status, v_created_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_repair_request(
  text, text, text, text, text, text, text, date
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_repair_request(
  text, text, text, text, text, text, text, date
) TO anon, authenticated;

COMMIT;

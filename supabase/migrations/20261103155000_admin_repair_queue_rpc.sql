-- PREPARED ONLY: unapplied migration draft.
-- Do not apply until project identity, migration provenance, and admin role tests are approved.
-- Return customer/staff repair details only to an authenticated administrator.

BEGIN;

CREATE FUNCTION public.admin_list_repair_requests(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.repair_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100
    OR p_offset IS NULL OR p_offset < 0
  THEN
    RAISE EXCEPTION 'Repair request page is invalid.' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT request.*
  FROM public.repair_requests AS request
  ORDER BY request.created_at DESC, request.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_repair_requests(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_repair_requests(integer, integer)
  TO authenticated;

COMMIT;

-- PREPARED ONLY: unapplied migration draft.
-- Do not apply until project identity and migration provenance are reconciled.
-- Preserve customer-submitted repair details while reserving workflow fields for admins.

BEGIN;

ALTER POLICY "customers create own repairs"
  ON public.repair_requests
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'requested'::public.repair_status
    AND contacted = false
    AND repair_cost IS NULL
    AND communication_notes IS NULL
  );

ALTER POLICY "guests may submit unowned repairs"
  ON public.repair_requests
  WITH CHECK (
    user_id IS NULL
    AND status = 'requested'::public.repair_status
    AND contacted = false
    AND repair_cost IS NULL
    AND communication_notes IS NULL
  );

COMMIT;

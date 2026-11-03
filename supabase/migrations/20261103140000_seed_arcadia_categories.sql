-- PREPARED ONLY: unapplied additive data migration draft.
-- Do not apply until project identity and migration provenance are reconciled.
-- Reuses the existing Arcadia category set; it creates no new schema objects.

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

COMMIT;

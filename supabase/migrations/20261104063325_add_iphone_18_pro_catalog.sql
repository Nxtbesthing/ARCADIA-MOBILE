WITH apple AS (
  SELECT id FROM public.manufacturers WHERE lower(name) = 'apple'
)
INSERT INTO public.manufacturer_series (manufacturer_id, name)
SELECT apple.id, names.name
FROM apple
CROSS JOIN (VALUES ('iPhone 18 Pro'), ('iPhone 18 Pro Max')) AS names(name)
ON CONFLICT (manufacturer_id, name) DO NOTHING;

INSERT INTO public.manufacturer_models (series_id, name, ram_options, verified)
SELECT s.id, s.name, '{}'::text[], true
FROM public.manufacturer_series s
JOIN public.manufacturers m ON m.id = s.manufacturer_id
WHERE lower(m.name) = 'apple'
  AND s.name IN ('iPhone 18 Pro', 'iPhone 18 Pro Max')
ON CONFLICT (series_id, name)
DO UPDATE SET verified = true;

INSERT INTO public.model_storage_options (model_id, storage_label)
SELECT mm.id, storage.storage_label
FROM public.manufacturer_models mm
JOIN public.manufacturer_series s ON s.id = mm.series_id
JOIN public.manufacturers m ON m.id = s.manufacturer_id
CROSS JOIN (VALUES ('256GB'), ('512GB'), ('1TB'), ('2TB')) AS storage(storage_label)
WHERE lower(m.name) = 'apple'
  AND mm.name IN ('iPhone 18 Pro', 'iPhone 18 Pro Max')
ON CONFLICT (model_id, storage_label) DO NOTHING;

INSERT INTO public.model_storage_colors (storage_option_id, color_name)
SELECT o.id, colors.color_name
FROM public.model_storage_options o
JOIN public.manufacturer_models mm ON mm.id = o.model_id
JOIN public.manufacturer_series s ON s.id = mm.series_id
JOIN public.manufacturers m ON m.id = s.manufacturer_id
CROSS JOIN (VALUES ('Black'), ('Silver'), ('Glacier'), ('Burgundy')) AS colors(color_name)
WHERE lower(m.name) = 'apple'
  AND mm.name IN ('iPhone 18 Pro', 'iPhone 18 Pro Max')
  AND o.storage_label IN ('256GB', '512GB', '1TB', '2TB')
ON CONFLICT (storage_option_id, color_name) DO NOTHING;

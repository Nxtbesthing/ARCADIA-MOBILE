import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../script.js', import.meta.url), 'utf8')
const admin = await readFile(new URL('../src/admin-inventory.js', import.meta.url), 'utf8')
const workflows = await readFile(new URL('../src/admin-workflows.js', import.meta.url), 'utf8')
const schema = await readFile(new URL('../supabase/migrations/20260930000000_initial_schema.sql', import.meta.url), 'utf8')
const storagePolicies = await readFile(new URL('../supabase/migrations/20261001220000_production_foundation.sql', import.meta.url), 'utf8')
const imageOrderingMigration = await readFile(new URL('../supabase/migrations/20261104101046_admin_reorder_product_images.sql', import.meta.url), 'utf8')

test('storefront wires secure auth, catalog provenance, persistent cart, checkout, and repairs', () => {
  for (const integration of [
    "import { supabase, supabaseAuthState, supabaseConfiguration }",
    "import { canCheckoutCart, canPurchaseVariant, resolveCatalogDisplay }",
    "import { loadAndMergeAuthenticatedCart, syncAuthenticatedCartItem }",
    "import { placeArcadiaOrder }",
    "import { repairStatusErrorMessage, submitRepairRequest }",
    'placeArcadiaOrder(supabase',
    'submitRepairRequest(supabase',
    'loadAndMergeAuthenticatedCart(supabase'
  ]) {
    assert.ok(app.includes(integration), `Expected app integration: ${integration}`)
  }

  assert.doesNotMatch(app, /\.from\(["']repair_requests["']\)\s*\.insert\(/)
  assert.match(app, /canCheckoutCart\(cart,\s*products\)/)
  assert.match(app, /canPurchaseVariant\(product,\s*variant\)/)
})

test('admin inventory reads the live master color mappings used to validate variants', () => {
  assert.match(admin, /readAll\('model_storage_colors',\s*'storage_option_id,color_name'\)/)
  assert.match(admin, /colors,\s*\n\s*products,/)
  assert.match(admin, /saveAdminInventoryItem/)
})

test('Product Listing consolidates image management and safely redirects old routes', () => {
  assert.match(admin, /\['products', 'Product Listing'\]/)
  assert.doesNotMatch(admin, /\['images', 'Product Images'\]/)
  assert.match(admin, /data-si-product-images/)
  assert.match(admin, /data-si-existing-images/)
  assert.match(admin, /pendingFiles\.length/)
  assert.match(admin, /saved\.saved_product_id/)
  assert.match(admin, /saved\.saved_variant_id/)
  assert.match(admin, /name="product_images" data-si-product-images type="file"[^>]*multiple \/>/)
  assert.match(admin, /submit\.disabled = true/)
  assert.match(app, /hash === "#admin\/images" \|\| hash === "#admin\/inventory"/)
  assert.match(app, /window\.location\.hash = "#admin\/products"/)
  assert.match(app, /OPEN PRODUCT LISTING/)
})

test('product images retain admin-only write policies and public viewing', () => {
  assert.match(schema, /alter table public\.product_images enable row level security/i)
  assert.match(schema, /admins manage product images[\s\S]*?public\.is_admin\(\)/i)
  assert.match(storagePolicies, /public can read product images/i)
  assert.match(storagePolicies, /admins upload product images[\s\S]*?public\.is_admin\(\)/i)
  assert.match(storagePolicies, /admins update product images[\s\S]*?public\.is_admin\(\)/i)
  assert.match(storagePolicies, /admins delete product images[\s\S]*?public\.is_admin\(\)/i)
  assert.doesNotMatch(admin, /service[_-]?role/i)
})

test('image ordering migration is a single admin-authorized transaction scoped to the product variant', () => {
  assert.match(imageOrderingMigration, /BEGIN;[\s\S]*CREATE FUNCTION public\.admin_reorder_product_images/)
  assert.match(imageOrderingMigration, /auth\.uid\(\) IS NULL OR NOT public\.is_admin\(\)/)
  assert.match(imageOrderingMigration, /SET search_path = pg_catalog, public, auth, pg_temp/)
  assert.match(imageOrderingMigration, /SECURITY DEFINER/)
  assert.match(imageOrderingMigration, /UPDATE public\.product_images AS image[\s\S]*WITH ORDINALITY/)
  assert.match(imageOrderingMigration, /Image order must include every eligible image exactly once/)
  assert.match(imageOrderingMigration, /Not all product images could be reordered/)
  assert.match(imageOrderingMigration, /REVOKE ALL ON FUNCTION public\.admin_reorder_product_images[\s\S]*FROM PUBLIC, anon, authenticated/)
  assert.match(imageOrderingMigration, /GRANT EXECUTE ON FUNCTION public\.admin_reorder_product_images[\s\S]*TO authenticated/)
  assert.match(admin, /loadAdminProductImages\(supabase, productId\)/)
  assert.match(admin, /Review the saved images below; they remain attached to this variant/)
  assert.match(admin, /data-si-confirm-image-variant-change/)
  assert.match(admin, /confirm the storage or colour change before saving/)
  assert.match(admin, /Active \(can show when out of stock\)/)
  assert.match(admin, /Hidden \(excluded from storefront\)/)
  assert.match(admin, /variant\.availability === 'out_of_stock' \? 'Out of Stock'/)
})

test('variant image warning callback is initialized before event registration', () => {
  assert.match(admin, /function updateVariantImageWarning\(\)/)
  assert.doesNotMatch(admin, /const updateVariantImageWarning\s*=/)
})

test('image ordering rejects incomplete image lists before any update', () => {
  assert.match(imageOrderingMigration, /FROM public\.products[\s\S]*?FOR UPDATE/)
  assert.match(imageOrderingMigration, /FROM public\.product_variants[\s\S]*?FOR UPDATE/)
  const eligibleImageSelection = imageOrderingMigration.match(
    /SELECT COALESCE\(array_agg\(eligible\.id ORDER BY eligible\.id\), ARRAY\[\]::uuid\[\]\)[\s\S]*?FOR UPDATE[\s\S]*?\) AS eligible;/
  )
  assert.ok(eligibleImageSelection, 'Expected the complete eligible image group to be locked and collected')
  assert.match(imageOrderingMigration, /cardinality\(p_ordered_image_ids\) <> cardinality\(v_eligible_image_ids\)/)
  assert.ok(
    imageOrderingMigration.indexOf('Image order must include every eligible image exactly once')
      < imageOrderingMigration.indexOf('UPDATE public.product_images AS image'),
    'Expected completeness validation before the reorder update'
  )
})

test('image ordering rejects duplicate and foreign image IDs', () => {
  assert.match(imageOrderingMigration, /count\(DISTINCT image_id\)[\s\S]*?FROM unnest\(p_ordered_image_ids\)/)
  assert.match(imageOrderingMigration, /WHERE NOT \(requested\.image_id = ANY\(v_eligible_image_ids\)\)/)
  assert.match(imageOrderingMigration, /image\.product_id = p_product_id[\s\S]*?image\.variant_id IS NULL OR image\.variant_id = p_variant_id/)
})

test('empty image ordering is accepted only for an empty eligible group', () => {
  assert.match(imageOrderingMigration, /COALESCE\(array_agg\(eligible\.id ORDER BY eligible\.id\), ARRAY\[\]::uuid\[\]\)/)
  assert.doesNotMatch(imageOrderingMigration, /cardinality\(p_ordered_image_ids\)\s*=\s*0/)
  assert.match(imageOrderingMigration, /cardinality\(p_ordered_image_ids\) <> cardinality\(v_eligible_image_ids\)/)
})

test('valid image ordering assigns contiguous positions and rolls back on update failure', () => {
  assert.match(imageOrderingMigration, /requested\.ordinality - 1/)
  assert.match(imageOrderingMigration, /v_updated_count <> cardinality\(p_ordered_image_ids\)[\s\S]*?RAISE EXCEPTION/)
  assert.match(imageOrderingMigration, /BEGIN;[\s\S]*CREATE FUNCTION[\s\S]*?AS \$function\$[\s\S]*?BEGIN[\s\S]*?RETURN true;[\s\S]*?END;[\s\S]*COMMIT;/)
})

test('announcements use the shared Supabase board and catalog records are never deleted', () => {
  assert.match(app, /listPublishedAnnouncements\(supabase\)/)
  assert.match(admin, /data-si-announcement-form/)
  assert.match(admin, /data-si-publish-announcement/)
  assert.doesNotMatch(admin, /data-si-delete-catalog/)
  assert.doesNotMatch(admin, /state\.colors\s*=/)
  assert.match(workflows, /!\['save', 'rename_color'\]\.includes\(values\.action\)/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../script.js', import.meta.url), 'utf8')
const admin = await readFile(new URL('../src/admin-inventory.js', import.meta.url), 'utf8')
const workflows = await readFile(new URL('../src/admin-workflows.js', import.meta.url), 'utf8')

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

test('announcements use the shared Supabase board and catalog records are never deleted', () => {
  assert.match(app, /listPublishedAnnouncements\(supabase\)/)
  assert.match(admin, /data-si-announcement-form/)
  assert.match(admin, /data-si-publish-announcement/)
  assert.doesNotMatch(admin, /data-si-delete-catalog/)
  assert.doesNotMatch(admin, /state\.colors\s*=/)
  assert.match(workflows, /!\['save', 'rename_color'\]\.includes\(values\.action\)/)
})

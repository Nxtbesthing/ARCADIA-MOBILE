import test from 'node:test'
import assert from 'node:assert/strict'
import { canCheckoutCart, canPurchaseVariant, isSupabaseUuid, resolveCatalogDisplay } from '../src/catalog-state.js'

const productId = 'c0a80101-0000-4000-8000-000000000001'
const variantId = 'c0a80101-0000-4000-8000-000000000002'
const liveProduct = { id: productId, variants: [{ id: variantId }] }

test('live catalogs keep Supabase products and preserve categories', () => {
  const view = resolveCatalogDisplay({ status: 'live', products: [liveProduct], categories: [{ slug: 'phones' }] })
  assert.equal(view.status, 'live')
  assert.equal(view.displayMode, 'live')
  assert.equal(view.products[0].previewOnly, false)
  assert.equal(view.products[0].variants[0].catalogSource, 'supabase')
  assert.equal(view.categories[0].slug, 'phones')
})

test('empty catalogs show no products and preserve categories', () => {
  const categories = [{ slug: 'phones' }]
  const view = resolveCatalogDisplay({ status: 'empty', products: [], categories })
  assert.equal(view.status, 'empty')
  assert.equal(view.sourceStatus, 'empty')
  assert.equal(view.displayMode, 'empty')
  assert.deepEqual(view.products, [])
  assert.equal(view.categories[0].slug, 'phones')
  assert.match(view.message, /no live products/i)
})

test('incomplete catalogs show valid live products and warn about incomplete data', () => {
  const view = resolveCatalogDisplay({ status: 'incomplete', products: [liveProduct], categories: [] })
  assert.equal(view.displayMode, 'live')
  assert.equal(view.products[0].id, productId)
  assert.match(view.message, /incomplete/i)
})

test('incomplete, failed, and unconfigured catalogs never show preview products', () => {
  for (const status of ['incomplete', 'error', 'unconfigured']) {
    const view = resolveCatalogDisplay({ status, products: [], categories: [] })
    assert.equal(view.sourceStatus, status)
    assert.equal(view.displayMode, 'empty')
    assert.deepEqual(view.products, [])
    assert.ok(view.message.length > 0)
  }
})

test('purchase eligibility requires live provenance and UUID-backed product and variant IDs', () => {
  const live = resolveCatalogDisplay({ status: 'live', products: [liveProduct], categories: [] }).products[0]
  assert.equal(isSupabaseUuid(variantId), true)
  assert.equal(isSupabaseUuid('1-default'), false)
  assert.equal(canPurchaseVariant(live, live.variants[0]), true)
  assert.equal(canPurchaseVariant({ ...live, id: 'not-a-uuid' }, live.variants[0]), false)
  assert.equal(canPurchaseVariant({ ...live, previewOnly: true }, live.variants[0]), false)
  assert.equal(canCheckoutCart([{ id: live.id, variantId: live.variants[0].id }], [live]), true)
  assert.equal(canCheckoutCart([{ id: '1', variantId: '1-default' }], [live]), false)
  assert.equal(canCheckoutCart([], [live]), false)
})
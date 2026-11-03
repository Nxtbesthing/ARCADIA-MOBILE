import test from 'node:test'
import assert from 'node:assert/strict'
import { canCheckoutCart, canPurchaseVariant, isSupabaseUuid, resolveCatalogDisplay } from '../src/catalog-state.js'

const productId = 'c0a80101-0000-4000-8000-000000000001'
const variantId = 'c0a80101-0000-4000-8000-000000000002'
const liveProduct = { id: productId, variants: [{ id: variantId }] }
const previewProduct = { id: 1, variants: [{ id: '1-default' }] }

test('live catalogs keep Supabase products and preserve categories', () => {
  const view = resolveCatalogDisplay({ status: 'live', products: [liveProduct], categories: [{ slug: 'phones' }] }, [previewProduct])
  assert.equal(view.status, 'live')
  assert.equal(view.displayMode, 'live')
  assert.equal(view.products[0].previewOnly, false)
  assert.equal(view.products[0].variants[0].catalogSource, 'supabase')
  assert.equal(view.categories[0].slug, 'phones')
})

test('empty catalogs use clearly marked preview inventory', () => {
  const view = resolveCatalogDisplay({ status: 'empty', products: [], categories: [] }, [previewProduct])
  assert.equal(view.status, 'preview')
  assert.equal(view.sourceStatus, 'empty')
  assert.equal(view.products[0].previewOnly, true)
  assert.match(view.message, /cannot be purchased/i)
})

test('incomplete catalogs never get silently replaced by preview products', () => {
  const view = resolveCatalogDisplay({ status: 'incomplete', products: [liveProduct], categories: [] }, [previewProduct])
  assert.equal(view.displayMode, 'live')
  assert.equal(view.products[0].id, productId)
  assert.match(view.message, /incomplete/i)
})

test('incomplete, failed, and unconfigured catalogs use explicitly marked preview when no usable live products exist', () => {
  for (const status of ['incomplete', 'error', 'unconfigured']) {
    const view = resolveCatalogDisplay({ status, products: [], categories: [] }, [previewProduct])
    assert.equal(view.status, 'preview')
    assert.equal(view.sourceStatus, status)
    assert.equal(view.products[0].previewOnly, true)
    assert.match(view.message, /cannot be purchased/i)
  }
})

test('purchase eligibility requires live provenance and UUID-backed product and variant IDs', () => {
  const live = resolveCatalogDisplay({ status: 'live', products: [liveProduct], categories: [] }, []).products[0]
  const local = resolveCatalogDisplay({ status: 'empty', products: [], categories: [] }, [previewProduct]).products[0]
  assert.equal(isSupabaseUuid(variantId), true)
  assert.equal(isSupabaseUuid('1-default'), false)
  assert.equal(canPurchaseVariant(live, live.variants[0]), true)
  assert.equal(canPurchaseVariant(local, local.variants[0]), false)
  assert.equal(canPurchaseVariant({ ...live, id: 'not-a-uuid' }, live.variants[0]), false)
  assert.equal(canCheckoutCart([{ id: live.id, variantId: live.variants[0].id }], [live]), true)
  assert.equal(canCheckoutCart([{ id: local.id, variantId: local.variants[0].id }], [local]), false)
  assert.equal(canCheckoutCart([], [live]), false)
})
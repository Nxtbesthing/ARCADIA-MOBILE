import test from 'node:test'
import assert from 'node:assert/strict'
import { loadAndMergeAuthenticatedCart, syncAuthenticatedCartItem } from '../src/cart-sync.js'

const productId = 'c0a80101-0000-4000-8000-000000000001'
const variantId = 'c0a80101-0000-4000-8000-000000000002'
const product = {
  id: productId,
  name: 'Phone',
  brand: 'Arcadia',
  catalogSource: 'supabase',
  previewOnly: false,
  variants: [{ id: variantId, catalogSource: 'supabase', previewOnly: false, stock: 5 }]
}

test('cart sync scopes reads and writes to the authenticated user and caps merged quantity to stock', async () => {
  const calls = []
  const client = {
    from(table) {
      assert.equal(table, 'carts')
      return {
        select() { calls.push(['select']); return this },
        eq(column, value) { calls.push(['eq', column, value]); return this },
        limit() { return Promise.resolve({ data: [{ product_id: productId, variant_id: variantId, quantity: 3 }], error: null }) },
        upsert(row, options) { calls.push(['upsert', row, options]); return Promise.resolve({ error: null }) }
      }
    }
  }
  const merged = await loadAndMergeAuthenticatedCart(client, 'customer-1', [{
    id: productId,
    variantId,
    quantity: 4,
    catalogSource: 'supabase',
    previewOnly: false
  }], [product])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].quantity, 5)
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'customer-1'))
  assert.ok(calls.some((call) => call[0] === 'upsert' && call[1].user_id === 'customer-1' && call[1].quantity === 5))
})

test('preview items never enter authenticated cart persistence', async () => {
  let called = false
  const client = { from() { called = true; throw new Error('should not query Supabase') } }
  await syncAuthenticatedCartItem(client, 'customer-1', { id: 'preview', variantId: 'preview-variant', catalogSource: 'preview', previewOnly: true })
  const merged = await loadAndMergeAuthenticatedCart({
    from() {
      return { select() { return this }, eq() { return this }, limit: async () => ({ data: [], error: null }) }
    }
  }, 'customer-1', [{ id: 'preview', variantId: 'preview-variant', quantity: 1, catalogSource: 'preview', previewOnly: true }], [])
  assert.equal(called, false)
  assert.deepEqual(merged, [])
})

test('cart synchronization errors remain explicit to the caller', async () => {
  const client = { from: () => ({ select() { return this }, eq() { return this }, limit: async () => ({ data: null, error: new Error('offline') }) }) }
  await assert.rejects(loadAndMergeAuthenticatedCart(client, 'customer-1', [], []), /offline/)
})

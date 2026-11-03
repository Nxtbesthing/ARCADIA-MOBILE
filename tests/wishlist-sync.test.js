import test from 'node:test'
import assert from 'node:assert/strict'
import { loadAndMergeWishlist } from '../src/wishlist-sync.js'

const existingId = 'c0a80101-0000-4000-8000-000000000001'
const guestId = 'c0a80101-0000-4000-8000-000000000002'
const previewId = 'preview-product'

test('wishlist sync merges guest and account products without persisting preview products', async () => {
  const inserts = []
  const client = {
    from(table) {
      assert.equal(table, 'wishlists')
      return {
        select() { return this },
        eq() { return this },
        is() { return this },
        limit() { return Promise.resolve({ data: [{ product_id: existingId }], error: null }) },
        insert(row) { inserts.push(row); return Promise.resolve({ error: null }) }
      }
    }
  }
  const products = [
    { id: existingId, catalogSource: 'supabase', previewOnly: false },
    { id: guestId, catalogSource: 'supabase', previewOnly: false },
    { id: previewId, catalogSource: 'preview', previewOnly: true }
  ]
  const result = await loadAndMergeWishlist(client, 'customer-1', [guestId, previewId], products)
  assert.deepEqual(result, [existingId, guestId, previewId])
  assert.deepEqual(inserts, [{ user_id: 'customer-1', product_id: guestId, variant_id: null }])
})

test('wishlist errors are not converted into successful empty state', async () => {
  const client = { from: () => ({ select() { return this }, eq() { return this }, is() { return this }, limit: async () => ({ data: null, error: new Error('offline') }) }) }
  await assert.rejects(loadAndMergeWishlist(client, 'customer-1', [], []), /offline/)
})

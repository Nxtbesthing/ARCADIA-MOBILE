import test from 'node:test'
import assert from 'node:assert/strict'
import {
  removeAdminProductImage,
  reorderAdminProductImages,
  hasAdminVariantImageDetailsChanged,
  hasConfirmedAdminVariantImageReview,
  requiresAdminVariantImageReview,
  resolveAdminVariantAvailability,
  saveAdminProductImages,
  setAdminProductImagePrimary,
  validateAdminProductImages
} from '../src/admin-workflows.js'

function createClient({ uploadFailureAt = -1, insertFailure = null, removeFailure = null, reorderFailure = null } = {}) {
  const uploads = []
  const removals = []
  const inserts = []
  const updates = []
  const deletions = []
  const rpcCalls = []
  let uploadCount = 0
  const client = {
    uploads,
    removals,
    inserts,
    updates,
    deletions,
    rpcCalls,
    async rpc(name, args) {
      rpcCalls.push({ name, args })
      if (reorderFailure) return { data: null, error: reorderFailure }
      return { data: true, error: null }
    },
    storage: {
      from(bucketName) {
        assert.equal(bucketName, 'product-images')
        return {
          async upload(path, file) {
            uploadCount += 1
            uploads.push({ path, file })
            return uploadCount === uploadFailureAt
              ? { error: { message: 'storage denied' } }
              : { error: null }
          },
          async remove(paths) {
            removals.push(paths)
            return { error: removeFailure }
          }
        }
      }
    },
    from(table) {
      assert.equal(table, 'product_images')
      return {
        update(values) {
          const filters = []
          const query = {
            eq(column, value) { filters.push([column, value]); return query },
            select() { return query },
            async maybeSingle() {
              updates.push({ values, filters: [...filters] })
              if (filters.some(([column]) => column === 'id')) return { data: { id: filters.find(([column]) => column === 'id')[1] }, error: null }
              return { data: null, error: null }
            },
            then(resolve, reject) {
              updates.push({ values, filters: [...filters] })
              const error = null
              return Promise.resolve({ data: null, error }).then(resolve, reject)
            }
          }
          return query
        },
        insert(rows) {
          inserts.push(rows)
          return Promise.resolve({ error: insertFailure })
        },
        upsert(rows, options) {
          inserts.push({ rows, options })
          return Promise.resolve({ error: insertFailure })
        },
        delete() {
          const filters = []
          const query = {
            eq(column, value) { filters.push([column, value]); return query },
            select() { return query },
            async maybeSingle() {
              deletions.push(filters)
              return { data: { id: filters.find(([column]) => column === 'id')?.[1] }, error: null }
            }
          }
          return query
        }
      }
    }
  }
  return client
}

const imageFile = (name, type = 'image/jpeg', size = 1024) => ({ name, type, size })

test('image validation allows no images and supported files, and rejects invalid types and sizes', () => {
  assert.doesNotThrow(() => validateAdminProductImages([]))
  assert.doesNotThrow(() => validateAdminProductImages([
    imageFile('front.webp', 'image/webp'),
    imageFile('back.avif', 'image/avif')
  ]))
  assert.throws(() => validateAdminProductImages([imageFile('notes.svg', 'image/svg+xml')]), /JPEG, PNG, WebP, or AVIF/)
  assert.throws(() => validateAdminProductImages([imageFile('empty.png', 'image/png', 0)]), /JPEG, PNG, WebP, or AVIF/)
  assert.throws(() => validateAdminProductImages([imageFile('large.png', 'image/png', 10485761)]), /10 MB/)
})

test('active zero-stock variants remain Out of Stock; only Hidden suppresses storefront visibility', () => {
  assert.equal(resolveAdminVariantAvailability('active', 0), 'out_of_stock')
  assert.equal(resolveAdminVariantAvailability('active', 4), 'active')
  assert.equal(resolveAdminVariantAvailability('hidden', 0), 'hidden')
  assert.equal(resolveAdminVariantAvailability('hidden', 4), 'hidden')
})

test('editing warns when either storage or colour changes, but not when variant details stay the same', () => {
  const existing = { model_storage_option_id: 'storage-1', color_name: 'Black' }
  assert.equal(hasAdminVariantImageDetailsChanged(existing, { storageOptionId: 'storage-2', colorName: 'Black' }), true)
  assert.equal(hasAdminVariantImageDetailsChanged(existing, { storageOptionId: 'storage-1', colorName: 'Blue' }), true)
  assert.equal(hasAdminVariantImageDetailsChanged(existing, { storageOptionId: 'storage-1', colorName: 'Black' }), false)
  assert.equal(hasAdminVariantImageDetailsChanged(null, { storageOptionId: 'storage-2', colorName: 'Blue' }), false)
  const savedImages = [{ id: 'image-1' }]
  const changedStorage = { storageOptionId: 'storage-2', colorName: 'Black' }
  const changedColor = { storageOptionId: 'storage-1', colorName: 'Blue' }
  const unchanged = { storageOptionId: 'storage-1', colorName: 'Black' }
  assert.equal(requiresAdminVariantImageReview(existing, changedStorage, savedImages), true)
  assert.equal(requiresAdminVariantImageReview(existing, changedColor, savedImages), true)
  assert.equal(requiresAdminVariantImageReview(existing, changedStorage, []), false)
  assert.equal(hasConfirmedAdminVariantImageReview(existing, changedStorage, savedImages, false), false)
  assert.equal(hasConfirmedAdminVariantImageReview(existing, changedStorage, savedImages, true), true)
  assert.equal(hasConfirmedAdminVariantImageReview(existing, changedColor, savedImages, false), false)
  assert.equal(hasConfirmedAdminVariantImageReview(existing, unchanged, savedImages, false), true)
})

test('no selected images require no Storage or metadata writes', async () => {
  const client = createClient()
  assert.deepEqual(await saveAdminProductImages(client, {
    productId: 'product-1',
    variantId: 'variant-1',
    files: []
  }), [])
  assert.equal(client.uploads.length, 0)
  assert.equal(client.inserts.length, 0)
})

test('multiple uploads preserve product and variant association, order, and primary selection', async () => {
  const client = createClient()
  const progress = []
  const saved = await saveAdminProductImages(client, {
    productId: 'product-1',
    variantId: 'variant-1',
    files: [imageFile('front phone.jpg'), imageFile('back.png', 'image/png')],
    startingOrder: 3,
    primaryFileIndex: 1,
    onProgress: (done, total) => progress.push([done, total])
  })
  assert.equal(client.uploads.length, 2)
  assert.ok(client.uploads.every(({ path }) => path.startsWith('product-1/variant-1/')))
  assert.deepEqual(saved.map(({ product_id, variant_id, sort_order, is_primary }) => ({
    product_id, variant_id, sort_order, is_primary
  })), [
    { product_id: 'product-1', variant_id: 'variant-1', sort_order: 3, is_primary: false },
    { product_id: 'product-1', variant_id: 'variant-1', sort_order: 4, is_primary: true }
  ])
  assert.deepEqual(progress, [[1, 2], [2, 2]])
  assert.deepEqual(client.inserts, [{ rows: saved, options: { onConflict: 'id' } }])
})

test('storage upload failure cleans earlier files and does not create image records', async () => {
  const client = createClient({ uploadFailureAt: 2 })
  await assert.rejects(saveAdminProductImages(client, {
    productId: 'product-1',
    variantId: 'variant-1',
    files: [imageFile('one.jpg'), imageFile('two.jpg')]
  }), /Image upload failed \(two.jpg\): storage denied/)
  assert.equal(client.removals.length, 1)
  assert.equal(client.removals[0].length, 1)
  assert.equal(client.inserts.length, 0)
})

test('database association failure cleans uploaded objects and restores the former primary image', async () => {
  const client = createClient({ insertFailure: { message: 'RLS denied' } })
  await assert.rejects(saveAdminProductImages(client, {
    productId: 'product-1',
    variantId: 'variant-1',
    files: [imageFile('front.jpg')],
    primaryFileIndex: 0,
    existingPrimaryImageId: 'old-image'
  }), /Image association failed: RLS denied/)
  assert.equal(client.removals.length, 1)
  assert.deepEqual(client.updates.map(({ values }) => values), [{ is_primary: false }, { is_primary: true }])
})

test('association retries reuse stable image IDs and Storage paths rather than creating duplicate records', async () => {
  const files = [imageFile('retry.jpg')]
  const failedClient = createClient({ insertFailure: { message: 'temporary database error' } })
  let retryRecords
  await assert.rejects(saveAdminProductImages(failedClient, {
    productId: 'product-1',
    variantId: 'variant-1',
    files
  }), (error) => {
    retryRecords = error.retryRecords
    return /Image association failed/.test(error.message)
  })

  const retryClient = createClient()
  const saved = await saveAdminProductImages(retryClient, {
    productId: 'product-1',
    variantId: 'variant-1',
    files,
    retryRecords
  })
  assert.equal(saved[0].id, retryRecords[0].id)
  assert.equal(saved[0].storage_path, retryRecords[0].storage_path)
  assert.equal(retryClient.inserts[0].options.onConflict, 'id')
})

test('primary selection clears the old image before setting the selected product image', async () => {
  const client = createClient()
  await setAdminProductImagePrimary(
    client,
    { id: 'new-image', product_id: 'product-1' },
    { id: 'old-image', product_id: 'product-1' }
  )
  assert.deepEqual(client.updates.map(({ values, filters }) => ({ values, filters })), [
    { values: { is_primary: false }, filters: [['id', 'old-image'], ['product_id', 'product-1']] },
    { values: { is_primary: true }, filters: [['id', 'new-image'], ['product_id', 'product-1']] }
  ])
})

test('image ordering uses one server-side operation scoped to the product and variant', async () => {
  const client = createClient()
  const images = [
    { id: 'image-b', product_id: 'product-1' },
    { id: 'image-a', product_id: 'product-1' }
  ]
  await reorderAdminProductImages(client, 'product-1', 'variant-1', images)
  assert.deepEqual(client.rpcCalls, [{
    name: 'admin_reorder_product_images',
    args: { p_product_id: 'product-1', p_variant_id: 'variant-1', p_ordered_image_ids: ['image-b', 'image-a'] }
  }])
  assert.equal(client.updates.length, 0)
})

test('failed atomic reorder does not mutate the displayed order and surfaces the RPC error', async () => {
  const client = createClient({ reorderFailure: { message: 'transaction rolled back' } })
  const images = [
    { id: 'image-a', product_id: 'product-1', sort_order: 0 },
    { id: 'image-b', product_id: 'product-1', sort_order: 1 }
  ]
  await assert.rejects(reorderAdminProductImages(client, 'product-1', 'variant-1', images), /transaction rolled back/)
  assert.deepEqual(images.map((image) => image.sort_order), [0, 1])
  assert.equal(client.rpcCalls.length, 1)
  assert.equal(client.updates.length, 0)
  await assert.rejects(reorderAdminProductImages(client, 'product-2', 'variant-1', images), /does not match/)
})

test('image removal deletes metadata before storage and restores metadata when storage removal fails', async () => {
  const image = {
    id: 'image-1',
    product_id: 'product-1',
    variant_id: 'variant-1',
    storage_path: 'product-1/variant-1/image.jpg'
  }
  const client = createClient({ removeFailure: { message: 'storage denied' } })
  await assert.rejects(removeAdminProductImage(client, image), /Image record was restored because storage removal failed/)
  assert.deepEqual(client.deletions, [[['id', 'image-1'], ['product_id', 'product-1']]])
  assert.deepEqual(client.inserts, [image])
  assert.deepEqual(client.removals, [[image.storage_path]])
})

test('failed Storage deletion and failed metadata restoration identify the exact image for safe recovery', async () => {
  const image = {
    id: 'image-2',
    product_id: 'product-2',
    variant_id: 'variant-2',
    storage_path: 'product-2/variant-2/exact-image.jpg'
  }
  const client = createClient({
    removeFailure: { message: 'Storage unavailable' },
    insertFailure: { message: 'Database unavailable' }
  })
  await assert.rejects(removeAdminProductImage(client, image), (error) => {
    assert.match(error.message, /product-images\/product-2\/variant-2\/exact-image\.jpg/)
    assert.match(error.message, /image record ID: image-2/)
    assert.match(error.message, /product ID: product-2/)
    assert.match(error.message, /variant ID: variant-2/)
    assert.match(error.message, /Storage removal failed: Storage unavailable/)
    assert.match(error.message, /Image record restoration also failed: Database unavailable/)
    return true
  })
  assert.deepEqual(client.removals, [[image.storage_path]])
})

test('successful image removal requires metadata deletion and Storage removal to both succeed', async () => {
  const image = {
    id: 'image-3',
    product_id: 'product-3',
    variant_id: 'variant-3',
    storage_path: 'product-3/variant-3/image.jpg'
  }
  const client = createClient()
  await removeAdminProductImage(client, image)
  assert.deepEqual(client.deletions, [[['id', 'image-3'], ['product_id', 'product-3']]])
  assert.deepEqual(client.removals, [[image.storage_path]])
})

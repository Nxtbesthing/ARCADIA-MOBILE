import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchStorefrontCatalog } from '../src/storefront-data.js'

const ids = {
  manufacturer: '10000000-0000-4000-8000-000000000001',
  series: '10000000-0000-4000-8000-000000000002',
  model: '10000000-0000-4000-8000-000000000003',
  storage: '10000000-0000-4000-8000-000000000004',
  category: '10000000-0000-4000-8000-000000000005',
  product: '10000000-0000-4000-8000-000000000006',
  variant: '10000000-0000-4000-8000-000000000007'
}

const liveRows = {
  categories: [{ id: ids.category, name: 'Phones', slug: 'phones', active: true }],
  products: [{ id: ids.product, manufacturer_model_id: ids.model, category_id: ids.category, name: 'Phone', description: '', active: true }],
  product_variants: [{ id: ids.variant, product_id: ids.product, manufacturer_model_id: ids.model, model_storage_option_id: ids.storage, color_name: 'Black', sku: 'PHONE-BLK', stock_quantity: 3, availability: 'active', condition: 'New', original_price: 100, discount_percentage: 12.5, discount_amount: 12.5, final_price: 87.5, warranty: '12 Months', battery_health: 92, ram: '8GB', face_id: 'Working', true_tone: 'Working', display_details: 'Original display', battery_details: 'Healthy', camera_details: 'Working', speaker_details: 'Working', microphone_details: 'Working', charging_details: 'USB-C', sim_details: 'Dual SIM' }],
  product_images: [],
  manufacturer_models: [{ id: ids.model, series_id: ids.series, name: 'Model' }],
  model_storage_options: [{ id: ids.storage, model_id: ids.model, storage_label: '128GB' }],
  model_storage_colors: [{ storage_option_id: ids.storage, color_name: 'Black' }],
  manufacturer_series: [{ id: ids.series, manufacturer_id: ids.manufacturer, name: 'Series' }],
  manufacturers: [{ id: ids.manufacturer, name: 'Brand' }]
}

function createMockClient(rows, errors = {}) {
  const client = {
    from(table) {
      const builder = {
        filters: [],
        rangeStart: 0,
        rangeEnd: Infinity,
        select() { return this },
        eq(column, value) { this.filters.push((row) => row[column] === value); return this },
        in(column, values) { this.filters.push((row) => values.includes(row[column])); return this },
        order() { return this },
        range(from, to) { this.rangeStart = from; this.rangeEnd = to; return this },
        then(resolve, reject) {
          if (errors[table]) return Promise.resolve({ data: null, error: errors[table] }).then(resolve, reject)
          const data = (rows[table] || []).filter((row) => this.filters.every((filter) => filter(row)))
          return Promise.resolve({ data: data.slice(this.rangeStart, this.rangeEnd + 1), error: null }).then(resolve, reject)
        }
      }
      return builder
    },
    storage: {
      from() {
        return { getPublicUrl(path) { return { data: { publicUrl: `https://images.example/${path}` } } } }
      }
    }
  }
  return client
}

const configured = { configured: true, message: '' }

test('returns live state for products with valid variant and catalog mappings', async () => {
  const result = await fetchStorefrontCatalog(createMockClient(liveRows), configured)
  assert.equal(result.status, 'live')
  assert.equal(result.products[0].catalogSource, 'supabase')
  assert.equal(result.products[0].previewOnly, false)
  assert.equal(result.products[0].variants[0].catalogSource, 'supabase')
  assert.equal(result.products[0].variants[0].id, ids.variant)
  assert.deepEqual(
    Object.fromEntries(['batteryHealth', 'ram', 'faceId', 'trueTone', 'display', 'battery', 'camera', 'speaker', 'microphone', 'charging', 'sim'].map((key) => [key, result.products[0].variants[0][key]])),
    { batteryHealth: 92, ram: '8GB', faceId: 'Working', trueTone: 'Working', display: 'Original display', battery: 'Healthy', camera: 'Working', speaker: 'Working', microphone: 'Working', charging: 'USB-C', sim: 'Dual SIM' }
  )
})

test('storefront places the selected primary image before other images within its variant', async () => {
  const rows = {
    ...liveRows,
    product_images: [
      { id: 'image-later', product_id: ids.product, variant_id: ids.variant, storage_path: 'later.jpg', sort_order: 0, is_primary: false },
      { id: 'image-primary', product_id: ids.product, variant_id: ids.variant, storage_path: 'primary.jpg', sort_order: 4, is_primary: true },
      { id: 'image-other-variant', product_id: ids.product, variant_id: 'other-variant', storage_path: 'other.jpg', sort_order: 0, is_primary: false }
    ]
  }
  const result = await fetchStorefrontCatalog(createMockClient(rows), configured)
  assert.deepEqual(result.products[0].variants[0].images, [
    'https://images.example/primary.jpg',
    'https://images.example/later.jpg'
  ])
})

test('returns empty only after successful empty product reads', async () => {
  const result = await fetchStorefrontCatalog(createMockClient({ categories: liveRows.categories, products: [] }), configured)
  assert.equal(result.status, 'empty')
  assert.deepEqual(result.products, [])
  assert.equal(result.categories.length, 1)
})

test('marks products incomplete when their required storage color mapping is missing', async () => {
  const rows = { ...liveRows, model_storage_colors: [] }
  const result = await fetchStorefrontCatalog(createMockClient(rows), configured)
  assert.equal(result.status, 'incomplete')
  assert.deepEqual(result.products, [])
  assert.match(result.message, /incomplete|missing/i)
})

test('returns safe error state when a Supabase query fails', async () => {
  const result = await fetchStorefrontCatalog(createMockClient(liveRows, {
    products: { code: 'PGRST000', message: 'do not expose this database detail' }
  }), configured)
  assert.equal(result.status, 'error')
  assert.equal(result.message, 'Live inventory could not be loaded.')
  assert.equal(JSON.stringify(result).includes('do not expose'), false)
})

test('returns unconfigured state without calling a Supabase client', async () => {
  const result = await fetchStorefrontCatalog(null, { configured: false, message: 'Supabase configuration is invalid.' })
  assert.equal(result.status, 'unconfigured')
  assert.equal(result.message, 'Supabase configuration is invalid.')
})
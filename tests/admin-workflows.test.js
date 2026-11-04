import test from 'node:test'
import assert from 'node:assert/strict'
import {
  listAdminOrders,
  listAdminRepairRequests,
  manageAdminCatalogItem,
  saveAdminInventoryItem,
  setAdminProductActive,
  setAdminVariantActive,
  updateAdminOrder,
  updateAdminRepairRequest
} from '../src/admin-workflows.js'

test('inventory writes call the prepared atomic RPC with its exact parameter names', async () => {
  let call
  const client = {
    async rpc(name, args) {
      call = { name, args }
      return { data: [{ saved_product_id: 'product-1', saved_variant_id: 'variant-1' }], error: null }
    }
  }
  await saveAdminInventoryItem(client, {
    productId: null,
    variantId: null,
    name: 'Phone',
    description: 'Description',
    categoryId: 'category-1',
    modelId: 'model-1',
    storageOptionId: 'storage-1',
    colorName: 'Black',
    sku: 'PHONE-BLK',
    stockQuantity: 3,
    availability: 'active',
    condition: 'New',
    originalPrice: 100,
    discountPercentage: 10,
    warranty: '12 months',
    role: 'admin'
  })
  assert.equal(call.name, 'admin_save_inventory_item_full')
  assert.deepEqual(call.args, {
    p_product_id: null,
    p_variant_id: null,
    p_name: 'Phone',
    p_description: 'Description',
    p_category_id: 'category-1',
    p_model_id: 'model-1',
    p_storage_option_id: 'storage-1',
    p_color_name: 'Black',
    p_sku: 'PHONE-BLK',
    p_stock_quantity: 3,
    p_availability: 'active',
    p_condition: 'New',
    p_original_price: 100,
    p_discount_percentage: 10,
    p_warranty: '12 months',
    p_battery_health: null,
    p_ram: null,
    p_face_id: null,
    p_true_tone: null,
    p_display_details: null,
    p_battery_details: null,
    p_camera_details: null,
    p_speaker_details: null,
    p_microphone_details: null,
    p_charging_details: null,
    p_sim_details: null,
    p_notes: null
  })
})

test('repair queue uses only the admin-authorized queue RPC and reports denied access', async () => {
  let call
  const requests = [{ id: 'repair-1', communication_notes: 'staff only' }]
  const result = await listAdminRepairRequests({
    async rpc(name, args) {
      call = { name, args }
      if (name === 'admin_list_repair_requests') return { data: requests, error: null }
      return { data: [{ repair_id: 'repair-1', diagnosis: 'Screen damage' }], error: null }
    }
  })
  assert.deepEqual(result, [{ ...requests[0], diagnosis: 'Screen damage' }])
  assert.deepEqual(call, { name: 'admin_list_repair_diagnoses', args: { p_repair_ids: ['repair-1'] } })
  await assert.rejects(
    listAdminRepairRequests({ rpc: async () => ({ data: null, error: { message: 'denied' } }) }),
    (error) => error.message === 'denied'
  )
})

test('repair management updates only staff-controlled fields', async () => {
  let call
  await updateAdminRepairRequest({ async rpc(name, args) { call = { name, args }; return { data: true, error: null } } }, 'repair-1', {
    status: 'diagnosing',
    contacted: true,
    repairCost: '25.50',
    communicationNotes: 'Contacted customer',
    diagnosis: 'Screen requires replacement',
    customerEmail: 'must not be written'
  })
  assert.deepEqual(call, {
    name: 'admin_update_repair_request',
    args: {
      p_repair_id: 'repair-1',
      p_status: 'diagnosing',
      p_contacted: true,
      p_repair_cost: 25.5,
      p_communication_notes: 'Contacted customer',
      p_diagnosis: 'Screen requires replacement'
    }
  })
})

test('order administration limits updates to authorized status columns and validates enum values', async () => {
  let update
  const builder = {
    update(value) { update = value; return this },
    eq() { return this },
    select() { return this },
    async maybeSingle() { return { data: { id: 'order-1' }, error: null } }
  }
  const client = { from(table) { assert.equal(table, 'orders'); return builder } }
  await updateAdminOrder(client, 'order-1', { status: 'confirmed', paymentStatus: 'awaiting_confirmation', total: 0 })
  assert.deepEqual(update, { status: 'confirmed', payment_status: 'awaiting_confirmation' })
  await assert.rejects(updateAdminOrder(client, 'order-1', { status: 'invalid', paymentStatus: 'pending' }), /valid order/)
})

test('admin order queue returns only signed links for private payment proofs', async () => {
  const order = { id: 'order-1', payment_proof_path: 'user-1/order-1/proof.png' }
  const client = {
    from(table) {
      if (table === 'orders') {
        return {
          select(columns) {
            assert.match(columns, /payment_proof_path/)
            return this
          },
          order() { return this },
          async limit() { return { data: [order], error: null } }
        }
      }
      assert.equal(table, 'order_items')
      return {
        select() { return this },
        async in() { return { data: [], error: null } }
      }
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, 'payment-proofs')
        return {
          async createSignedUrl(path, expiresIn) {
            assert.equal(path, order.payment_proof_path)
            assert.equal(expiresIn, 3600)
            return { data: { signedUrl: 'https://private.example/proof' }, error: null }
          }
        }
      }
    }
  }
  const result = await listAdminOrders(client)
  assert.equal(result.orders[0].payment_proof_url, 'https://private.example/proof')
})

test('catalog management uses non-destructive save and rename actions', async () => {
  let call
  await manageAdminCatalogItem({
    async rpc(name, args) {
      call = { name, args }
      return { data: 'storage-1', error: null }
    }
  }, {
    entity: 'color',
    action: 'rename_color',
    parentId: 'storage-1',
    oldName: 'Midnight',
    name: 'Midnight Blue'
  })
  assert.deepEqual(call, {
    name: 'admin_manage_catalog_item',
    args: {
      p_entity: 'color',
      p_action: 'rename_color',
      p_id: null,
      p_parent_id: 'storage-1',
      p_name: 'Midnight Blue',
      p_ram_options: [],
      p_verified: false,
      p_old_name: 'Midnight'
    }
  })
  let called = false
  await assert.rejects(
    manageAdminCatalogItem({ rpc: async () => { called = true } }, { entity: 'model', action: 'delete' }),
    /only supports adding or editing/
  )
  assert.equal(called, false)
})

test('product and variant removal is represented only by active-state RPCs', async () => {
  const calls = []
  const client = {
    async rpc(name, args) {
      calls.push({ name, args })
      return { data: true, error: null }
    }
  }
  await setAdminProductActive(client, 'product-1', false)
  await setAdminVariantActive(client, 'variant-1', false)
  assert.deepEqual(calls, [
    { name: 'admin_set_product_active', args: { p_product_id: 'product-1', p_active: false } },
    { name: 'admin_set_product_variant_active', args: { p_variant_id: 'variant-1', p_active: false } }
  ])
})

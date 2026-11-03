import test from 'node:test'
import assert from 'node:assert/strict'
import {
  listAdminRepairRequests,
  saveAdminInventoryItem,
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
  assert.equal(call.name, 'admin_save_inventory_item')
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
    p_warranty: '12 months'
  })
})

test('repair queue uses only the admin-authorized queue RPC and reports denied access', async () => {
  let call
  const requests = [{ id: 'repair-1', communication_notes: 'staff only' }]
  const result = await listAdminRepairRequests({
    async rpc(name, args) { call = { name, args }; return { data: requests, error: null } }
  })
  assert.deepEqual(result, requests)
  assert.deepEqual(call, { name: 'admin_list_repair_requests', args: { p_limit: 50, p_offset: 0 } })
  await assert.rejects(
    listAdminRepairRequests({ rpc: async () => ({ data: null, error: { message: 'denied' } }) }),
    (error) => error.message === 'denied'
  )
})

test('repair management updates only staff-controlled fields', async () => {
  let update
  const builder = {
    update(value) { update = value; return this },
    eq() { return this },
    select() { return this },
    async maybeSingle() { return { data: { id: 'repair-1' }, error: null } }
  }
  const client = { from(table) { assert.equal(table, 'repair_requests'); return builder } }
  await updateAdminRepairRequest(client, 'repair-1', {
    status: 'diagnosing',
    contacted: true,
    repairCost: '25.50',
    communicationNotes: 'Contacted customer',
    customerEmail: 'must not be written'
  })
  assert.deepEqual(update, {
    status: 'diagnosing',
    contacted: true,
    repair_cost: 25.5,
    communication_notes: 'Contacted customer'
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

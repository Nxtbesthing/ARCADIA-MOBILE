import test from 'node:test'
import assert from 'node:assert/strict'
import { placeArcadiaOrder } from '../src/orders.js'

test('checkout uses the existing server-authoritative order RPC and sends variant quantities only', async () => {
  let call
  const client = {
    async rpc(name, args) {
      call = { name, args }
      return { data: { order_number: 'ARC-2026-100', status: 'pending', payment_status: 'pending', grand_total: 250 }, error: null }
    }
  }
  const response = await placeArcadiaOrder(client, {
    items: [{ variantId: 'variant-1', quantity: 2, price: 1, total: 2 }],
    deliveryMethod: 'pickup',
    customerName: 'Ada Lovelace',
    customerPhone: '555-0100'
  })
  assert.equal(call.name, 'place_arcadia_order')
  assert.deepEqual(call.args, {
    p_items: [{ variant_id: 'variant-1', quantity: 2 }],
    p_delivery_method: 'pickup',
    p_delivery_state: null,
    p_delivery_city: null,
    p_delivery_address: null,
    p_customer_name: 'Ada Lovelace',
    p_customer_phone: '555-0100'
  })
  assert.equal(response.payment_status, 'pending')
})

test('order RPC failures are surfaced safely', async () => {
  await assert.rejects(
    placeArcadiaOrder({ rpc: async () => ({ data: null, error: { code: '42501', message: 'private detail' } }) }, { items: [] }),
    (error) => error.message.includes('Sign in') && !error.message.includes('private detail')
  )
  await assert.rejects(
    placeArcadiaOrder({ rpc: async () => ({ data: null, error: null }) }, { items: [] }),
    /order could not be placed/i
  )
})

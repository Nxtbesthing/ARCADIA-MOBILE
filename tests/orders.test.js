import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  loadArcadiaOrderItems,
  placeArcadiaOrder,
  sendArcadiaOrderNotification,
  uploadArcadiaPaymentProof
} from '../src/orders.js'

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

test('receipt items are loaded from the saved order, not client cart prices', async () => {
  const savedItems = [{ product_name: 'Phone', quantity: 2, line_total: 250 }]
  const client = {
    from(table) {
      assert.equal(table, 'order_items')
      return {
        select(columns) {
          assert.match(columns, /final_unit_price,line_total/)
          return this
        },
        eq(column, value) {
          assert.deepEqual([column, value], ['order_id', 'order-1'])
          return this
        },
        async order(column) {
          assert.equal(column, 'created_at')
          return { data: savedItems, error: null }
        }
      }
    }
  }
  assert.deepEqual(await loadArcadiaOrderItems(client, 'order-1'), savedItems)
})

test('order notification invokes the server-side sender and surfaces provider failures', async () => {
  let invocation
  await sendArcadiaOrderNotification({
    functions: {
      async invoke(name, options) {
        invocation = { name, options }
        return { error: null }
      }
    }
  }, 'order-1')
  assert.deepEqual(invocation, { name: 'send-order-notification', options: { body: { order_id: 'order-1' } } })
  await assert.rejects(
    sendArcadiaOrderNotification({ functions: { invoke: async () => ({ error: new Error('provider detail') }) } }, 'order-1'),
    /notification email could not be sent/i
  )
})

test('payment proof uploads are limited and linked through an owner-scoped RPC', async () => {
  const calls = []
  const bucket = {
    async upload(path, file, options) {
      calls.push({ type: 'upload', path, file, options })
      return { error: null }
    },
    async remove(paths) {
      calls.push({ type: 'remove', paths })
      return { error: null }
    }
  }
  const client = {
    storage: { from(name) { assert.equal(name, 'payment-proofs'); return bucket } },
    async rpc(name, args) {
      calls.push({ type: 'rpc', name, args })
      return { data: true, error: null }
    }
  }
  await uploadArcadiaPaymentProof(client, 'user-1', 'order-1', { type: 'image/png', size: 1024, name: 'transfer.png' })
  assert.equal(calls[0].type, 'upload')
  assert.match(calls[0].path, /^user-1\/order-1\/[0-9a-f-]+\.png$/i)
  assert.equal(calls[0].options.upsert, false)
  assert.deepEqual(calls[1], {
    type: 'rpc',
    name: 'attach_arcadia_payment_proof',
    args: { p_order_id: 'order-1', p_storage_path: calls[0].path }
  })
  await assert.rejects(
    uploadArcadiaPaymentProof(client, 'user-1', 'order-1', { type: 'image/svg+xml', size: 10 }),
    /JPEG, PNG, or WebP/
  )
  assert.equal(calls.length, 2)
})

test('failed proof association removes the unlinked uploaded file', async () => {
  const removed = []
  const client = {
    storage: {
      from() {
        return {
          upload: async () => ({ error: null }),
          remove: async (paths) => { removed.push(paths); return { error: null } }
        }
      }
    },
    rpc: async () => ({ data: false, error: null })
  }
  await assert.rejects(
    uploadArcadiaPaymentProof(client, 'user-1', 'order-1', { type: 'image/jpeg', size: 1024 }),
    /could not be associated/
  )
  assert.equal(removed.length, 1)
  assert.match(removed[0][0], /^user-1\/order-1\//)
})

test('checkout receipt, WhatsApp link, admin confirmation, and private proof setup are wired', async () => {
  const app = await readFile(new URL('../script.js', import.meta.url), 'utf8')
  const admin = await readFile(new URL('../src/admin-inventory.js', import.meta.url), 'utf8')
  const migration = await readFile(new URL('../supabase/migrations/20261104120000_order_payment_proofs.sql', import.meta.url), 'utf8')
  const emailFunction = await readFile(new URL('../supabase/functions/send-order-notification/index.ts', import.meta.url), 'utf8')
  assert.match(app, /YOUR ARCADIA RECEIPT/)
  assert.match(app, /SEND ORDER VIA WHATSAPP/)
  assert.match(app, /wa\.me\/\$\{whatsappNumber\}/)
  assert.match(app, /UPLOAD PAYMENT PROOF/)
  assert.match(app, /8020376702 · Oliver Latnie/)
  assert.match(app, /8020376702 · Oliver Buenyen/)
  assert.match(admin, /VIEW PAYMENT PROOF/)
  assert.match(admin, /data-si-confirm-payment/)
  assert.match(migration, /VALUES \(\s*'payment-proofs',\s*'payment-proofs',\s*false,\s*5242880/s)
  assert.match(migration, /split_part\(name, '\/', 1\) = \(SELECT auth\.uid\(\)\)::text/)
  assert.match(migration, /order_record\.user_id = \(SELECT auth\.uid\(\)\)/)
  assert.match(emailFunction, /Deno\.env\.get\("RESEND_API_KEY"\)/)
  assert.match(emailFunction, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(emailFunction, /arcadiamobile24@gmail\.com/)
  assert.doesNotMatch(app, /RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY/)
})

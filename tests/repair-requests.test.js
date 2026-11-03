import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRepairRequestArguments, submitRepairRequest } from '../src/repair-requests.js'

test('repair submission sends only customer-controlled fields to the prepared RPC', async () => {
  let call
  const client = {
    async rpc(name, args) {
      call = { name, args }
      return { data: [{ ticket_number: 'REP-2026-ABC', status: 'requested', created_at: '2026-11-03T00:00:00Z' }], error: null }
    }
  }
  const result = await submitRepairRequest(client, {
    customerName: ' Ada ',
    customerPhone: ' 555 0100 ',
    customerEmail: ' ADA@EXAMPLE.COM ',
    device: ' Phone ',
    deviceDetails: ' Model X ',
    problem: ' Screen ',
    description: ' Details ',
    preferredDate: '2026-11-04',
    status: 'completed',
    contacted: true,
    repairCost: 1,
    communicationNotes: 'forged',
    userId: 'another-user',
    ticketNumber: 'forged'
  })
  assert.equal(call.name, 'submit_repair_request')
  assert.deepEqual(call.args, {
    p_customer_name: 'Ada',
    p_customer_phone: '555 0100',
    p_customer_email: 'ada@example.com',
    p_device: 'Phone',
    p_device_details: 'Model X',
    p_problem: 'Screen',
    p_description: 'Details',
    p_preferred_date: '2026-11-04'
  })
  assert.equal(result.ticket_number, 'REP-2026-ABC')
})

test('optional repair fields become null and untrusted staff fields are never included', () => {
  assert.deepEqual(buildRepairRequestArguments({ customerName: 'A', description: '', preferredDate: '' }), {
    p_customer_name: 'A',
    p_customer_phone: '',
    p_customer_email: '',
    p_device: '',
    p_device_details: '',
    p_problem: '',
    p_description: null,
    p_preferred_date: null
  })
})

test('repair RPC errors and malformed responses are reported without backend details', async () => {
  await assert.rejects(
    submitRepairRequest({ rpc: async () => ({ data: null, error: { code: '22023', message: 'secret database detail' } }) }, {}),
    (error) => error.message === 'Check the repair form fields and try again.' && !error.message.includes('secret')
  )
  await assert.rejects(
    submitRepairRequest({ rpc: async () => ({ data: [], error: null }) }, {}),
    /Repair request could not be submitted/
  )
})

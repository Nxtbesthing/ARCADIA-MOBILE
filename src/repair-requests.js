function safeRepairError(code) {
  if (code === '22023') return 'Check the repair form fields and try again.'
  if (code === '42501') return 'This repair request could not be authorized. Please sign in again and retry.'
  return 'Repair request could not be submitted. Please try again.'
}

export function buildRepairRequestArguments(fields) {
  return {
    p_customer_name: String(fields.customerName || '').trim(),
    p_customer_phone: String(fields.customerPhone || '').trim(),
    p_customer_email: String(fields.customerEmail || '').trim().toLowerCase(),
    p_device: String(fields.device || '').trim(),
    p_device_details: String(fields.deviceDetails || '').trim(),
    p_problem: String(fields.problem || '').trim(),
    p_description: String(fields.description || '').trim() || null,
    p_preferred_date: String(fields.preferredDate || '') || null
  }
}

export async function submitRepairRequest(client, fields) {
  const { data, error } = await client.rpc('submit_repair_request', buildRepairRequestArguments(fields))
  if (error) throw new Error(safeRepairError(error.code))

  const result = Array.isArray(data) ? data[0] : null
  if (!result?.ticket_number || !result?.status || !result?.created_at) {
    throw new Error('Repair request could not be submitted. Please try again.')
  }
  return result
}

export function repairStatusErrorMessage() {
  return 'Repair status could not be loaded. Please try again.'
}

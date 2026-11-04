const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded']
const REPAIR_STATUSES = ['requested', 'received', 'diagnosing', 'awaiting_approval', 'repairing', 'testing', 'ready', 'completed', 'cancelled']

function firstRpcRow(data, message) {
  const row = Array.isArray(data) ? data[0] : null
  if (!row) throw new Error(message)
  return row
}

export async function saveAdminInventoryItem(client, values) {
  const { data, error } = await client.rpc('admin_save_inventory_item_full', {
    p_product_id: values.productId || null,
    p_variant_id: values.variantId || null,
    p_name: values.name,
    p_description: values.description || null,
    p_category_id: values.categoryId,
    p_model_id: values.modelId,
    p_storage_option_id: values.storageOptionId,
    p_color_name: values.colorName,
    p_sku: values.sku,
    p_stock_quantity: values.stockQuantity,
    p_availability: values.availability,
    p_condition: values.condition,
    p_original_price: values.originalPrice,
    p_discount_percentage: values.discountPercentage,
    p_warranty: values.warranty,
    p_battery_health: values.batteryHealth === '' || values.batteryHealth == null ? null : Number(values.batteryHealth),
    p_ram: values.ram || null,
    p_face_id: values.faceId || null,
    p_true_tone: values.trueTone || null,
    p_display_details: values.displayDetails || null,
    p_battery_details: values.batteryDetails || null,
    p_camera_details: values.cameraDetails || null,
    p_speaker_details: values.speakerDetails || null,
    p_microphone_details: values.microphoneDetails || null,
    p_charging_details: values.chargingDetails || null,
    p_sim_details: values.simDetails || null,
    p_notes: values.notes || null
  })
  if (error) throw error
  return firstRpcRow(data, 'Inventory could not be saved. Please try again.')
}

export async function listAdminRepairRequests(client, limit = 50, offset = 0) {
  const { data, error } = await client.rpc('admin_list_repair_requests', {
    p_limit: limit,
    p_offset: offset
  })
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Repair queue could not be loaded. Please try again.')
  if (!data.length) return data
  const { data: details, error: detailsError } = await client.rpc('admin_list_repair_diagnoses', {
    p_repair_ids: data.map((repair) => repair.id)
  })
  if (detailsError) throw detailsError
  if (!Array.isArray(details)) throw new Error('Repair diagnoses could not be loaded. Please try again.')
  const diagnosisById = new Map(details.map((item) => [item.repair_id, item.diagnosis]))
  return data.map((repair) => ({ ...repair, diagnosis: diagnosisById.get(repair.id) || '' }))
}

export async function updateAdminRepairRequest(client, repairId, values) {
  if (!REPAIR_STATUSES.includes(values.status)) throw new Error('Choose a valid repair status.')
  const cost = values.repairCost === '' || values.repairCost == null ? null : Number(values.repairCost)
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) throw new Error('Repair cost must be zero or greater.')

  const { data, error } = await client.rpc('admin_update_repair_request', {
    p_repair_id: repairId,
    p_status: values.status,
    p_contacted: Boolean(values.contacted),
    p_repair_cost: cost,
    p_communication_notes: String(values.communicationNotes || '').trim() || null,
    p_diagnosis: String(values.diagnosis || '').trim() || null
  })
  if (error) throw error
  if (data !== true) throw new Error('Repair request was not updated.')
  return data
}

export async function manageAdminCatalogItem(client, values) {
  const entities = ['manufacturer', 'series', 'model', 'storage', 'color']
  if (!entities.includes(values.entity) || !['save', 'rename_color'].includes(values.action)) {
    throw new Error('Catalog management only supports adding or editing entries.')
  }
  if (values.action === 'rename_color' && values.entity !== 'color') {
    throw new Error('Only catalog colors can be renamed.')
  }
  const { data, error } = await client.rpc('admin_manage_catalog_item', {
    p_entity: values.entity,
    p_action: values.action,
    p_id: values.id || null,
    p_parent_id: values.parentId || null,
    p_name: values.name || null,
    p_ram_options: values.ramOptions || [],
    p_verified: Boolean(values.verified),
    p_old_name: values.oldName || null
  })
  if (error) throw error
  if (typeof data !== 'string') throw new Error('Catalog update could not be confirmed.')
  return data
}

export async function setAdminProductActive(client, productId, active) {
  const { data, error } = await client.rpc('admin_set_product_active', {
    p_product_id: productId,
    p_active: Boolean(active)
  })
  if (error) throw error
  if (data !== true) throw new Error('Product status update could not be confirmed.')
}

export async function setAdminVariantActive(client, variantId, active) {
  const { data, error } = await client.rpc('admin_set_product_variant_active', {
    p_variant_id: variantId,
    p_active: Boolean(active)
  })
  if (error) throw error
  if (data !== true) throw new Error('Variant status update could not be confirmed.')
}

export async function listAdminOrders(client) {
  const { data: orders, error } = await client.from('orders')
    .select('id,order_number,status,payment_status,payment_method,subtotal,discount_total,delivery_fee,grand_total,delivery_method,delivery_state,delivery_city,delivery_address,customer_name,customer_phone,customer_email,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error

  const orderIds = (orders || []).map((order) => order.id)
  if (!orderIds.length) return { orders: [], items: [] }

  const { data: items, error: itemsError } = await client.from('order_items')
    .select('id,order_id,product_name,variant_description,sku,quantity,unit_price,discount_amount,final_unit_price,warranty,line_total')
    .in('order_id', orderIds)
  if (itemsError) throw itemsError
  return { orders: orders || [], items: items || [] }
}

export async function updateAdminOrder(client, orderId, values) {
  if (!ORDER_STATUSES.includes(values.status) || !PAYMENT_STATUSES.includes(values.paymentStatus)) {
    throw new Error('Choose a valid order and payment status.')
  }
  const { data, error } = await client.from('orders')
    .update({ status: values.status, payment_status: values.paymentStatus })
    .eq('id', orderId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Order was not updated.')
  return data
}

export { ORDER_STATUSES, PAYMENT_STATUSES, REPAIR_STATUSES }

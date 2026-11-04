const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded']
const REPAIR_STATUSES = ['requested', 'received', 'diagnosing', 'awaiting_approval', 'repairing', 'testing', 'ready', 'completed', 'cancelled']

function firstRpcRow(data, message) {
  const row = Array.isArray(data) ? data[0] : null
  if (!row) throw new Error(message)
  return row
}

export function validateAdminProductImages(files) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  for (const file of files) {
    if (!file || !allowedTypes.includes(file.type) || file.size <= 0 || file.size > 10485760) {
      throw new Error('Choose JPEG, PNG, WebP, or AVIF images no larger than 10 MB each.')
    }
  }
}

export async function saveAdminProductImages(client, {
  productId,
  variantId,
  files,
  startingOrder = 0,
  primaryFileIndex = null,
  existingPrimaryImageId = null,
  retryRecords = null,
  onProgress = () => {}
}) {
  validateAdminProductImages(files)
  if (!productId || !variantId) throw new Error('Save the product and variant before uploading images.')
  if (!files.length) return []
  if (primaryFileIndex !== null && (!Number.isInteger(primaryFileIndex) || primaryFileIndex < 0 || primaryFileIndex >= files.length)) {
    throw new Error('Choose a valid primary image.')
  }
  if (!Number.isInteger(startingOrder) || startingOrder < 0) throw new Error('Image order must be zero or greater.')

  const bucket = client.storage.from('product-images')
  const uploadedPaths = []
  const records = retryRecords || files.map((file, index) => {
    const safeName = file.name.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100) || 'image'
    return {
      id: crypto.randomUUID(),
      product_id: productId,
      variant_id: variantId,
      storage_path: `${productId}/${variantId}/${crypto.randomUUID()}-${safeName}`,
      alt_text: file.name || null,
      sort_order: startingOrder + index,
      is_primary: primaryFileIndex === index
    }
  })
  if (records.length !== files.length || records.some((record) =>
    record.product_id !== productId || record.variant_id !== variantId
  )) {
    throw new Error('Pending image retry data does not match the selected product and variant.')
  }

  try {
    for (let index = 0; index < files.length; index += 1) {
      const { error } = await bucket.upload(records[index].storage_path, files[index], {
        contentType: files[index].type,
        cacheControl: '3600',
        upsert: true
      })
      if (error) throw new Error(`Image upload failed (${files[index].name}): ${error.message || 'Storage rejected the file.'}`)
      uploadedPaths.push(records[index].storage_path)
      onProgress(index + 1, files.length)
    }

    if (primaryFileIndex !== null && existingPrimaryImageId) {
      const { error } = await client.from('product_images')
        .update({ is_primary: false })
        .eq('id', existingPrimaryImageId)
        .eq('product_id', productId)
      if (error) throw new Error(`Could not change the primary image: ${error.message || 'Database update failed.'}`)
    }

    const { error } = await client.from('product_images').upsert(records, { onConflict: 'id' })
    if (error) throw new Error(`Image association failed: ${error.message || 'Database insert failed.'}`)
    return records
  } catch (error) {
    const cleanupErrors = []
    if (uploadedPaths.length) {
      try {
        const { error: cleanupError } = await bucket.remove(uploadedPaths)
        if (cleanupError) cleanupErrors.push(cleanupError.message || 'Storage cleanup failed.')
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError.message || 'Storage cleanup failed.')
      }
    }
    if (primaryFileIndex !== null && existingPrimaryImageId) {
      const { error: restoreError } = await client.from('product_images')
        .update({ is_primary: true })
        .eq('id', existingPrimaryImageId)
        .eq('product_id', productId)
      if (restoreError) cleanupErrors.push(`Could not restore the previous primary image: ${restoreError.message || 'Database update failed.'}`)
    }
    if (cleanupErrors.length) {
      const failure = new Error(`${error.message} Cleanup also failed: ${cleanupErrors.join(' ')}`)
      failure.retryRecords = records
      throw failure
    }
    if (error instanceof Error) error.retryRecords = records
    throw error
  }
}

export async function setAdminProductImagePrimary(client, image, previousPrimary) {
  if (!image?.id || !image.product_id) throw new Error('Choose a valid product image.')
  if (previousPrimary?.id && previousPrimary.id !== image.id) {
    const { error } = await client.from('product_images')
      .update({ is_primary: false })
      .eq('id', previousPrimary.id)
      .eq('product_id', image.product_id)
    if (error) throw error
  }
  const { data, error } = await client.from('product_images')
    .update({ is_primary: true })
    .eq('id', image.id)
    .eq('product_id', image.product_id)
    .select('id')
    .maybeSingle()
  if (error || !data) {
    if (previousPrimary?.id && previousPrimary.id !== image.id) {
      const { error: restoreError } = await client.from('product_images')
        .update({ is_primary: true })
        .eq('id', previousPrimary.id)
        .eq('product_id', image.product_id)
      if (restoreError) throw new Error(`${error?.message || 'Primary image update was not confirmed.'} The previous primary image could not be restored: ${restoreError.message}`)
    }
    throw error || new Error('Primary image update was not confirmed.')
  }
}

export async function reorderAdminProductImages(client, productId, variantId, images) {
  if (!productId || !variantId || images.some((image) =>
    image.product_id !== productId || (image.variant_id && image.variant_id !== variantId)
  )) {
    throw new Error('Image order does not match the selected product and variant.')
  }
  const { data, error } = await client.rpc('admin_reorder_product_images', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_ordered_image_ids: images.map((image) => image.id)
  })
  if (error) throw new Error(`Image order update failed: ${error.message}`)
  if (data !== true) throw new Error('Image order update could not be confirmed.')
}

export async function loadAdminProductImages(client, productId) {
  const { data, error } = await client.from('product_images')
    .select('id,product_id,variant_id,storage_path,alt_text,sort_order,is_primary')
    .eq('product_id', productId)
    .order('sort_order')
  if (error) throw new Error(`Saved image order could not be refreshed: ${error.message}`)
  if (!Array.isArray(data)) throw new Error('Saved image order could not be refreshed.')
  return data
}

export function hasAdminVariantImageDetailsChanged(existingVariant, nextDetails) {
  return Boolean(existingVariant && (
    String(existingVariant.model_storage_option_id) !== String(nextDetails.storageOptionId)
    || existingVariant.color_name !== nextDetails.colorName
  ))
}

export function requiresAdminVariantImageReview(existingVariant, nextDetails, images) {
  return images.length > 0 && hasAdminVariantImageDetailsChanged(existingVariant, nextDetails)
}

export function hasConfirmedAdminVariantImageReview(existingVariant, nextDetails, images, confirmed) {
  return !requiresAdminVariantImageReview(existingVariant, nextDetails, images) || confirmed
}

export function resolveAdminVariantAvailability(visibility, stockQuantity) {
  if (visibility === 'hidden') return 'hidden'
  return Number(stockQuantity) === 0 ? 'out_of_stock' : 'active'
}

export async function removeAdminProductImage(client, image) {
  const { data: deleted, error: metadataError } = await client.from('product_images')
    .delete()
    .eq('id', image.id)
    .eq('product_id', image.product_id)
    .select('id')
    .maybeSingle()
  if (metadataError) throw metadataError
  if (!deleted) throw new Error('Image record was not removed; the stored file was left untouched.')

  const bucket = client.storage.from('product-images')
  let storageError
  try {
    const result = await bucket.remove([image.storage_path])
    storageError = result.error
  } catch (error) {
    storageError = error
  }
  if (storageError) {
    const { error: restoreError } = await client.from('product_images').insert(image)
    if (restoreError) {
      throw new Error(
        `Image removal needs administrator recovery. Storage object: product-images/${image.storage_path}; image record ID: ${image.id}; product ID: ${image.product_id}; variant ID: ${image.variant_id || 'none'}. ` +
        `Storage removal failed: ${storageError.message}. Image record restoration also failed: ${restoreError.message}. ` +
        'The object may still exist. Verify these identifiers, then restore this exact product_images record or remove only this exact Storage object. Do not remove other objects.'
      )
    }
    throw new Error(`Image record was restored because storage removal failed: ${storageError.message}`)
  }
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

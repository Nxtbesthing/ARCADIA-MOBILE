function safeOrderError(code) {
  if (code === '42501') return 'Sign in to your customer account before placing an order.'
  if (code === '22023') return 'Review your cart and delivery details, then try again.'
  return 'The order could not be placed. Please try again.'
}

const PAYMENT_PROOF_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
])
const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024

export async function placeArcadiaOrder(client, checkout) {
  const { data, error } = await client.rpc('place_arcadia_order', {
    p_items: checkout.items.map((item) => ({
      variant_id: String(item.variantId),
      quantity: Number(item.quantity)
    })),
    p_delivery_method: checkout.deliveryMethod,
    p_delivery_state: checkout.deliveryState || null,
    p_delivery_city: checkout.deliveryCity || null,
    p_delivery_address: checkout.deliveryAddress || null,
    p_customer_name: String(checkout.customerName || '').trim(),
    p_customer_phone: String(checkout.customerPhone || '').trim()
  })

  if (error) throw new Error(safeOrderError(error.code))
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.order_number) {
    throw new Error('The order could not be placed. Please try again.')
  }
  return data
}

export async function loadArcadiaOrderItems(client, orderId) {
  const { data, error } = await client.from('order_items')
    .select('product_name,variant_description,sku,quantity,unit_price,discount_amount,final_unit_price,line_total,warranty')
    .eq('order_id', orderId)
    .order('created_at')
  if (error) throw new Error('The order was placed, but its receipt items could not be loaded.')
  if (!Array.isArray(data)) throw new Error('The order was placed, but its receipt items could not be loaded.')
  return data
}

export async function sendArcadiaOrderNotification(client, orderId) {
  const { error } = await client.functions.invoke('send-order-notification', {
    body: { order_id: orderId }
  })
  if (error) throw new Error('Order notification email could not be sent.')
}

export async function uploadArcadiaPaymentProof(client, userId, orderId, file) {
  const extension = PAYMENT_PROOF_TYPES.get(file?.type)
  if (!extension || !Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PAYMENT_PROOF_BYTES) {
    throw new Error('Choose a JPEG, PNG, or WebP screenshot no larger than 5 MB.')
  }
  if (!userId || !orderId) throw new Error('Sign in and select a valid order before uploading proof.')

  const path = `${userId}/${orderId}/${crypto.randomUUID()}.${extension}`
  const bucket = client.storage.from('payment-proofs')
  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false
  })
  if (uploadError) throw new Error('Payment proof could not be uploaded. Please try again.')

  try {
    const { data, error } = await client.rpc('attach_arcadia_payment_proof', {
      p_order_id: orderId,
      p_storage_path: path
    })
    if (error || data !== true) throw new Error('Payment proof could not be associated with this order.')
    return path
  } catch (error) {
    try {
      const { error: cleanupError } = await bucket.remove([path])
      if (cleanupError) throw cleanupError
    } catch (cleanupError) {
      throw new Error('Payment proof association failed and the uploaded file could not be removed. Contact Arcadia support.')
    }
    throw error
  }
}

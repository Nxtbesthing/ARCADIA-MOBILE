function safeOrderError(code) {
  if (code === '42501') return 'Sign in to your customer account before placing an order.'
  if (code === '22023') return 'Review your cart and delivery details, then try again.'
  return 'The order could not be placed. Please try again.'
}

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

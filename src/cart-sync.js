import { canPurchaseVariant, createPurchasableCartItem } from './catalog-state.js'

function isPurchasableItem(item) {
  return Boolean(item?.variantId && canPurchaseVariant(item, {
    id: item.variantId,
    catalogSource: item.catalogSource,
    previewOnly: item.previewOnly
  }))
}

export async function syncAuthenticatedCartItem(client, userId, item, remove = false) {
  if (!client || !userId || !isPurchasableItem(item)) return

  let query
  if (!remove) {
    query = client.from('carts').upsert({
      user_id: userId,
      product_id: item.id,
      variant_id: item.variantId,
      quantity: item.quantity
    }, { onConflict: 'user_id,product_id,variant_id' })
  } else {
    query = client.from('carts').delete()
      .eq('user_id', userId)
      .eq('product_id', item.id)
      .eq('variant_id', item.variantId)
  }
  const { error } = await query
  if (error) throw error
}

export async function loadAndMergeAuthenticatedCart(client, userId, guestItems, products) {
  const { data, error } = await client.from('carts')
    .select('product_id,variant_id,quantity')
    .eq('user_id', userId)
    .limit(100)
  if (error) throw error

  const quantities = new Map()
  for (const item of data || []) {
    const quantity = Number(item.quantity)
    if (Number.isFinite(quantity) && quantity > 0) {
      quantities.set(`${item.product_id}:${item.variant_id}`, quantity)
    }
  }
  for (const item of guestItems || []) {
    if (!isPurchasableItem(item)) continue
    const key = `${item.id}:${item.variantId}`
    quantities.set(key, (quantities.get(key) || 0) + Number(item.quantity || 0))
  }

  const merged = []
  for (const [key, quantity] of quantities) {
    const [productId, variantId] = key.split(':')
    const product = products.find((entry) => String(entry.id) === productId)
    const variant = product?.variants?.find((entry) => String(entry.id) === variantId)
    const stock = Number(variant?.stock)
    if (!product || !variant || !Number.isFinite(stock) || stock <= 0 || !isPurchasableItem({ ...product, ...variant, variantId })) continue
    const item = createPurchasableCartItem(product, variant, quantity)
    if (!item) continue
    merged.push(item)
    await syncAuthenticatedCartItem(client, userId, item)
  }
  return merged
}

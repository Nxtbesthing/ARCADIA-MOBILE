const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validLiveProductIds(ids, products) {
  const liveIds = new Set(
    products
      .filter((product) => product?.catalogSource === 'supabase' && !product.previewOnly)
      .map((product) => String(product.id))
  )
  return [...new Set(ids.map(String))].filter((id) => UUID_PATTERN.test(id) && liveIds.has(id))
}

export async function loadAndMergeWishlist(client, userId, guestIds, products) {
  const { data, error } = await client.from('wishlists')
    .select('product_id')
    .eq('user_id', userId)
    .is('variant_id', null)
    .limit(200)
  if (error) throw error

  const existingIds = [...new Set((data || []).map((row) => String(row.product_id)))]
  const liveGuestIds = validLiveProductIds(guestIds, products)
  for (const productId of liveGuestIds) {
    if (existingIds.includes(productId)) continue
    const { error: insertError } = await client.from('wishlists').insert({
      user_id: userId,
      product_id: productId,
      variant_id: null
    })
    if (insertError && insertError.code !== '23505') throw insertError
    if (!insertError) existingIds.push(productId)
  }

  const mergedIds = [...new Set([...existingIds, ...guestIds.map(String)])]
    .filter((id) => products.some((product) => String(product.id) === id))
  return mergedIds
}

export async function setWishlistProduct(client, userId, productId, saved) {
  const query = client.from('wishlists')
  if (!saved) {
    const { error } = await query.delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .is('variant_id', null)
    if (error) throw error
    return
  }

  const { data, error: readError } = await query.select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .is('variant_id', null)
    .maybeSingle()
  if (readError) throw readError
  if (data) return

  const { error: insertError } = await query.insert({
    user_id: userId,
    product_id: productId,
    variant_id: null
  })
  if (insertError && insertError.code !== '23505') throw insertError
}

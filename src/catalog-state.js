const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isSupabaseUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function markCatalogProducts(products, catalogSource) {
  const previewOnly = catalogSource !== 'supabase'
  return products.map((product) => ({
    ...product,
    catalogSource,
    previewOnly,
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({ ...variant, catalogSource, previewOnly }))
      : product.variants
  }))
}

export function canPurchaseVariant(product, variant) {
  return Boolean(
    product
    && variant
    && product.catalogSource === 'supabase'
    && variant.catalogSource === 'supabase'
    && !product.previewOnly
    && !variant.previewOnly
    && isSupabaseUuid(product.id)
    && isSupabaseUuid(variant.id)
  )
}

export function createPurchasableCartItem(product, variant, quantity) {
  if (!canPurchaseVariant(product, variant)
    || !product.variants?.some((entry) => String(entry.id) === String(variant.id))) return null

  const stock = Number(variant.stock)
  const requestedQuantity = Number(quantity)
  if (!Number.isFinite(stock) || stock <= 0 || !Number.isFinite(requestedQuantity)) return null

  return {
    ...product,
    ...variant,
    id: product.id,
    name: product.name,
    brand: product.brand,
    variantId: variant.id,
    quantity: Math.min(stock, Math.max(1, Math.floor(requestedQuantity)))
  }
}

export function canCheckoutCart(cart, products) {
  return Array.isArray(cart)
    && cart.length > 0
    && cart.every((item) => {
      const product = products.find((entry) => String(entry.id) === String(item.id))
      const variant = product?.variants?.find((entry) => String(entry.id) === String(item.variantId))
      return canPurchaseVariant(product, variant)
    })
}

export function resolveCatalogDisplay(catalog) {
  const sourceStatus = catalog?.status || 'error'
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : []
  const liveProducts = Array.isArray(catalog?.products) ? catalog.products : []

  if ((sourceStatus === 'live' || sourceStatus === 'incomplete') && liveProducts.length) {
    return {
      status: sourceStatus,
      sourceStatus,
      displayMode: 'live',
      products: markCatalogProducts(liveProducts, 'supabase'),
      categories,
      message: sourceStatus === 'incomplete'
        ? 'Live catalog data is incomplete. Only products with usable mappings are shown.'
        : ''
    }
  }

  if (sourceStatus === 'empty') {
    return {
      status: 'empty',
      sourceStatus,
      displayMode: 'empty',
      products: [],
      categories,
      message: 'No live products are available yet.'
    }
  }

  const sourceMessage = sourceStatus === 'unconfigured'
    ? 'Supabase is not configured.'
    : sourceStatus === 'incomplete'
      ? 'Live catalog records are missing usable variants or required mappings.'
      : 'Live inventory could not be loaded.'

  return {
    status: sourceStatus,
    sourceStatus,
    displayMode: 'empty',
    products: [],
    categories,
    message: sourceMessage
  }
}
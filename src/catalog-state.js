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

export function canCheckoutCart(cart, products) {
  return Array.isArray(cart)
    && cart.length > 0
    && cart.every((item) => {
      const product = products.find((entry) => String(entry.id) === String(item.id))
      const variant = product?.variants?.find((entry) => String(entry.id) === String(item.variantId))
      return canPurchaseVariant(product, variant)
    })
}

export function resolveCatalogDisplay(catalog, fallbackProducts) {
  const sourceStatus = catalog?.status || 'error'
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : []
  const liveProducts = Array.isArray(catalog?.products) ? catalog.products : []
  const previewProducts = markCatalogProducts(fallbackProducts, 'preview')

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
      status: previewProducts.length ? 'preview' : 'empty',
      sourceStatus,
      displayMode: previewProducts.length ? 'preview' : 'empty',
      products: previewProducts,
      categories,
      message: previewProducts.length
        ? 'No live products are available. Preview inventory is shown and cannot be purchased.'
        : 'No live products are available yet.'
    }
  }

  const sourceMessage = sourceStatus === 'unconfigured'
    ? 'Supabase is not configured.'
    : sourceStatus === 'incomplete'
      ? 'Live catalog records are missing usable variants or required mappings.'
      : 'Live inventory could not be loaded.'

  return {
    status: previewProducts.length ? 'preview' : sourceStatus,
    sourceStatus,
    displayMode: previewProducts.length ? 'preview' : 'empty',
    products: previewProducts,
    categories,
    message: previewProducts.length
      ? `${sourceMessage} Preview inventory is shown and cannot be purchased.`
      : sourceMessage
  }
}
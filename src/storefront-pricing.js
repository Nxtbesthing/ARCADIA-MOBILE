function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function finiteNonNegative(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? roundMoney(parsed) : null
}

function finitePercentage(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null
}

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined) ?? null
}

function percentFromAmount(originalPrice, discountAmount) {
  return originalPrice > 0 ? roundMoney((discountAmount / originalPrice) * 100) : 0
}

export function normalizePricing(product = {}) {
  if (!product || typeof product !== 'object') product = {}
  const legacyOriginal = finiteNonNegative(product.originalPrice)
    ?? finiteNonNegative(product.oldPrice)
  const explicitFinal = firstValue(
    finiteNonNegative(product.finalPrice),
    finiteNonNegative(product.price)
  )
  const originalPrice = legacyOriginal ?? explicitFinal ?? 0
  const suppliedPercentage = firstValue(
    finitePercentage(product.discountPercentage),
    finitePercentage(product.discount)
  )
  const suppliedAmount = finiteNonNegative(product.discountAmount)
  const isLiveCatalog = product.catalogSource === 'supabase'

  if (isLiveCatalog && suppliedPercentage !== null) {
    const discountAmount = roundMoney(originalPrice * suppliedPercentage / 100)
    return {
      originalPrice,
      discountPercentage: suppliedPercentage,
      discountAmount,
      finalPrice: roundMoney(originalPrice - discountAmount)
    }
  }

  if (explicitFinal !== null) {
    const discountAmount = roundMoney(Math.max(0, originalPrice - explicitFinal))
    return {
      originalPrice,
      discountPercentage: percentFromAmount(originalPrice, discountAmount),
      discountAmount,
      finalPrice: explicitFinal
    }
  }

  if (suppliedAmount !== null || suppliedPercentage !== null) {
    const discountAmount = suppliedAmount ?? roundMoney(originalPrice * suppliedPercentage / 100)
    const boundedDiscount = Math.min(originalPrice, discountAmount)
    return {
      originalPrice,
      discountPercentage: suppliedAmount !== null
        ? percentFromAmount(originalPrice, boundedDiscount)
        : suppliedPercentage,
      discountAmount: boundedDiscount,
      finalPrice: roundMoney(originalPrice - boundedDiscount)
    }
  }

  return { originalPrice, discountPercentage: 0, discountAmount: 0, finalPrice: originalPrice }
}

export function formatDiscountPercentage(value) {
  const percentage = roundMoney(finitePercentage(value) ?? 0)
  return String(percentage)
}
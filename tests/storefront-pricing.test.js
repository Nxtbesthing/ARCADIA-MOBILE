import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePricing } from '../src/storefront-pricing.js'

test('legacy products preserve their valid sale price and original price', () => {
  assert.deepEqual(normalizePricing({ price: 650000, oldPrice: 700000, discount: 7 }), {
    originalPrice: 700000,
    discountPercentage: 7.14,
    discountAmount: 50000,
    finalPrice: 650000
  })
})

test('Supabase pricing is calculated from original price and fractional percentage', () => {
  assert.deepEqual(normalizePricing({
    catalogSource: 'supabase',
    originalPrice: '199.99',
    discountPercentage: '12.5',
    discountAmount: '24.99',
    finalPrice: '175.00'
  }), {
    originalPrice: 199.99,
    discountPercentage: 12.5,
    discountAmount: 25,
    finalPrice: 174.99
  })
})

test('zero discount displays the original amount as the final amount', () => {
  assert.deepEqual(normalizePricing({ originalPrice: '125.25', discountPercentage: 0 }), {
    originalPrice: 125.25,
    discountPercentage: 0,
    discountAmount: 0,
    finalPrice: 125.25
  })
})

test('full discounts safely produce a zero final price', () => {
  assert.deepEqual(normalizePricing({ catalogSource: 'supabase', originalPrice: 50.25, discountPercentage: 100 }), {
    originalPrice: 50.25,
    discountPercentage: 100,
    discountAmount: 50.25,
    finalPrice: 0
  })
})

test('missing and malformed values never produce non-finite prices', () => {
  for (const product of [
    {},
    { originalPrice: 'invalid', oldPrice: NaN, price: 'not-money', discount: 'bad' },
    { catalogSource: 'supabase', originalPrice: '', discountPercentage: 'bad', finalPrice: 'bad' }
  ]) {
    const pricing = normalizePricing(product)
    assert.ok(Object.values(pricing).every(Number.isFinite))
    assert.ok(Object.values(pricing).every((value) => value >= 0))
  }
})

test('legacy prices can derive discount amount and percentage when fields are absent', () => {
  assert.deepEqual(normalizePricing({ originalPrice: 80, finalPrice: 60 }), {
    originalPrice: 80,
    discountPercentage: 25,
    discountAmount: 20,
    finalPrice: 60
  })
})
import { supabase } from './supabase.js'

const PAGE_SIZE = 500
const IN_BATCH_SIZE = 100

async function readPages(buildQuery) {
  const results = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    results.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return results
  }
}

async function readByIds(table, columns, key, ids, configure = (query) => query) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return []
  const results = []
  for (let offset = 0; offset < uniqueIds.length; offset += IN_BATCH_SIZE) {
    const batch = uniqueIds.slice(offset, offset + IN_BATCH_SIZE)
    const { data, error } = await configure(supabase.from(table).select(columns).in(key, batch))
    if (error) throw error
    results.push(...(data || []))
  }
  return results
}

export async function fetchStorefrontCatalog() {
  const [categories, products] = await Promise.all([
    readPages(() => supabase.from('categories').select('id,name,slug,active').eq('active', true).order('name')),
    readPages(() => supabase.from('products').select('id,manufacturer_model_id,category_id,name,description,active').eq('active', true).order('name'))
  ])
  if (!products.length) return { categories, products: [] }

  const productIds = products.map((product) => product.id)
  const [variants, images] = await Promise.all([
    readByIds('product_variants', 'id,product_id,manufacturer_model_id,model_storage_option_id,color_name,sku,stock_quantity,availability,condition,original_price,discount_percentage,discount_amount,final_price,warranty,battery_health', 'product_id', productIds, (query) => query.in('availability', ['active', 'out_of_stock'])),
    readByIds('product_images', 'id,product_id,variant_id,storage_path,alt_text,sort_order,is_primary', 'product_id', productIds, (query) => query.order('sort_order'))
  ])

  const modelIds = [...new Set(products.map((product) => product.manufacturer_model_id))]
  const storageIds = [...new Set(variants.map((variant) => variant.model_storage_option_id))]
  const categoryIds = [...new Set(products.map((product) => product.category_id))]
  const manufacturerModels = await readByIds('manufacturer_models', 'id,series_id,name', 'id', modelIds)
  const seriesIds = [...new Set(manufacturerModels.map((model) => model.series_id))]
  const storageOptions = await readByIds('model_storage_options', 'id,model_id,storage_label', 'id', storageIds)
  const [series, categoriesById] = await Promise.all([
    readByIds('manufacturer_series', 'id,manufacturer_id,name', 'id', seriesIds),
    readByIds('categories', 'id,name,slug,active', 'id', categoryIds)
  ])
  const manufacturerIds = [...new Set(series.map((entry) => entry.manufacturer_id))]
  const manufacturers = await readByIds('manufacturers', 'id,name', 'id', manufacturerIds)

  const modelById = new Map(manufacturerModels.map((model) => [model.id, model]))
  const seriesById = new Map(series.map((entry) => [entry.id, entry]))
  const manufacturerById = new Map(manufacturers.map((entry) => [entry.id, entry]))
  const storageById = new Map(storageOptions.map((entry) => [entry.id, entry]))
  const categoryById = new Map(categoriesById.map((entry) => [entry.id, entry]))
  const imageUrlById = new Map(images.map((image) => [image.id, supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl]))
  const imagesByProduct = new Map()
  const imagesByVariant = new Map()
  for (const image of images) {
    const entry = imageUrlById.get(image.id)
    const target = image.variant_id ? imagesByVariant : imagesByProduct
    const targetId = image.variant_id || image.product_id
    target.set(targetId, [...(target.get(targetId) || []), entry])
  }
  const variantsByProduct = new Map()
  for (const variant of variants) {
    const model = modelById.get(variant.manufacturer_model_id)
    const parentSeries = model ? seriesById.get(model.series_id) : null
    const manufacturer = parentSeries ? manufacturerById.get(parentSeries.manufacturer_id) : null
    const storage = storageById.get(variant.model_storage_option_id)
    const finalPrice = Number(variant.final_price || 0)
    const originalPrice = Number(variant.original_price || 0)
    const mapped = {
      id: variant.id,
      storage: storage?.storage_label || 'N/A',
      color: variant.color_name,
      condition: variant.condition,
      price: finalPrice,
      finalPrice,
      oldPrice: originalPrice,
      originalPrice,
      discountPercentage: Number(variant.discount_percentage || 0),
      discountAmount: Number(variant.discount_amount || 0),
      stock: Number(variant.stock_quantity || 0),
      availability: variant.availability,
      sku: variant.sku,
      warranty: variant.warranty,
      batteryHealth: variant.battery_health,
      images: imagesByVariant.get(variant.id) || imagesByProduct.get(variant.product_id) || [],
      manufacturer: manufacturer?.name || ''
    }
    variantsByProduct.set(variant.product_id, [...(variantsByProduct.get(variant.product_id) || []), mapped])
  }

  const mappedProducts = products.flatMap((product) => {
    const productVariants = variantsByProduct.get(product.id) || []
    if (!productVariants.length) return []
    const defaultVariant = productVariants.find((variant) => variant.stock > 0) || productVariants[0]
    const model = modelById.get(product.manufacturer_model_id)
    const parentSeries = model ? seriesById.get(model.series_id) : null
    const manufacturer = parentSeries ? manufacturerById.get(parentSeries.manufacturer_id) : null
    const category = categoryById.get(product.category_id)
    const productImages = imagesByProduct.get(product.id) || []
    return [{
      id: product.id,
      name: product.name,
      brand: manufacturer?.name || 'Arcadia Mobile',
      category: category?.name || '',
      categoryKey: category?.slug || '',
      description: product.description || '',
      active: product.active,
      price: defaultVariant.finalPrice,
      finalPrice: defaultVariant.finalPrice,
      oldPrice: defaultVariant.originalPrice,
      originalPrice: defaultVariant.originalPrice,
      discountPercentage: defaultVariant.discountPercentage,
      discountAmount: defaultVariant.discountAmount,
      discount: defaultVariant.discountPercentage,
      stock: productVariants.reduce((total, variant) => total + variant.stock, 0),
      storage: defaultVariant.storage,
      color: defaultVariant.color,
      condition: defaultVariant.condition,
      warranty: defaultVariant.warranty,
      sku: defaultVariant.sku,
      images: productImages.length ? productImages : defaultVariant.images,
      specifications: [],
      rating: 0,
      reviews: 0,
      variants: productVariants
    }]
  })

  return { categories, products: mappedProducts }
}

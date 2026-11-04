import { supabase, supabaseConfiguration } from './supabase.js'
import { isSupabaseUuid } from './catalog-state.js'

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

async function readByIds(client, table, columns, key, ids, configure = (query) => query) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return []
  const results = []
  for (let offset = 0; offset < uniqueIds.length; offset += IN_BATCH_SIZE) {
    const batch = uniqueIds.slice(offset, offset + IN_BATCH_SIZE)
    const { data, error } = await configure(client.from(table).select(columns).in(key, batch))
    if (error) throw error
    results.push(...(data || []))
  }
  return results
}

export async function fetchStorefrontCatalog(client = supabase, configuration = supabaseConfiguration) {
  if (!configuration.configured || !client) {
    return { status: 'unconfigured', categories: [], products: [], message: configuration.message || 'Supabase configuration is unavailable.' }
  }

  try {
    const [categories, products] = await Promise.all([
      readPages(() => client.from('categories').select('id,name,slug,active').eq('active', true).order('name')),
      readPages(() => client.from('products').select('id,manufacturer_model_id,category_id,name,description,active').eq('active', true).order('name'))
    ])
    if (!products.length) return { status: 'empty', categories, products: [], message: '' }

    const productIds = products.map((product) => product.id)
    const [variants, images] = await Promise.all([
      readByIds(client, 'product_variants', 'id,product_id,manufacturer_model_id,model_storage_option_id,color_name,sku,stock_quantity,availability,condition,original_price,discount_percentage,discount_amount,final_price,warranty,battery_health,ram,face_id,true_tone,display_details,battery_details,camera_details,speaker_details,microphone_details,charging_details,sim_details', 'product_id', productIds, (query) => query.in('availability', ['active', 'out_of_stock'])),
      readByIds(client, 'product_images', 'id,product_id,variant_id,storage_path,alt_text,sort_order,is_primary', 'product_id', productIds, (query) => query.order('sort_order'))
    ])

    const modelIds = [...new Set(products.map((product) => product.manufacturer_model_id))]
    const storageIds = [...new Set(variants.map((variant) => variant.model_storage_option_id))]
    const categoryIds = [...new Set(products.map((product) => product.category_id))]
    const manufacturerModels = await readByIds(client, 'manufacturer_models', 'id,series_id,name', 'id', modelIds)
    const seriesIds = [...new Set(manufacturerModels.map((model) => model.series_id))]
    const [storageOptions, colors, series, categoriesById] = await Promise.all([
      readByIds(client, 'model_storage_options', 'id,model_id,storage_label', 'id', storageIds),
      readByIds(client, 'model_storage_colors', 'storage_option_id,color_name', 'storage_option_id', storageIds),
      readByIds(client, 'manufacturer_series', 'id,manufacturer_id,name', 'id', seriesIds),
      readByIds(client, 'categories', 'id,name,slug,active', 'id', categoryIds)
    ])
    const manufacturerIds = [...new Set(series.map((entry) => entry.manufacturer_id))]
    const manufacturers = await readByIds(client, 'manufacturers', 'id,name', 'id', manufacturerIds)

    const modelById = new Map(manufacturerModels.map((model) => [model.id, model]))
    const seriesById = new Map(series.map((entry) => [entry.id, entry]))
    const manufacturerById = new Map(manufacturers.map((entry) => [entry.id, entry]))
    const storageById = new Map(storageOptions.map((entry) => [entry.id, entry]))
    const colorKeys = new Set(colors.map((entry) => `${entry.storage_option_id}:${entry.color_name}`))
    const categoryById = new Map(categoriesById.map((entry) => [entry.id, entry]))
    const imageUrlById = new Map(images.map((image) => [image.id, client.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl]))
    const imagesByProduct = new Map()
    const imagesByVariant = new Map()
    for (const image of images) {
      const target = image.variant_id ? imagesByVariant : imagesByProduct
      const targetId = image.variant_id || image.product_id
      target.set(targetId, [...(target.get(targetId) || []), image])
    }
    const imageUrlsInDisplayOrder = (entries) => [...entries]
      .sort((left, right) => Number(right.is_primary) - Number(left.is_primary)
        || Number(left.sort_order) - Number(right.sort_order))
      .map((image) => imageUrlById.get(image.id))

    let incomplete = false
    const mappedProducts = products.flatMap((product) => {
      const model = modelById.get(product.manufacturer_model_id)
      const parentSeries = model ? seriesById.get(model.series_id) : null
      const manufacturer = parentSeries ? manufacturerById.get(parentSeries.manufacturer_id) : null
      const category = categoryById.get(product.category_id)
      const productVariants = variants
        .filter((variant) => variant.product_id === product.id)
        .flatMap((variant) => {
          const storage = storageById.get(variant.model_storage_option_id)
          const variantModel = modelById.get(variant.manufacturer_model_id)
          const variantSeries = variantModel ? seriesById.get(variantModel.series_id) : null
          const variantManufacturer = variantSeries ? manufacturerById.get(variantSeries.manufacturer_id) : null
          if (!isSupabaseUuid(variant.id) || variant.manufacturer_model_id !== product.manufacturer_model_id || !storage || storage.model_id !== product.manufacturer_model_id || !variant.color_name || !colorKeys.has(`${variant.model_storage_option_id}:${variant.color_name}`) || !variant.sku || !variantModel || !variantSeries || !variantManufacturer) {
            incomplete = true
            return []
          }
          const finalPrice = Number(variant.final_price ?? 0)
          const originalPrice = Number(variant.original_price ?? 0)
          return [{
            id: variant.id,
            catalogSource: 'supabase',
            previewOnly: false,
            storage: storage.storage_label,
            color: variant.color_name,
            condition: variant.condition,
            price: finalPrice,
            finalPrice,
            oldPrice: originalPrice,
            originalPrice,
            discountPercentage: Number(variant.discount_percentage ?? 0),
            discountAmount: Number(variant.discount_amount ?? 0),
            stock: Number(variant.stock_quantity ?? 0),
            availability: variant.availability,
            sku: variant.sku,
            warranty: variant.warranty,
            batteryHealth: variant.battery_health,
            ram: variant.ram,
            faceId: variant.face_id,
            trueTone: variant.true_tone,
            display: variant.display_details,
            battery: variant.battery_details,
            camera: variant.camera_details,
            speaker: variant.speaker_details,
            microphone: variant.microphone_details,
            charging: variant.charging_details,
            sim: variant.sim_details,
            images: imageUrlsInDisplayOrder(imagesByVariant.get(variant.id) || imagesByProduct.get(variant.product_id) || []),
            manufacturer: variantManufacturer.name
          }]
        })

      if (!model || !parentSeries || !manufacturer || !category || !productVariants.length || !isSupabaseUuid(product.id)) {
        incomplete = true
        return []
      }

      const defaultVariant = productVariants.find((variant) => variant.stock > 0) || productVariants[0]
      const productImages = imageUrlsInDisplayOrder(imagesByProduct.get(product.id) || [])
      return [{
        id: product.id,
        catalogSource: 'supabase',
        previewOnly: false,
        name: product.name,
        brand: manufacturer.name,
        category: category.name,
        categoryKey: category.slug,
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

    return {
      status: incomplete ? 'incomplete' : 'live',
      categories,
      products: mappedProducts,
      message: incomplete ? 'Some live products are missing usable variants or required catalog mappings.' : ''
    }
  } catch (error) {
    return {
      status: 'error',
      categories: [],
      products: [],
      message: 'Live inventory could not be loaded.',
      errorCode: error?.code || null
    }
  }
}

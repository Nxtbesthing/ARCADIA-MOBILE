import { supabase, supabaseAuthState, supabaseConfiguration } from './supabase.js'
import {
  listAdminOrders,
  listAdminRepairRequests,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  REPAIR_STATUSES,
  saveAdminInventoryItem,
  updateAdminOrder,
  updateAdminRepairRequest
} from './admin-workflows.js'

const PAGE_SIZE = 1000

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(value) {
  return `₦ ${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calculatePrice(originalValue, percentageValue) {
  const original = Number(originalValue)
  const percentage = Number(percentageValue)
  const discount = Math.round(original * percentage) / 100
  return {
    discount: Math.round(discount * 100) / 100,
    final: Math.round((original - discount) * 100) / 100
  }
}

function displayError(error) {
  if (error?.code === '23505') return 'SKU already exists, or this product/variant is duplicated.'
  if (error?.code === '23503') return 'A selected category, model, storage option, or color is no longer valid.'
  return error?.message || 'The request could not be completed. Please try again.'
}

async function readAll(table, columns) {
  const rows = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

function renderShell(container, content) {
  container.innerHTML = `
    <div class="container supabase-inventory">
      <header class="si-header">
        <div>
          <p class="eyebrow">ARCADIA ADMINISTRATION</p>
          <h1>INVENTORY</h1>
        </div>
        <nav aria-label="Inventory navigation">
          <a class="secondary-btn" href="#admin">Admin access</a>
          <a class="secondary-btn" href="#home">Storefront</a>
        </nav>
      </header>
      ${content}
    </div>
  `
}

function renderMessage(container, message, isError = false) {
  const target = container.querySelector('[data-si-message]')
  if (!target) return
  target.textContent = message
  target.classList.toggle('si-error', isError)
  target.classList.toggle('si-success', !isError && Boolean(message))
}

function renderSignIn(container, message = '') {
  renderShell(container, `
    <section class="si-access" aria-labelledby="si-access-title">
      <h2 id="si-access-title">Sign in with Supabase Auth</h2>
      <p>Only an authenticated account with <code>profiles.role = admin</code> can manage inventory. Admin provisioning remains a privileged, out-of-band operation.</p>
      <form class="si-form si-auth-form" data-si-login>
        <label>Email<input name="email" type="email" autocomplete="username" required /></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
        <button class="primary-btn" type="submit">SIGN IN</button>
      </form>
      <p class="si-message ${message ? 'si-error' : ''}" data-si-message role="status">${escapeHtml(message)}</p>
    </section>
  `)

  container.querySelector('[data-si-login]').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector('button[type="submit"]')
    const data = new FormData(form)
    button.disabled = true
    renderMessage(container, 'Signing in…')
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: String(data.get('email') || '').trim(),
      password: String(data.get('password') || '')
    })
    if (error) {
      button.disabled = false
      renderMessage(container, error.message || 'Sign-in failed.', true)
      return
    }
    supabaseAuthState.setSession(result.session, 'SIGNED_IN')
    await authorizeAndRender(container, result.session)
  })
}

async function authorizeAndRender(container, session) {
  if (!session?.user?.id) {
    renderSignIn(container)
    return
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || profile?.role !== 'admin') {
    renderShell(container, `
      <section class="si-access" aria-labelledby="si-denied-title">
        <h2 id="si-denied-title">Administrator access required</h2>
        <p>This account is not authorized to manage inventory. Customer accounts cannot change their own role.</p>
        <button class="secondary-btn" data-si-signout type="button">SIGN OUT</button>
        <p class="si-message si-error" role="status">${escapeHtml(error ? displayError(error) : 'No admin role is assigned to this account.')}</p>
      </section>
    `)
    container.querySelector('[data-si-signout]').addEventListener('click', async () => {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        renderMessage(container, 'Sign-out failed. Please try again.', true)
        return
      }
      supabaseAuthState.setSession(null, 'SIGNED_OUT')
      renderSignIn(container)
    })
    return
  }

  try {
    const [categories, manufacturers, series, models, storageOptions, colors, products, variants, images, ordersResult, repairsResult] = await Promise.all([
      readAll('categories', 'id,name,slug,active'),
      readAll('manufacturers', 'id,name'),
      readAll('manufacturer_series', 'id,manufacturer_id,name'),
      readAll('manufacturer_models', 'id,series_id,name'),
      readAll('model_storage_options', 'id,model_id,storage_label'),
      readAll('model_storage_colors', 'storage_option_id,color_name'),
      readAll('products', 'id,manufacturer_model_id,category_id,name,description,active,created_at'),
      readAll('product_variants', 'id,product_id,manufacturer_model_id,model_storage_option_id,color_name,sku,stock_quantity,availability,condition,original_price,discount_percentage,discount_amount,final_price,warranty,battery_health'),
      readAll('product_images', 'id,product_id,variant_id,storage_path,alt_text,sort_order,is_primary'),
      listAdminOrders(supabase).then((data) => ({ data })).catch((error) => ({ error })),
      listAdminRepairRequests(supabase).then((data) => ({ data })).catch((error) => ({ error }))
    ])
    renderInventory(container, {
      categories,
      manufacturers,
      series,
      models,
      storageOptions,
      colors,
      products,
      variants,
      images,
      orders: ordersResult.data?.orders || [],
      orderItems: ordersResult.data?.items || [],
      ordersError: ordersResult.error || null,
      repairRequests: repairsResult.data || [],
      repairsError: repairsResult.error || null,
      user: session.user
    })
  } catch (loadError) {
    renderShell(container, `
      <section class="si-access">
        <h2>Inventory could not be loaded</h2>
        <p class="si-message si-error" role="alert">${escapeHtml(displayError(loadError))}</p>
        <button class="secondary-btn" data-si-retry type="button">RETRY</button>
      </section>
    `)
    container.querySelector('[data-si-retry]').addEventListener('click', () => authorizeAndRender(container, session))
  }
}

function renderInventory(container, state) {
  const categoryOptions = state.categories
    .filter((category) => category.active)
    .map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`)
    .join('')
  const categoryNotice = state.categories.length
    ? ''
    : '<p class="si-warning">No categories exist yet. Product creation is disabled because products require an existing category; no categories were seeded.</p>'
  const imageNotice = '<p class="si-help">Product images are publicly readable; Storage uploads and deletes require an authenticated admin.</p>'
  const productById = new Map(state.products.map((product) => [product.id, product]))
  const categoryById = new Map(state.categories.map((category) => [category.id, category]))
  const modelById = new Map(state.models.map((model) => [model.id, model]))
  const seriesById = new Map(state.series.map((series) => [series.id, series]))
  const manufacturerById = new Map(state.manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]))
  const storageById = new Map(state.storageOptions.map((storage) => [storage.id, storage]))
  const imageCountByProduct = new Map()
  for (const image of state.images) imageCountByProduct.set(image.product_id, (imageCountByProduct.get(image.product_id) || 0) + 1)

  const inventoryRows = state.products.flatMap((product) => {
    const model = modelById.get(product.manufacturer_model_id)
    const series = model ? seriesById.get(model.series_id) : null
    const manufacturer = series ? manufacturerById.get(series.manufacturer_id) : null
    const productVariants = state.variants.filter((variant) => variant.product_id === product.id)
    if (!productVariants.length) {
      return [`<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(categoryById.get(product.category_id)?.name || '—')}</td><td colspan="8">No variants</td></tr>`]
    }
    return productVariants.map((variant) => {
      const storage = storageById.get(variant.model_storage_option_id)
      const price = formatCurrency(variant.final_price)
      const modelLabel = [manufacturer?.name, series?.name, model?.name].filter(Boolean).join(' / ')
      return `<tr>
        <td><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(modelLabel)}</small></td>
        <td>${escapeHtml(categoryById.get(product.category_id)?.name || '—')}</td>
        <td>${escapeHtml(storage?.storage_label || '—')} / ${escapeHtml(variant.color_name)}</td>
        <td>${escapeHtml(variant.sku)}</td>
        <td>${formatCurrency(variant.original_price)}<small>${Number(variant.discount_percentage)}% off · ${price}</small></td>
        <td>${Number(variant.stock_quantity)}</td>
        <td>${escapeHtml(variant.condition)}</td>
        <td>${escapeHtml(variant.warranty)}</td>
        <td>${escapeHtml(variant.availability)}</td>
        <td>${imageCountByProduct.get(product.id) || 0} image(s)</td>
        <td><button class="admin-action" type="button" data-si-edit-product="${product.id}" data-si-edit-variant="${variant.id}">EDIT</button></td>
      </tr>`
    })
  }).join('') || '<tr><td colspan="11">No Supabase inventory records yet.</td></tr>'
  const imageRows = state.images.map((image) => {
    const product = productById.get(image.product_id)
    const imageUrl = supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl
    const variant = state.variants.find((item) => item.id === image.variant_id)
    return `<tr>
      <td><img class="si-image-thumb" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.alt_text || product?.name || 'Product image')}" /></td>
      <td>${escapeHtml(product?.name || 'Unknown product')}<small>${variant ? `${escapeHtml(variant.sku)} · ${escapeHtml(variant.color_name)}` : 'Product image'}</small></td>
      <td>${image.is_primary ? 'Primary' : 'Gallery'}</td>
      <td>${Number(image.sort_order)}</td>
      <td><button class="admin-action danger" type="button" data-si-delete-image="${escapeHtml(image.id)}">REMOVE</button></td>
    </tr>`
  }).join('') || '<tr><td colspan="5">No product images uploaded.</td></tr>'
  const orderRows = state.orders.map((order) => {
    const items = state.orderItems?.filter((item) => item.order_id === order.id) || []
    return `<article class="si-operation-card">
      <header><strong>${escapeHtml(order.order_number)}</strong><span>${escapeHtml(new Date(order.created_at).toLocaleString())}</span></header>
      <p>${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_email)} · ${escapeHtml(order.customer_phone)}</p>
      <p>${escapeHtml(order.delivery_method)}${order.delivery_method === 'delivery' ? ` · ${escapeHtml([order.delivery_address, order.delivery_city, order.delivery_state].filter(Boolean).join(', '))}` : ''}</p>
      <ul>${items.map((item) => `<li>${escapeHtml(item.product_name)} ${item.variant_description ? `· ${escapeHtml(item.variant_description)}` : ''} · ${escapeHtml(item.sku)} × ${Number(item.quantity)} · ${formatCurrency(item.line_total)}</li>`).join('') || '<li>Order items unavailable.</li>'}</ul>
      <p>Bank transfer · ${formatCurrency(order.grand_total)} · ${formatCurrency(order.subtotal)} subtotal · ${formatCurrency(order.delivery_fee)} delivery</p>
      <form class="si-operation-form" data-si-order-update="${escapeHtml(order.id)}">
        <label>Order status<select name="status">${ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
        <label>Payment status<select name="paymentStatus">${PAYMENT_STATUSES.map((status) => `<option value="${status}" ${status === order.payment_status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
        <button class="secondary-btn" type="submit">SAVE ORDER STATUS</button>
      </form>
    </article>`
  }).join('') || '<p class="si-help">No orders are available.</p>'
  const repairRows = state.repairRequests.map((repair) => `<article class="si-operation-card">
    <header><strong>${escapeHtml(repair.ticket_number)}</strong><span>${escapeHtml(repair.created_at ? new Date(repair.created_at).toLocaleString() : '')}</span></header>
    <p>${escapeHtml(repair.customer_name)} · ${escapeHtml(repair.customer_email)} · ${escapeHtml(repair.customer_phone)}</p>
    <p>${escapeHtml(repair.device)}${repair.device_details ? ` · ${escapeHtml(repair.device_details)}` : ''}</p>
    <p><strong>${escapeHtml(repair.problem)}</strong>${repair.description ? `<br />${escapeHtml(repair.description)}` : ''}</p>
    <p>Preferred date: ${escapeHtml(repair.preferred_date || 'Not specified')}</p>
    <form class="si-operation-form" data-si-repair-update="${escapeHtml(repair.id)}">
      <label>Status<select name="status">${REPAIR_STATUSES.map((status) => `<option value="${status}" ${status === repair.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
      <label>Repair cost<input name="repairCost" type="number" min="0" step="0.01" value="${repair.repair_cost == null ? '' : Number(repair.repair_cost)}" /></label>
      <label class="si-operation-check"><input name="contacted" type="checkbox" ${repair.contacted ? 'checked' : ''} /> Customer contacted</label>
      <label class="si-operation-wide">Internal notes<textarea name="communicationNotes" rows="3">${escapeHtml(repair.communication_notes || '')}</textarea></label>
      <button class="secondary-btn" type="submit">SAVE REPAIR UPDATE</button>
    </form>
  </article>`).join('') || '<p class="si-help">No repair requests are available.</p>'

  renderShell(container, `
    <div class="si-toolbar">
      <div><strong>${state.products.length}</strong> products <span>·</span> <strong>${state.variants.length}</strong> variants <span>·</span> ${escapeHtml(state.user.email || 'Admin')}</div>
      <button class="admin-logout" type="button" data-si-signout>SIGN OUT</button>
    </div>
    ${categoryNotice}
    ${imageNotice}
    <section class="si-section" aria-labelledby="si-product-title">
      <h2 id="si-product-title">${categoryOptions ? 'Product and variant' : 'Inventory form unavailable'}</h2>
      <form class="si-form si-product-form" data-si-product-form>
        <input type="hidden" name="product_id" />
        <input type="hidden" name="variant_id" />
        <label>Product name<input name="name" required maxlength="200" /></label>
        <label>Category<select name="category_id" required ${categoryOptions ? '' : 'disabled'}><option value="">Select a category</option>${categoryOptions}</select></label>
        <label class="si-wide">Description<textarea name="description" rows="3"></textarea></label>
        <fieldset class="si-catalog-fieldset">
          <legend>Validated device catalog</legend>
          <div class="si-cascade-grid">
            <label>Manufacturer<select name="manufacturer_id" data-si-manufacturer required><option value="">Select manufacturer</option>${state.manufacturers.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}</select></label>
            <label>Series<select name="series_id" data-si-series required disabled><option value="">Select series</option></select></label>
            <label>Model<select name="manufacturer_model_id" data-si-model required disabled><option value="">Select model</option></select></label>
            <label>Storage<select name="model_storage_option_id" data-si-storage required disabled><option value="">Select storage</option></select></label>
            <label>Valid color<select name="color_name" data-si-color required disabled><option value="">Select storage first</option></select></label>
          </div>
          <p class="si-help">Each selector is populated from the live Supabase master catalog.</p>
          <p class="si-lock-note" data-si-model-lock hidden>Manufacturer, series and model are fixed for an existing product to preserve its foreign-key relationships.</p>
        </fieldset>
        <fieldset class="si-catalog-fieldset">
          <legend>Variant inventory</legend>
          <div class="si-cascade-grid">
            <label>SKU<input name="sku" required maxlength="120" autocomplete="off" /></label>
            <label>Condition<input name="condition" required maxlength="80" value="New" /></label>
            <label>Stock quantity<input name="stock_quantity" type="number" min="0" step="1" value="0" required /></label>
            <label>Warranty<input name="warranty" required maxlength="120" value="No Warranty" /></label>
            <label>Original price (₦)<input name="original_price" type="number" min="0" step="0.01" value="0" required /></label>
            <label>Discount (%)<input name="discount_percentage" type="number" min="0" max="100" step="0.01" value="0" required /></label>
            <label>Visibility when stocked<select name="visibility"><option value="active">Active</option><option value="hidden">Hidden</option></select></label>
            <div class="si-price-summary"><span>Discount amount <strong data-si-discount>₦ 0.00</strong></span><span>Final price <strong data-si-final>₦ 0.00</strong></span></div>
          </div>
          <p class="si-help">Final price is generated by the database. Zero stock is always saved as out of stock.</p>
        </fieldset>
        <p class="si-message" data-si-message role="status"></p>
        <div class="si-form-actions"><button class="primary-btn" type="submit" ${categoryOptions ? '' : 'disabled'}>${categoryOptions ? 'CREATE PRODUCT + VARIANT' : 'CATEGORY REQUIRED'}</button><button class="secondary-btn" type="button" data-si-cancel-edit hidden>CANCEL EDIT</button></div>
      </form>
    </section>
    <section class="si-section" aria-labelledby="si-list-title">
      <div class="si-section-heading"><h2 id="si-list-title">Inventory</h2><button class="secondary-btn" type="button" data-si-refresh>REFRESH</button></div>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Product / model</th><th>Category</th><th>Variant</th><th>SKU</th><th>Price</th><th>Stock</th><th>Condition</th><th>Warranty</th><th>Availability</th><th>Images</th><th>Action</th></tr></thead><tbody>${inventoryRows}</tbody></table></div>
    </section>
    <section class="si-section" aria-labelledby="si-images-title">
      <h2 id="si-images-title">Product images</h2>
      <form class="si-form si-image-form" data-si-image-form>
        <label>Product<select name="product_id" required><option value="">Select product</option>${state.products.map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}</option>`).join('')}</select></label>
        <label>Variant (optional)<select name="variant_id"><option value="">Product image</option></select></label>
        <label>Image file<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></label>
        <label>Alt text<input name="alt_text" maxlength="240" /></label>
        <label>Sort order<input name="sort_order" type="number" min="0" step="1" value="0" required /></label>
        <label class="si-image-primary"><input name="is_primary" type="checkbox" /> Primary image for product</label>
        <p class="si-message" data-si-image-message role="status"></p>
        <div class="si-form-actions"><button class="primary-btn" type="submit" ${state.products.length ? '' : 'disabled'}>UPLOAD IMAGE</button></div>
      </form>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Preview</th><th>Product / variant</th><th>Role</th><th>Order</th><th>Action</th></tr></thead><tbody>${imageRows}</tbody></table></div>
    </section>
    <section class="si-section" aria-labelledby="si-orders-title">
      <div class="si-section-heading"><h2 id="si-orders-title">Orders and bank transfers</h2><button class="secondary-btn" type="button" data-si-refresh>REFRESH</button></div>
      <p class="si-message" data-si-operations-message role="status"></p>
      ${state.ordersError ? `<p class="si-message si-error" role="alert">Order queue could not be loaded. ${escapeHtml(displayError(state.ordersError))}</p>` : orderRows}
    </section>
    <section class="si-section" aria-labelledby="si-repairs-title">
      <div class="si-section-heading"><h2 id="si-repairs-title">Repair requests</h2><button class="secondary-btn" type="button" data-si-refresh>REFRESH</button></div>
      ${state.repairsError ? `<p class="si-message si-error" role="alert">Repair queue could not be loaded. ${escapeHtml(displayError(state.repairsError))}</p>` : repairRows}
    </section>
  `)

  bindInventory(container, state, { modelById, seriesById })
  bindAdminOperations(container, state)
}

function bindInventory(container, state, lookups) {
  const form = container.querySelector('[data-si-product-form]')
  const manufacturer = form.elements.manufacturer_id
  const series = form.elements.series_id
  const model = form.elements.manufacturer_model_id
  const storage = form.elements.model_storage_option_id
  const color = form.elements.color_name
  const price = form.elements.original_price
  const discount = form.elements.discount_percentage
  const stock = form.elements.stock_quantity
  const visibility = form.elements.visibility
  const submit = form.querySelector('button[type="submit"]')

  const fill = (select, placeholder, entries, label) => {
    const selected = select.value
    select.innerHTML = `<option value="">${placeholder}</option>${entries.map((entry) => `<option value="${entry.id}">${escapeHtml(label(entry))}</option>`).join('')}`
    select.disabled = entries.length === 0
    if (entries.some((entry) => String(entry.id) === selected)) select.value = selected
  }
  const updateSeries = () => {
    const entries = state.series.filter((entry) => String(entry.manufacturer_id) === manufacturer.value)
    fill(series, 'Select series', entries, (entry) => entry.name)
    updateModels()
  }
  const updateModels = () => {
    const entries = state.models.filter((entry) => String(entry.series_id) === series.value)
    fill(model, 'Select model', entries, (entry) => entry.name)
    updateStorage()
  }
  const updateStorage = () => {
    const entries = state.storageOptions.filter((entry) => String(entry.model_id) === model.value)
    fill(storage, 'Select storage', entries, (entry) => entry.storage_label)
    updateColors()
  }
  const updateColors = async (preferredColor = '') => {
    const storageId = storage.value
    state.colors = []
    color.innerHTML = `<option value="">${storageId ? 'Loading colors…' : 'Select storage first'}</option>`
    color.disabled = true
    if (!storageId) return
    const { data, error } = await supabase
      .from('model_storage_colors')
      .select('storage_option_id,color_name')
      .eq('storage_option_id', storageId)
      .order('color_name')
    if (storage.value !== storageId) return
    if (error) {
      color.innerHTML = '<option value="">Colors unavailable</option>'
      renderMessage(container, displayError(error), true)
      return
    }
    state.colors = data || []
    color.innerHTML = `<option value="">${state.colors.length ? 'Select color' : 'No catalog colors'}</option>${state.colors.map((entry) => `<option value="${escapeHtml(entry.color_name)}">${escapeHtml(entry.color_name)}</option>`).join('')}`
    color.disabled = state.colors.length === 0
    if (state.colors.some((entry) => entry.color_name === preferredColor)) color.value = preferredColor
  }
  const updatePrice = () => {
    const original = Number(price.value)
    const percentage = Number(discount.value)
    const valid = Number.isFinite(original) && original >= 0 && Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
    const amount = valid ? calculatePrice(original, percentage) : { discount: 0, final: 0 }
    container.querySelector('[data-si-discount]').textContent = formatCurrency(amount.discount)
    container.querySelector('[data-si-final]').textContent = formatCurrency(amount.final)
  }
  const updateStockAvailability = () => {
    if (Number(stock.value) === 0) visibility.setAttribute('aria-describedby', 'si-stock-help')
    else visibility.removeAttribute('aria-describedby')
  }

  manufacturer.addEventListener('change', updateSeries)
  series.addEventListener('change', updateModels)
  model.addEventListener('change', updateStorage)
  storage.addEventListener('change', updateColors)
  price.addEventListener('input', updatePrice)
  discount.addEventListener('input', updatePrice)
  stock.addEventListener('input', updateStockAvailability)
  updateSeries()
  updatePrice()

  const imageForm = container.querySelector('[data-si-image-form]')
  const imageProduct = imageForm.elements.product_id
  const imageVariant = imageForm.elements.variant_id
  const imageMessage = imageForm.querySelector('[data-si-image-message]')
  const updateImageVariants = () => {
    const options = state.variants.filter((item) => String(item.product_id) === imageProduct.value)
    imageVariant.innerHTML = `<option value="">Product image</option>${options.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.sku)} · ${escapeHtml(item.color_name)}</option>`).join('')}`
  }
  imageProduct.addEventListener('change', updateImageVariants)
  imageForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const file = imageForm.elements.image.files?.[0]
    const productId = imageProduct.value
    const variantId = imageVariant.value || null
    if (!productId || !state.products.some((item) => String(item.id) === productId)) {
      imageMessage.textContent = 'Select a valid product.'
      imageMessage.classList.add('si-error')
      return
    }
    if (!file || file.size <= 0 || file.size > 10485760 || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      imageMessage.textContent = 'Choose a JPEG, PNG, WebP, or AVIF image no larger than 10 MB.'
      imageMessage.classList.add('si-error')
      return
    }
    if (variantId && !state.variants.some((item) => String(item.id) === variantId && String(item.product_id) === productId)) {
      imageMessage.textContent = 'The selected variant does not belong to that product.'
      imageMessage.classList.add('si-error')
      return
    }
    const sortOrder = Number(imageForm.elements.sort_order.value)
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      imageMessage.textContent = 'Sort order must be zero or greater.'
      imageMessage.classList.add('si-error')
      return
    }

    const button = imageForm.querySelector('button[type="submit"]')
    button.disabled = true
    imageMessage.classList.remove('si-error')
    imageMessage.textContent = 'Uploading image…'
    const safeName = file.name.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100) || 'image'
    const storagePath = `${productId}/${variantId || 'product'}/${crypto.randomUUID()}-${safeName}`
    const previousPrimary = imageForm.elements.is_primary.checked
      ? state.images.find((image) => String(image.product_id) === productId && image.is_primary)
      : null
    let uploaded = false
    try {
      if (previousPrimary) {
        const { error: clearError } = await supabase.from('product_images').update({ is_primary: false }).eq('id', previousPrimary.id)
        if (clearError) throw clearError
      }
      const { error: uploadError } = await supabase.storage.from('product-images').upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
      if (uploadError) throw uploadError
      uploaded = true
      const { error: metadataError } = await supabase.from('product_images').insert({
        product_id: productId,
        variant_id: variantId,
        storage_path: storagePath,
        alt_text: String(imageForm.elements.alt_text.value || '').trim() || null,
        sort_order: sortOrder,
        is_primary: imageForm.elements.is_primary.checked
      })
      if (metadataError) throw metadataError
      await authorizeAndRender(container, { user: state.user })
      renderMessage(container, 'Image uploaded and metadata saved.')
    } catch (error) {
      if (uploaded) await supabase.storage.from('product-images').remove([storagePath])
      if (previousPrimary) await supabase.from('product_images').update({ is_primary: true }).eq('id', previousPrimary.id)
      button.disabled = false
      imageMessage.textContent = displayError(error)
      imageMessage.classList.add('si-error')
    }
  })

  container.querySelectorAll('[data-si-delete-image]').forEach((button) => {
    button.addEventListener('click', async () => {
      const image = state.images.find((item) => String(item.id) === button.dataset.siDeleteImage)
      if (!image || !window.confirm('Remove this product image?')) return
      button.disabled = true
      const imageMessage = container.querySelector('[data-si-image-message]')
      try {
        const { error: storageError } = await supabase.storage.from('product-images').remove([image.storage_path])
        if (storageError) throw storageError
        const { error: metadataError } = await supabase.from('product_images').delete().eq('id', image.id).eq('product_id', image.product_id)
        if (metadataError) throw metadataError
        await authorizeAndRender(container, { user: state.user })
      } catch (error) {
        button.disabled = false
        imageMessage.textContent = displayError(error)
        imageMessage.classList.add('si-error')
      }
    })
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return
    const data = new FormData(form)
    const productId = String(data.get('product_id') || '')
    const variantId = String(data.get('variant_id') || '')
    const modelId = model.value
    const storageId = storage.value
    const stockQuantity = Number(data.get('stock_quantity'))
    const originalPrice = Number(data.get('original_price'))
    const discountPercentage = Number(data.get('discount_percentage'))
    const selectedColor = String(data.get('color_name') || '')
    const validModel = state.models.find((entry) => entry.id === modelId)
    const validStorage = state.storageOptions.find((entry) => entry.id === storageId && entry.model_id === modelId)
    const validColor = state.colors.some((entry) => entry.storage_option_id === storageId && entry.color_name === selectedColor)

    if (!validModel || !validStorage || !validColor) {
      renderMessage(container, !validModel ? 'Please select a valid model.' : !validStorage ? 'This storage option is not available for the selected model.' : 'This color is not valid for the selected storage option.', true)
      return
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      renderMessage(container, 'Stock quantity cannot be negative.', true)
      return
    }
    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
      renderMessage(container, 'Original price must be zero or greater.', true)
      return
    }
    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      renderMessage(container, 'Discount must be between 0% and 100%.', true)
      return
    }

    const availability = stockQuantity === 0 ? 'out_of_stock' : String(data.get('visibility'))
    const productValues = {
      name: String(data.get('name') || '').trim(),
      description: String(data.get('description') || '').trim() || null,
      categoryId: String(data.get('category_id') || '')
    }
    const variantValues = {
      storageOptionId: storageId,
      colorName: selectedColor,
      sku: String(data.get('sku') || '').trim(),
      stockQuantity,
      availability,
      condition: String(data.get('condition') || '').trim(),
      originalPrice,
      discountPercentage,
      warranty: String(data.get('warranty') || '').trim()
    }

    if (!productValues.name || !productValues.categoryId || !variantValues.sku || !variantValues.condition || !variantValues.warranty) {
      renderMessage(container, 'Complete all required product and variant fields.', true)
      return
    }

    submit.disabled = true
    renderMessage(container, productId ? 'Saving inventory changes…' : 'Creating product and variant…')
    try {
      if (productId && variantId) {
        const existingProduct = state.products.find((item) => String(item.id) === productId)
        if (existingProduct && existingProduct.manufacturer_model_id !== modelId) {
          throw new Error('Manufacturer and model cannot be changed on an existing product; create a new product for a different model.')
        }
      }
      await saveAdminInventoryItem(supabase, {
        productId: productId || null,
        variantId: variantId || null,
        name: productValues.name,
        description: productValues.description,
        categoryId: productValues.categoryId,
        modelId,
        ...variantValues
      })
      await authorizeAndRender(container, { user: state.user })
      renderMessage(container, productId ? 'Product and variant updated.' : 'Product and variant created.')
    } catch (error) {
      submit.disabled = false
      renderMessage(container, displayError(error), true)
    }
  })

  container.querySelector('[data-si-signout]').addEventListener('click', async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      renderMessage(container, 'Sign-out failed. Please try again.', true)
      return
    }
    supabaseAuthState.setSession(null, 'SIGNED_OUT')
    renderSignIn(container)
  })
  container.querySelector('[data-si-refresh]').addEventListener('click', () => authorizeAndRender(container, { user: state.user }))
  container.querySelectorAll('[data-si-edit-product]').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = productByIdSafe(state.products, button.dataset.siEditProduct)
      const variant = state.variants.find((item) => String(item.id) === button.dataset.siEditVariant)
      if (!product || !variant) return
      form.elements.product_id.value = product.id
      form.elements.variant_id.value = variant.id
      form.elements.name.value = product.name
      form.elements.description.value = product.description || ''
      form.elements.category_id.value = product.category_id
      manufacturer.value = lookups.seriesById.get(lookups.modelById.get(product.manufacturer_model_id)?.series_id)?.manufacturer_id || ''
      updateSeries()
      series.value = lookups.modelById.get(product.manufacturer_model_id)?.series_id || ''
      updateModels()
      model.value = product.manufacturer_model_id
      updateStorage()
      storage.value = variant.model_storage_option_id
      await updateColors(variant.color_name)
      manufacturer.disabled = true
      series.disabled = true
      model.disabled = true
      container.querySelector('[data-si-model-lock]').hidden = false
      form.elements.sku.value = variant.sku
      form.elements.condition.value = variant.condition
      stock.value = variant.stock_quantity
      form.elements.warranty.value = variant.warranty
      price.value = variant.original_price
      discount.value = variant.discount_percentage
      visibility.value = variant.availability === 'hidden' ? 'hidden' : 'active'
      form.querySelector('button[type="submit"]').textContent = 'SAVE PRODUCT + VARIANT'
      container.querySelector('[data-si-cancel-edit]').hidden = false
      updatePrice()
      form.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
  container.querySelector('[data-si-cancel-edit]').addEventListener('click', () => authorizeAndRender(container, { user: state.user }))
}

function bindAdminOperations(container, state) {
  container.querySelectorAll('[data-si-order-update]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const orderId = form.dataset.siOrderUpdate
      const button = form.querySelector('button[type="submit"]')
      button.disabled = true
      try {
        const values = new FormData(form)
        await updateAdminOrder(supabase, orderId, {
          status: values.get('status'),
          paymentStatus: values.get('paymentStatus')
        })
        await authorizeAndRender(container, { user: state.user })
        const message = container.querySelector('[data-si-operations-message]')
        if (message) message.textContent = 'Order status updated.'
      } catch (error) {
        button.disabled = false
        const message = container.querySelector('[data-si-operations-message]')
        if (message) {
          message.textContent = displayError(error)
          message.classList.add('si-error')
        }
      }
    })
  })

  container.querySelectorAll('[data-si-repair-update]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const repairId = form.dataset.siRepairUpdate
      const button = form.querySelector('button[type="submit"]')
      const values = new FormData(form)
      button.disabled = true
      try {
        await updateAdminRepairRequest(supabase, repairId, {
          status: values.get('status'),
          contacted: values.has('contacted'),
          repairCost: values.get('repairCost'),
          communicationNotes: values.get('communicationNotes')
        })
        await authorizeAndRender(container, { user: state.user })
        const message = container.querySelector('[data-si-operations-message]')
        if (message) message.textContent = 'Repair request updated.'
      } catch (error) {
        button.disabled = false
        const message = container.querySelector('[data-si-operations-message]')
        if (message) {
          message.textContent = displayError(error)
          message.classList.add('si-error')
        }
      }
    })
  })
}

function productByIdSafe(products, id) {
  return products.find((product) => String(product.id) === String(id))
}

export async function renderSupabaseInventory(container) {
  if (!supabaseConfiguration.configured || !supabase) {
    renderSignIn(container, supabaseConfiguration.message)
    return
  }
  renderSignIn(container)
  const session = supabaseAuthState.getSession()
  if (session) await authorizeAndRender(container, session)
}

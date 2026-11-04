import { supabase, supabaseAuthState, supabaseConfiguration } from './supabase.js'
import {
  listAdminOrders,
  listAdminRepairRequests,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  REPAIR_STATUSES,
  hasConfirmedAdminVariantImageReview,
  loadAdminProductImages,
  manageAdminCatalogItem,
  removeAdminProductImage,
  reorderAdminProductImages,
  requiresAdminVariantImageReview,
  resolveAdminVariantAvailability,
  saveAdminProductImages,
  saveAdminInventoryItem,
  setAdminProductImagePrimary,
  setAdminProductActive,
  setAdminVariantActive,
  updateAdminOrder,
  updateAdminRepairRequest,
  validateAdminProductImages
} from './admin-workflows.js'
import {
  ANNOUNCEMENT_MEDIA_BUCKET,
  deleteAnnouncementMedia,
  uploadAnnouncementMedia
} from './announcements.js'

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

const ADMIN_SECTIONS = [
  ['overview', 'Overview'],
  ['bill-board', 'Bill Board'],
  ['catalog', 'Catalog Management'],
  ['products', 'Product Listing'],
  ['orders', 'Orders & Transfers'],
  ['repairs', 'Repairs']
]

function renderShell(container, content, section = 'overview') {
  container.innerHTML = `
    <div class="container supabase-inventory">
      <header class="si-header">
        <div>
          <p class="eyebrow">OPERATIONS CONSOLE</p>
          <h1>ARCADIA ADMIN</h1>
        </div>
        <nav aria-label="Admin navigation">
          <a class="secondary-btn" href="#admin">Admin dashboard</a>
          <a class="secondary-btn" href="#home">Storefront</a>
        </nav>
      </header>
      <nav class="si-nav" aria-label="Administration sections">
        ${ADMIN_SECTIONS.map(([id, label]) => `<a class="secondary-btn${section === id ? ' active' : ''}" href="#admin/${id}"${section === id ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`).join('')}
      </nav>
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

async function authorizeAndRender(container, session, section = 'overview') {
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
    const [categories, manufacturers, series, models, storageOptions, colors, products, variants, images, announcements, statsResult, ordersResult, repairsResult] = await Promise.all([
      readAll('categories', 'id,name,slug,active'),
      readAll('manufacturers', 'id,name'),
      readAll('manufacturer_series', 'id,manufacturer_id,name'),
      readAll('manufacturer_models', 'id,series_id,name,ram_options,verified'),
      readAll('model_storage_options', 'id,model_id,storage_label'),
      readAll('model_storage_colors', 'storage_option_id,color_name'),
      readAll('products', 'id,manufacturer_model_id,category_id,name,description,active,created_at'),
      readAll('product_variants', 'id,product_id,manufacturer_model_id,model_storage_option_id,color_name,sku,stock_quantity,availability,condition,original_price,discount_percentage,discount_amount,final_price,warranty,battery_health,ram,face_id,true_tone,display_details,battery_details,camera_details,speaker_details,microphone_details,charging_details,sim_details,notes'),
      readAll('product_images', 'id,product_id,variant_id,storage_path,alt_text,sort_order,is_primary'),
      readAll('announcements', 'id,label,title,message,media_path,media_type,published,sort_order,created_at,updated_at'),
      supabase.rpc('admin_dashboard_stats').then(({ data, error }) => {
        if (error) throw error
        if (!data || typeof data !== 'object') throw new Error('Dashboard statistics could not be loaded.')
        return data
      }),
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
      announcements,
      stats: statsResult,
      orders: ordersResult.data?.orders || [],
      orderItems: ordersResult.data?.items || [],
      ordersError: ordersResult.error || null,
      repairRequests: repairsResult.data || [],
      repairsError: repairsResult.error || null,
      user: session.user,
      section
    })
  } catch (loadError) {
    renderShell(container, `
      <section class="si-access">
        <h2>Inventory could not be loaded</h2>
        <p class="si-message si-error" role="alert">${escapeHtml(displayError(loadError))}</p>
        <button class="secondary-btn" data-si-retry type="button">RETRY</button>
      </section>
    `)
    container.querySelector('[data-si-retry]').addEventListener('click', () => authorizeAndRender(container, session, section))
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
  const categoryById = new Map(state.categories.map((category) => [category.id, category]))
  const modelById = new Map(state.models.map((model) => [model.id, model]))
  const seriesById = new Map(state.series.map((series) => [series.id, series]))
  const manufacturerById = new Map(state.manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]))
  const storageById = new Map(state.storageOptions.map((storage) => [storage.id, storage]))
  const imageCountByProduct = new Map()
  for (const image of state.images) imageCountByProduct.set(image.product_id, (imageCountByProduct.get(image.product_id) || 0) + 1)
  const activeSection = ['inventory', 'images'].includes(state.section) ? 'products' : state.section
  const announcementRows = state.announcements.map((announcement) => `
    <article class="si-operation-card">
      <header><strong>${escapeHtml(announcement.title)}</strong><span>${announcement.published ? 'Published' : 'Unpublished'}</span></header>
      <p>${escapeHtml(announcement.label)} · Order ${Number(announcement.sort_order)}</p>
      <p>${escapeHtml(announcement.message)}</p>
      <p>${announcement.media_type ? `${escapeHtml(announcement.media_type)} · ${escapeHtml(announcement.media_path)}` : 'No media attached'}</p>
      <div class="si-form-actions">
        <button class="admin-action" type="button" data-si-edit-announcement="${escapeHtml(announcement.id)}">EDIT</button>
        <button class="admin-action" type="button" data-si-publish-announcement="${escapeHtml(announcement.id)}">${announcement.published ? 'UNPUBLISH' : 'PUBLISH'}</button>
        <button class="admin-action danger" type="button" data-si-delete-announcement="${escapeHtml(announcement.id)}">DELETE</button>
      </div>
    </article>
  `).join('') || '<p class="si-help">No announcements have been created.</p>'
  const manufacturerOptions = state.manufacturers.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
  const seriesOptions = state.series.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
  const modelOptions = state.models.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
  const storageOptions = state.storageOptions.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.storage_label)}</option>`).join('')
  const catalogRows = (items, entity, describe, parent) => items.map((item) => `
    <tr>
      <td>${escapeHtml(describe(item))}</td>
      <td>${escapeHtml(parent(item))}</td>
      <td><button class="admin-action" type="button" data-si-edit-catalog="${escapeHtml(entity)}" data-id="${escapeHtml(item.id)}">EDIT</button></td>
    </tr>
  `).join('') || '<tr><td colspan="3">No catalog entries.</td></tr>'
  const seriesRows = catalogRows(state.series, 'series', (item) => item.name, (item) => manufacturerById.get(item.manufacturer_id)?.name || 'Unknown manufacturer')
  const modelRows = catalogRows(state.models, 'model', (item) => `${item.name} · RAM ${item.ram_options?.join(', ') || 'not set'} · ${item.verified ? 'Verified' : 'Unverified'}`, (item) => {
    const parentSeries = seriesById.get(item.series_id)
    return parentSeries ? `${manufacturerById.get(parentSeries.manufacturer_id)?.name || ''} / ${parentSeries.name}` : 'Unknown series'
  })
  const storageRows = catalogRows(state.storageOptions, 'storage', (item) => item.storage_label, (item) => modelById.get(item.model_id)?.name || 'Unknown model')
  const colorRows = state.colors.map((item) => `
    <tr>
      <td>${escapeHtml(item.color_name)}</td>
      <td>${escapeHtml(storageById.get(item.storage_option_id)?.storage_label || 'Unknown storage')}</td>
      <td><button class="admin-action" type="button" data-si-edit-catalog="color" data-parent-id="${escapeHtml(item.storage_option_id)}" data-name="${escapeHtml(item.color_name)}">EDIT</button></td>
    </tr>
  `).join('') || '<tr><td colspan="3">No catalog entries.</td></tr>'

  const inventoryRows = state.products.flatMap((product) => {
    const model = modelById.get(product.manufacturer_model_id)
    const series = model ? seriesById.get(model.series_id) : null
    const manufacturer = series ? manufacturerById.get(series.manufacturer_id) : null
    const productVariants = state.variants.filter((variant) => variant.product_id === product.id)
    const productActions = `<button class="admin-action" type="button" data-si-add-variant="${escapeHtml(product.id)}">ADD VARIANT</button><button class="admin-action${product.active ? ' danger' : ''}" type="button" data-si-product-active="${escapeHtml(product.id)}" data-active="${product.active ? 'true' : 'false'}">${product.active ? 'DEACTIVATE PRODUCT' : 'ACTIVATE PRODUCT'}</button>`
    if (!productVariants.length) {
      return [`<tr><td><strong>${escapeHtml(product.name)}</strong>${product.active ? '' : '<small>Archived</small>'}</td><td>${escapeHtml(categoryById.get(product.category_id)?.name || '—')}</td><td colspan="8">No variants</td><td>${productActions}</td></tr>`]
    }
    return productVariants.map((variant, index) => {
      const storage = storageById.get(variant.model_storage_option_id)
      const price = formatCurrency(variant.final_price)
      const modelLabel = [manufacturer?.name, series?.name, model?.name].filter(Boolean).join(' / ')
      return `<tr>
        <td><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(modelLabel)}${product.active ? '' : ' · Archived'}</small></td>
        <td>${escapeHtml(categoryById.get(product.category_id)?.name || '—')}</td>
        <td>${escapeHtml(storage?.storage_label || '—')} / ${escapeHtml(variant.color_name)}${variant.ram ? `<small>${escapeHtml(variant.ram)} RAM</small>` : ''}</td>
        <td>${escapeHtml(variant.sku)}</td>
        <td>${formatCurrency(variant.original_price)}<small>${Number(variant.discount_percentage)}% off · ${price}</small></td>
        <td>${Number(variant.stock_quantity)}</td>
        <td>${escapeHtml(variant.condition)}</td>
        <td>${escapeHtml(variant.warranty)}</td>
        <td>${variant.availability === 'hidden' ? 'Hidden' : variant.availability === 'out_of_stock' ? 'Out of Stock' : 'Active'}</td>
        <td>${imageCountByProduct.get(product.id) || 0} image(s)</td>
        <td><button class="admin-action" type="button" data-si-edit-product="${escapeHtml(product.id)}" data-si-edit-variant="${escapeHtml(variant.id)}">EDIT</button>${variant.availability === 'hidden' ? `<button class="admin-action" type="button" data-si-variant-active="${escapeHtml(variant.id)}" data-active="false">RESTORE VARIANT</button>` : `<button class="admin-action danger" type="button" data-si-variant-active="${escapeHtml(variant.id)}" data-active="true">REMOVE VARIANT</button>`}${index === 0 ? productActions : ''}</td>
      </tr>`
    })
  }).join('') || '<tr><td colspan="11">No Supabase inventory records yet.</td></tr>'
  const orderRows = state.orders.map((order) => {
    const items = state.orderItems?.filter((item) => item.order_id === order.id) || []
    return `<article class="si-operation-card">
      <header><strong>${escapeHtml(order.order_number)}</strong><span>${escapeHtml(new Date(order.created_at).toLocaleString())}</span></header>
      <p>${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_email)} · ${escapeHtml(order.customer_phone)}</p>
      <p>${escapeHtml(order.delivery_method)}${order.delivery_method === 'delivery' ? ` · ${escapeHtml([order.delivery_address, order.delivery_city, order.delivery_state].filter(Boolean).join(', '))}` : ''}</p>
      <ul>${items.map((item) => `<li>${escapeHtml(item.product_name)} ${item.variant_description ? `· ${escapeHtml(item.variant_description)}` : ''} · ${escapeHtml(item.sku)} × ${Number(item.quantity)} · ${formatCurrency(item.line_total)}</li>`).join('') || '<li>Order items unavailable.</li>'}</ul>
      <p>${escapeHtml(order.payment_method || 'Payment method unavailable')} · ${formatCurrency(order.grand_total)} · ${formatCurrency(order.subtotal)} subtotal · ${formatCurrency(order.delivery_fee)} delivery</p>
      <p>${order.payment_proof_url ? `<a href="${escapeHtml(order.payment_proof_url)}" target="_blank" rel="noopener noreferrer"><img class="si-payment-proof" src="${escapeHtml(order.payment_proof_url)}" alt="Payment proof for order ${escapeHtml(order.order_number)}" />VIEW PAYMENT PROOF</a>` : 'No payment proof uploaded.'}</p>
      <form class="si-operation-form" data-si-order-update="${escapeHtml(order.id)}">
        <label>Order status<select name="status">${ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
        <label>Payment status<select name="paymentStatus">${PAYMENT_STATUSES.map((status) => `<option value="${status}" ${status === order.payment_status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
        <button class="secondary-btn" type="submit">SAVE ORDER STATUS</button>
        ${order.payment_status === 'paid' ? '' : `<button class="admin-action" type="button" data-si-confirm-payment="${escapeHtml(order.id)}">CONFIRM PAYMENT</button>`}
      </form>
    </article>`
  }).join('') || '<p class="si-help">No orders are available.</p>'
  const repairRows = state.repairRequests.map((repair) => `<article class="si-operation-card">
    <header><strong>${escapeHtml(repair.ticket_number)}</strong><span>${escapeHtml(repair.created_at ? new Date(repair.created_at).toLocaleString() : '')}</span></header>
    <p>${escapeHtml(repair.customer_name)} · ${escapeHtml(repair.customer_email)} · ${escapeHtml(repair.customer_phone)}</p>
    <p>${escapeHtml(repair.device)}${repair.device_details ? ` · ${escapeHtml(repair.device_details)}` : ''}</p>
    <p><strong>${escapeHtml(repair.problem)}</strong>${repair.description ? `<br />${escapeHtml(repair.description)}` : ''}</p>
    <p>Preferred date: ${escapeHtml(repair.preferred_date || 'Not specified')}</p>
    <form class="si-operation-form" id="repair-${escapeHtml(repair.id)}" data-si-repair-update="${escapeHtml(repair.id)}">
      <label>Status<select name="status">${REPAIR_STATUSES.map((status) => `<option value="${status}" ${status === repair.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
      <label>Repair cost<input name="repairCost" type="number" min="0" step="0.01" value="${repair.repair_cost == null ? '' : Number(repair.repair_cost)}" /></label>
      <label class="si-operation-wide">Diagnosis<textarea name="diagnosis" rows="2">${escapeHtml(repair.diagnosis || '')}</textarea></label>
      <label class="si-operation-check"><input name="contacted" type="checkbox" ${repair.contacted ? 'checked' : ''} /> Customer contacted</label>
      <label class="si-operation-wide">Internal notes<textarea name="communicationNotes" rows="3">${escapeHtml(repair.communication_notes || '')}</textarea></label>
      <button class="secondary-btn" type="submit">SAVE REPAIR UPDATE</button>
    </form>${repair.customer_email ? `<a class="secondary-btn" href="mailto:${escapeHtml(repair.customer_email)}?subject=${encodeURIComponent(`Repair ${repair.ticket_number}`)}">EMAIL CUSTOMER</a>` : ''}
  </article>`).join('') || '<p class="si-help">No repair requests are available.</p>'

  renderShell(container, `
    <div class="si-toolbar">
      <div>${escapeHtml(state.user.email || 'Admin')}</div>
      <button class="admin-logout" type="button" data-si-signout>SIGN OUT</button>
    </div>
    <section class="si-section" data-si-section="overview" ${activeSection === 'overview' ? '' : 'hidden'} aria-labelledby="si-overview-title">
      <h2 id="si-overview-title">Overview</h2>
      <div class="si-metric-grid">
        <article><strong>${Number(state.stats.sales || 0) ? formatCurrency(state.stats.sales) : formatCurrency(0)}</strong><span>Sales</span></article>
        <article><strong>${Number(state.stats.orders || 0)}</strong><span>Orders</span></article>
        <article><strong>${Number(state.stats.products || 0)}</strong><span>Products</span></article>
        <article><strong>${Number(state.stats.variants || 0)}</strong><span>Variants</span></article>
        <article><strong>${Number(state.stats.repairs || 0)}</strong><span>Repairs</span></article>
        <article><strong>${Number(state.stats.pending_transfers || 0)}</strong><span>Pending bank transfers</span></article>
      </div>
      <button class="secondary-btn" type="button" data-si-refresh>REFRESH STATISTICS</button>
    </section>
    <section class="si-section" data-si-section="bill-board" ${activeSection === 'bill-board' ? '' : 'hidden'} aria-labelledby="si-announcements-title">
      <div class="si-section-heading"><h2 id="si-announcements-title">Bill Board announcements</h2><button class="secondary-btn" type="button" data-si-reset-announcement>NEW ANNOUNCEMENT</button></div>
      <p class="si-help">Only published announcements appear on the customer homepage. Published entries rotate in the board.</p>
      <form class="si-form" data-si-announcement-form>
        <input type="hidden" name="id" />
        <input type="hidden" name="mediaPath" />
        <input type="hidden" name="mediaType" />
        <label>Label<input name="label" maxlength="120" value="ARCADIA MOBILE" required /></label>
        <label>Title<input name="title" maxlength="200" required /></label>
        <label class="si-wide">Message<textarea name="message" rows="4" maxlength="4000" required></textarea></label>
        <label>Display order<input name="sortOrder" type="number" min="0" step="1" value="0" required /></label>
        <label>Image or video<input name="media" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" /></label>
        <label class="si-operation-check"><input name="published" type="checkbox" /> Published on homepage</label>
        <p class="si-message si-wide" data-si-announcement-message role="status"></p>
        <div class="si-form-actions si-wide"><button class="primary-btn" type="submit">SAVE ANNOUNCEMENT</button><button class="secondary-btn" type="button" data-si-reset-announcement>RESET FORM</button></div>
      </form>
      <h3>Existing announcements</h3>${announcementRows}
    </section>
    <section class="si-section" data-si-section="catalog" ${activeSection === 'catalog' ? '' : 'hidden'} aria-labelledby="si-catalog-title">
      <h2 id="si-catalog-title">Catalog Management</h2>
      <p class="si-help">Existing master catalog entries are never deleted. Edits preserve catalog relationships used by inventory.</p>
      <form class="si-form si-catalog-manage-form" data-si-catalog-form="manufacturer"><input type="hidden" name="id" /><label>Manufacturer<input name="name" maxlength="120" required /></label><button class="primary-btn" type="submit">SAVE MANUFACTURER</button><button class="secondary-btn" type="reset">NEW</button></form>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Manufacturer</th><th>Parent</th><th>Actions</th></tr></thead><tbody>${catalogRows(state.manufacturers, 'manufacturer', (item) => item.name, () => '—')}</tbody></table></div>
      <form class="si-form si-catalog-manage-form" data-si-catalog-form="series"><input type="hidden" name="id" /><label>Manufacturer<select name="parent_id" required><option value="">Select manufacturer</option>${manufacturerOptions}</select></label><label>Series<input name="name" maxlength="120" required /></label><button class="primary-btn" type="submit">SAVE SERIES</button><button class="secondary-btn" type="reset">NEW</button></form>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Series</th><th>Manufacturer</th><th>Actions</th></tr></thead><tbody>${seriesRows}</tbody></table></div>
      <form class="si-form si-catalog-manage-form" data-si-catalog-form="model"><input type="hidden" name="id" /><label>Series<select name="parent_id" required><option value="">Select series</option>${seriesOptions}</select></label><label>Model<input name="name" maxlength="120" required /></label><label>RAM options (comma-separated)<input name="ramOptions" maxlength="500" /></label><label class="si-operation-check"><input name="verified" type="checkbox" /> Verified against a reliable reference</label><button class="primary-btn" type="submit">SAVE MODEL</button><button class="secondary-btn" type="reset">NEW</button></form>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Model / RAM / verification</th><th>Series</th><th>Actions</th></tr></thead><tbody>${modelRows}</tbody></table></div>
      <form class="si-form si-catalog-manage-form" data-si-catalog-form="storage"><input type="hidden" name="id" /><label>Model<select name="parent_id" required><option value="">Select model</option>${modelOptions}</select></label><label>Storage option<input name="name" maxlength="120" required /></label><button class="primary-btn" type="submit">SAVE STORAGE</button><button class="secondary-btn" type="reset">NEW</button></form>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Storage</th><th>Model</th><th>Actions</th></tr></thead><tbody>${storageRows}</tbody></table></div>
      <form class="si-form si-catalog-manage-form" data-si-catalog-form="color"><input type="hidden" name="old_name" /><label>Storage option<select name="parent_id" required><option value="">Select storage</option>${storageOptions}</select></label><label>Color<input name="name" maxlength="120" required /></label><button class="primary-btn" type="submit">ADD COLOR</button><button class="secondary-btn" type="reset">NEW</button></form>
      <div class="admin-table-wrap"><table class="admin-table si-table"><thead><tr><th>Color</th><th>Storage option</th><th>Actions</th></tr></thead><tbody>${colorRows}</tbody></table></div>
      <p class="si-message" data-si-catalog-message role="status"></p>
    </section>
    ${categoryNotice}
    <section class="si-section" data-si-section="products" ${activeSection === 'products' ? '' : 'hidden'} aria-labelledby="si-product-title">
      <div class="si-section-heading">
        <h2 id="si-product-title">${categoryOptions ? 'Product Listing' : 'Inventory form unavailable'}</h2>
        <button class="secondary-btn" type="button" data-si-refresh>REFRESH INVENTORY</button>
      </div>
      <div class="admin-table-wrap"><table class="admin-table si-table">
        <thead><tr><th>Product</th><th>Category</th><th>Variant</th><th>SKU</th><th>Price / discount</th><th>Stock</th><th>Condition</th><th>Warranty</th><th>Visibility</th><th>Images</th><th>Actions</th></tr></thead>
        <tbody>${inventoryRows}</tbody>
      </table></div>
      <form class="si-form si-product-form" data-si-product-form>
        <input type="hidden" name="product_id" />
        <input type="hidden" name="variant_id" />
        <input type="hidden" name="operation" value="save" />
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
            <label>RAM<input name="ram" maxlength="80" /></label>
            <label>Battery health (%)<input name="battery_health" type="number" min="0" max="100" step="1" /></label>
            <label>Original price (₦)<input name="original_price" type="number" min="0" step="0.01" value="0" required /></label>
            <label>Discount (%)<input name="discount_percentage" type="number" min="0" max="100" step="0.01" value="0" required /></label>
            <label>Storefront visibility<select name="visibility"><option value="active">Active (can show when out of stock)</option><option value="hidden">Hidden (excluded from storefront)</option></select></label>
            <div class="si-price-summary"><span>Discount amount <strong data-si-discount>₦ 0.00</strong></span><span>Final price <strong data-si-final>₦ 0.00</strong></span></div>
          </div>
          <p class="si-help">Final price is generated by the database. Active with zero stock is shown as Out of Stock; Hidden is a separate setting that excludes the listing from the storefront.</p>
          <div class="si-cascade-grid">
            <label>Face ID<input name="faceId" maxlength="200" /></label>
            <label>True Tone<input name="trueTone" maxlength="200" /></label>
            <label>Display<input name="displayDetails" maxlength="500" /></label>
            <label>Battery<input name="batteryDetails" maxlength="500" /></label>
            <label>Camera<input name="cameraDetails" maxlength="500" /></label>
            <label>Speaker<input name="speakerDetails" maxlength="500" /></label>
            <label>Microphone<input name="microphoneDetails" maxlength="500" /></label>
            <label>Charging<input name="chargingDetails" maxlength="500" /></label>
            <label>SIM / network<input name="simDetails" maxlength="500" /></label>
            <label class="si-wide">Variant notes<textarea name="notes" rows="3" maxlength="4000"></textarea></label>
          </div>
        </fieldset>
        <fieldset class="si-catalog-fieldset si-product-images">
          <legend>Product images</legend>
          <p class="si-help">Add multiple JPEG, PNG, WebP, or AVIF images (maximum 10 MB each). Images are uploaded to the existing product-images bucket and linked to this variant.</p>
          <label>Choose images<input name="product_images" data-si-product-images type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple /><span class="si-help" data-si-selected-image-names>No images selected</span></label>
          <div class="si-pending-images" data-si-pending-images aria-live="polite"></div>
          <h3>Saved images</h3>
          <div class="si-warning si-image-variant-warning" data-si-image-variant-warning hidden>
            Storage or colour is changing. Review the saved images below; they remain attached to this variant and may no longer represent it. You may keep them, remove them, or add replacements.
            <label><input type="checkbox" data-si-confirm-image-variant-change /> I reviewed the images and confirm the change.</label>
          </div>
          <div class="si-existing-images" data-si-existing-images><p class="si-help">Choose an existing listing to manage its images.</p></div>
        </fieldset>
        <p class="si-message" data-si-message role="status"></p>
        <div class="si-form-actions"><button class="primary-btn" type="submit" ${categoryOptions ? '' : 'disabled'}>${categoryOptions ? 'SAVE PRODUCT LISTING' : 'CATEGORY REQUIRED'}</button><button class="secondary-btn" type="button" data-si-cancel-edit hidden>CANCEL</button></div>
      </form>
    </section>
    <section class="si-section" data-si-section="orders" ${activeSection === 'orders' ? '' : 'hidden'} aria-labelledby="si-orders-title">
      <div class="si-section-heading"><h2 id="si-orders-title">Orders and bank transfers</h2><button class="secondary-btn" type="button" data-si-refresh>REFRESH</button></div>
      <p>Bank transfer verifications pending: <strong>${Number(state.stats.pending_transfers || 0)}</strong></p>
      <p class="si-message" data-si-operations-message role="status"></p>
      ${state.ordersError ? `<p class="si-message si-error" role="alert">Order queue could not be loaded. ${escapeHtml(displayError(state.ordersError))}</p>` : orderRows}
    </section>
    <section class="si-section" data-si-section="repairs" ${activeSection === 'repairs' ? '' : 'hidden'} aria-labelledby="si-repairs-title">
      <div class="si-section-heading"><h2 id="si-repairs-title">Repair requests</h2><button class="secondary-btn" type="button" data-si-refresh>REFRESH</button></div>
      <p class="si-message" data-si-operations-message role="status"></p>
      ${state.repairsError ? `<p class="si-message si-error" role="alert">Repair queue could not be loaded. ${escapeHtml(displayError(state.repairsError))}</p>` : repairRows}
    </section>
  `, activeSection)

  container.querySelectorAll('[data-si-section]').forEach((section) => { section.hidden = section.dataset.siSection !== activeSection })

  bindInventory(container, state, { modelById, seriesById })
  bindAdminOperations(container, state)
  bindAnnouncementManagement(container, state)
  bindCatalogManagement(container, state)
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
  let productColors = []

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
    productColors = []
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
    productColors = data || []
    color.innerHTML = `<option value="">${productColors.length ? 'Select color' : 'No catalog colors'}</option>${productColors.map((entry) => `<option value="${escapeHtml(entry.color_name)}">${escapeHtml(entry.color_name)}</option>`).join('')}`
    color.disabled = productColors.length === 0
    if (productColors.some((entry) => entry.color_name === preferredColor)) color.value = preferredColor
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
  storage.addEventListener('change', updateVariantImageWarning)
  color.addEventListener('change', updateVariantImageWarning)
  price.addEventListener('input', updatePrice)
  discount.addEventListener('input', updatePrice)
  stock.addEventListener('input', updateStockAvailability)
  updateSeries()
  updatePrice()

  const imageInput = form.elements.product_images
  const pendingImageList = container.querySelector('[data-si-pending-images]')
  const existingImageList = container.querySelector('[data-si-existing-images]')
  const imageVariantWarning = container.querySelector('[data-si-image-variant-warning]')
  const imageVariantConfirmation = container.querySelector('[data-si-confirm-image-variant-change]')
  let pendingFiles = []
  let pendingPrimaryIndex = null
  let pendingUploadRecords = null
  let pendingPreviewUrls = []
  let editingVariant = null

  const imageGroup = () => {
    const productId = form.elements.product_id.value
    const variantId = form.elements.variant_id.value
    if (!productId) return []
    return state.images
      .filter((image) => String(image.product_id) === productId
        && (!image.variant_id || String(image.variant_id) === variantId))
      .sort((left, right) => Number(left.sort_order) - Number(right.sort_order))
  }
  const renderPendingImages = () => {
    pendingPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    pendingPreviewUrls = []
    container.querySelector('[data-si-selected-image-names]').textContent = pendingFiles.length
      ? pendingFiles.map((file) => file.name).join(', ')
      : 'No images selected'
    pendingImageList.innerHTML = pendingFiles.map((file, index) => {
      const url = URL.createObjectURL(file)
      pendingPreviewUrls.push(url)
      return `<article class="si-image-card">
        <img src="${escapeHtml(url)}" alt="Preview of ${escapeHtml(file.name)}" />
        <div><strong>${escapeHtml(file.name)}</strong><small>${(file.size / 1048576).toFixed(2)} MB</small></div>
        <label class="si-image-primary"><input type="radio" name="pending_primary_image" value="${index}" ${pendingPrimaryIndex === index ? 'checked' : ''} /> Primary</label>
        <div class="si-image-actions">
          <button class="admin-action" type="button" data-si-pending-up="${index}" ${index === 0 ? 'disabled' : ''}>MOVE UP</button>
          <button class="admin-action" type="button" data-si-pending-down="${index}" ${index === pendingFiles.length - 1 ? 'disabled' : ''}>MOVE DOWN</button>
          <button class="admin-action danger" type="button" data-si-pending-remove="${index}">REMOVE</button>
        </div>
      </article>`
    }).join('')
  }
  const renderExistingImages = () => {
    const images = imageGroup()
    existingImageList.innerHTML = images.map((image, index) => {
      const imageUrl = supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl
      return `<article class="si-image-card">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.alt_text || 'Product image')}" />
        <div><strong>${escapeHtml(image.alt_text || 'Product image')}</strong><small>${image.variant_id ? 'Variant image' : 'Product image'} · Order ${Number(image.sort_order)}</small></div>
        <label class="si-image-primary"><input type="radio" name="saved_primary_image" value="${escapeHtml(image.id)}" ${image.is_primary ? 'checked' : ''} data-si-primary-image="${escapeHtml(image.id)}" /> Primary</label>
        <div class="si-image-actions">
          <button class="admin-action" type="button" data-si-image-up="${escapeHtml(image.id)}" ${index === 0 ? 'disabled' : ''}>MOVE UP</button>
          <button class="admin-action" type="button" data-si-image-down="${escapeHtml(image.id)}" ${index === images.length - 1 ? 'disabled' : ''}>MOVE DOWN</button>
          <button class="admin-action danger" type="button" data-si-remove-image="${escapeHtml(image.id)}">REMOVE</button>
        </div>
      </article>`
    }).join('') || `<p class="si-help">${form.elements.product_id.value ? 'No saved images for this product variant yet.' : 'Save or select an existing listing to manage its images.'}</p>`
  }
  const setImageMessage = (message, isError = false) => {
    renderMessage(container, message, isError)
  }
  function updateVariantImageWarning() {
    const nextDetails = {
      storageOptionId: storage.value,
      colorName: color.value
    }
    imageVariantWarning.hidden = !requiresAdminVariantImageReview(editingVariant, nextDetails, imageGroup())
    if (!imageVariantWarning.hidden) imageVariantConfirmation.checked = false
  }
  const clearPendingImages = () => {
    pendingFiles = []
    pendingPrimaryIndex = null
    pendingUploadRecords = null
    imageInput.value = ''
    renderPendingImages()
  }

  imageInput.addEventListener('change', () => {
    pendingFiles = Array.from(imageInput.files || [])
    pendingUploadRecords = null
    try {
      validateAdminProductImages(pendingFiles)
      const currentImages = imageGroup()
      pendingPrimaryIndex = currentImages.some((image) => image.is_primary) || !pendingFiles.length ? null : 0
      setImageMessage('')
    } catch (error) {
      pendingPrimaryIndex = null
      setImageMessage(error.message, true)
    }
    renderPendingImages()
  })
  pendingImageList.addEventListener('change', (event) => {
    if (event.target.name === 'pending_primary_image') {
      pendingPrimaryIndex = Number(event.target.value)
      pendingUploadRecords = null
    }
  })
  pendingImageList.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return
    const removeIndex = Number(button.dataset.siPendingRemove)
    const upIndex = Number(button.dataset.siPendingUp)
    const downIndex = Number(button.dataset.siPendingDown)
    if (button.hasAttribute('data-si-pending-remove')) {
      pendingUploadRecords = null
      pendingFiles.splice(removeIndex, 1)
      if (pendingPrimaryIndex === removeIndex) pendingPrimaryIndex = null
      else if (pendingPrimaryIndex > removeIndex) pendingPrimaryIndex -= 1
      renderPendingImages()
      return
    }
    const targetIndex = button.hasAttribute('data-si-pending-up') ? upIndex - 1 : downIndex + 1
    if (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < pendingFiles.length) {
      pendingUploadRecords = null
      ;[pendingFiles[targetIndex], pendingFiles[button.hasAttribute('data-si-pending-up') ? upIndex : downIndex]] =
        [pendingFiles[button.hasAttribute('data-si-pending-up') ? upIndex : downIndex], pendingFiles[targetIndex]]
      if (pendingPrimaryIndex === targetIndex) pendingPrimaryIndex = button.hasAttribute('data-si-pending-up') ? upIndex : downIndex
      else if (pendingPrimaryIndex === (button.hasAttribute('data-si-pending-up') ? upIndex : downIndex)) pendingPrimaryIndex = targetIndex
      renderPendingImages()
    }
  })
  existingImageList.addEventListener('change', async (event) => {
    const imageId = event.target.dataset.siPrimaryImage
    if (!imageId) return
    const image = state.images.find((entry) => String(entry.id) === imageId)
    const previous = state.images.find((entry) => entry.product_id === image?.product_id && entry.is_primary)
    pendingUploadRecords = null
    pendingPrimaryIndex = null
    event.target.disabled = true
    try {
      await setAdminProductImagePrimary(supabase, image, previous)
      state.images.forEach((entry) => {
        if (entry.product_id === image.product_id) entry.is_primary = entry.id === image.id
      })
      renderExistingImages()
      setImageMessage('Primary image updated.')
    } catch (error) {
      renderExistingImages()
      event.target.disabled = false
      setImageMessage(displayError(error), true)
    }
  })
  existingImageList.addEventListener('click', async (event) => {
    const button = event.target.closest('button')
    if (!button) return
    const imageId = button.dataset.siRemoveImage || button.dataset.siImageUp || button.dataset.siImageDown
    if (!imageId) return
    const image = state.images.find((entry) => String(entry.id) === imageId)
    if (!image) return
    button.disabled = true
    try {
      if (button.hasAttribute('data-si-remove-image')) {
        if (!window.confirm('Remove this product image? The saved file and image record will be removed.')) {
          button.disabled = false
          return
        }
        await removeAdminProductImage(supabase, image)
        pendingUploadRecords = null
        state.images = state.images.filter((entry) => entry.id !== image.id)
        renderExistingImages()
        setImageMessage('Image removed from the listing.')
        return
      }

      const images = imageGroup()
      const index = images.findIndex((entry) => entry.id === image.id)
      const targetIndex = button.hasAttribute('data-si-image-up') ? index - 1 : index + 1
      if (index < 0 || targetIndex < 0 || targetIndex >= images.length) return
      ;[images[index], images[targetIndex]] = [images[targetIndex], images[index]]
      const productId = form.elements.product_id.value
      const variantId = form.elements.variant_id.value
      await reorderAdminProductImages(supabase, productId, variantId, images)
      images.forEach((entry, order) => { entry.sort_order = order })
      renderExistingImages()
      setImageMessage('Image order updated.')
    } catch (error) {
      let message = displayError(error)
      if (button.hasAttribute('data-si-remove-image')
        || button.hasAttribute('data-si-image-up')
        || button.hasAttribute('data-si-image-down')) {
        try {
          const productId = form.elements.product_id.value
          const refreshedImages = await loadAdminProductImages(supabase, productId)
          state.images = [
            ...state.images.filter((entry) => entry.product_id !== productId),
            ...refreshedImages
          ]
          renderExistingImages()
        } catch (refreshError) {
          message = `${message} ${displayError(refreshError)}`
        }
      }
      button.disabled = false
      setImageMessage(message, true)
    }
  })
  renderExistingImages()
  renderPendingImages()

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return
    try {
      validateAdminProductImages(pendingFiles)
    } catch (error) {
      renderMessage(container, error.message, true)
      return
    }
    const data = new FormData(form)
    let productId = String(data.get('product_id') || '')
    let variantId = String(data.get('variant_id') || '')
    const operation = String(data.get('operation') || 'save')
    const modelId = model.value
    const storageId = storage.value
    const stockQuantity = Number(data.get('stock_quantity'))
    const originalPrice = Number(data.get('original_price'))
    const discountPercentage = Number(data.get('discount_percentage'))
    const selectedColor = String(data.get('color_name') || '')
    const validModel = state.models.find((entry) => entry.id === modelId)
    const validStorage = state.storageOptions.find((entry) => entry.id === storageId && entry.model_id === modelId)
    const validColor = productColors.some((entry) => entry.storage_option_id === storageId && entry.color_name === selectedColor)

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
    const batteryHealth = String(data.get('battery_health') || '')
    if (batteryHealth && (!Number.isInteger(Number(batteryHealth)) || Number(batteryHealth) < 0 || Number(batteryHealth) > 100)) {
      renderMessage(container, 'Battery health must be between 0 and 100.', true)
      return
    }

    const selectedVisibility = String(data.get('visibility'))
    const availability = resolveAdminVariantAvailability(selectedVisibility, stockQuantity)
    const currentProduct = productId ? state.products.find((item) => String(item.id) === productId) : null
    const productValues = operation === 'add_variant' && currentProduct
      ? {
          name: currentProduct.name,
          description: currentProduct.description,
          categoryId: currentProduct.category_id
        }
      : {
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
      warranty: String(data.get('warranty') || '').trim(),
      batteryHealth: batteryHealth ? Number(batteryHealth) : null,
      ram: String(data.get('ram') || '').trim(),
      faceId: String(data.get('faceId') || '').trim(),
      trueTone: String(data.get('trueTone') || '').trim(),
      displayDetails: String(data.get('displayDetails') || '').trim(),
      batteryDetails: String(data.get('batteryDetails') || '').trim(),
      cameraDetails: String(data.get('cameraDetails') || '').trim(),
      speakerDetails: String(data.get('speakerDetails') || '').trim(),
      microphoneDetails: String(data.get('microphoneDetails') || '').trim(),
      chargingDetails: String(data.get('chargingDetails') || '').trim(),
      simDetails: String(data.get('simDetails') || '').trim(),
      notes: String(data.get('notes') || '').trim()
    }

    if ((operation !== 'add_variant' && (!productValues.name || !productValues.categoryId))
      || !variantValues.sku || !variantValues.condition || !variantValues.warranty) {
      renderMessage(container, 'Complete all required product and variant fields.', true)
      return
    }
    if (requiresAdminVariantImageReview(editingVariant, variantValues, imageGroup())) {
      imageVariantWarning.hidden = false
      if (!hasConfirmedAdminVariantImageReview(editingVariant, variantValues, imageGroup(), imageVariantConfirmation.checked)) {
        renderMessage(container, 'Review the existing images and confirm the storage or colour change before saving.', true)
        imageVariantWarning.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    submit.disabled = true
    renderMessage(container, operation === 'add_variant' ? 'Adding variant…' : productId ? 'Saving inventory changes…' : 'Creating product and variant…')
    let productSaved = false
    try {
      if (currentProduct && currentProduct.manufacturer_model_id !== modelId) {
        throw new Error('Manufacturer and model cannot be changed on an existing product; create a new product for a different model.')
      }
      if (operation === 'add_variant' && !currentProduct) {
        throw new Error('Select an existing product before adding a variant.')
      }
      if (operation !== 'add_variant' && productId && variantId) {
        const existingProduct = state.products.find((item) => String(item.id) === productId)
        if (existingProduct && existingProduct.manufacturer_model_id !== modelId) {
          throw new Error('Manufacturer and model cannot be changed on an existing product; create a new product for a different model.')
        }
      }
      const saved = await saveAdminInventoryItem(supabase, {
        productId: productId || null,
        variantId: variantId || null,
        name: productValues.name,
        description: productValues.description,
        categoryId: productValues.categoryId,
        modelId,
        ...variantValues,
        ...productValues
      })
      productId = saved.saved_product_id
      variantId = saved.saved_variant_id
      form.elements.product_id.value = productId
      form.elements.variant_id.value = variantId
      productSaved = true
      if (pendingFiles.length) {
        const existingImages = state.images.filter((image) => image.product_id === productId)
        const existingPrimary = existingImages.find((image) => image.is_primary)
        const primaryFileIndex = pendingPrimaryIndex === null && !existingPrimary ? 0 : pendingPrimaryIndex
        const startingOrder = existingImages.length
          ? Math.max(...existingImages.map((image) => Number(image.sort_order))) + 1
          : 0
        await saveAdminProductImages(supabase, {
          productId,
          variantId,
          files: pendingFiles,
          startingOrder,
          primaryFileIndex,
          existingPrimaryImageId: primaryFileIndex === null ? null : existingPrimary?.id || null,
          retryRecords: pendingUploadRecords,
          onProgress: (completed, total) => renderMessage(container, `Product saved. Uploading image ${completed} of ${total}…`)
        })
        pendingUploadRecords = null
      }
      const savedWithImages = pendingFiles.length > 0
      clearPendingImages()
      await authorizeAndRender(container, { user: state.user }, state.section)
      renderMessage(container, savedWithImages
        ? 'Product listing and images saved successfully.'
        : operation === 'add_variant'
          ? 'Variant added.'
          : 'Product listing saved successfully.')
    } catch (error) {
      submit.disabled = false
      pendingUploadRecords = error?.retryRecords || pendingUploadRecords
      renderMessage(container, productSaved
        ? `Product and inventory were saved, but image upload or association did not complete. Your form is preserved; retry to upload without creating another product. ${displayError(error)}`
        : displayError(error), true)
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
  container.querySelectorAll('[data-si-refresh]').forEach((button) => {
    button.addEventListener('click', () => authorizeAndRender(container, { user: state.user }, state.section))
  })
  container.querySelectorAll('[data-si-edit-product]').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = productByIdSafe(state.products, button.dataset.siEditProduct)
      const variant = state.variants.find((item) => String(item.id) === button.dataset.siEditVariant)
      if (!product || !variant) return
      editingVariant = variant
      form.elements.product_id.value = product.id
      form.elements.variant_id.value = variant.id
      form.elements.operation.value = 'save'
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
      form.elements.battery_health.value = variant.battery_health ?? ''
      form.elements.ram.value = variant.ram || ''
      form.elements.faceId.value = variant.face_id || ''
      form.elements.trueTone.value = variant.true_tone || ''
      form.elements.displayDetails.value = variant.display_details || ''
      form.elements.batteryDetails.value = variant.battery_details || ''
      form.elements.cameraDetails.value = variant.camera_details || ''
      form.elements.speakerDetails.value = variant.speaker_details || ''
      form.elements.microphoneDetails.value = variant.microphone_details || ''
      form.elements.chargingDetails.value = variant.charging_details || ''
      form.elements.simDetails.value = variant.sim_details || ''
      form.elements.notes.value = variant.notes || ''
      clearPendingImages()
      renderExistingImages()
      updateVariantImageWarning()
      form.querySelector('button[type="submit"]').textContent = 'SAVE PRODUCT LISTING'
      container.querySelector('[data-si-cancel-edit]').hidden = false
      updatePrice()
      form.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
  container.querySelectorAll('[data-si-add-variant]').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = productByIdSafe(state.products, button.dataset.siAddVariant)
      if (!product) return
      editingVariant = null
      const productModel = lookups.modelById.get(product.manufacturer_model_id)
      const productSeries = productModel && lookups.seriesById.get(productModel.series_id)
      form.reset()
      clearPendingImages()
      form.elements.product_id.value = product.id
      form.elements.variant_id.value = ''
      form.elements.operation.value = 'add_variant'
      form.elements.name.value = product.name
      form.elements.description.value = product.description || ''
      form.elements.category_id.value = product.category_id
      manufacturer.value = productSeries ? lookups.seriesById.get(productSeries.id)?.manufacturer_id || '' : ''
      updateSeries()
      series.value = productModel?.series_id || ''
      updateModels()
      model.value = product.manufacturer_model_id
      updateStorage()
      manufacturer.disabled = true
      series.disabled = true
      model.disabled = true
      form.elements.name.disabled = true
      form.elements.description.disabled = true
      form.elements.category_id.disabled = true
      await updateColors()
      renderExistingImages()
      updateVariantImageWarning()
      container.querySelector('[data-si-model-lock]').hidden = false
      submit.textContent = 'ADD VARIANT'
      container.querySelector('[data-si-cancel-edit]').hidden = false
      form.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
  container.querySelectorAll('[data-si-product-active]').forEach((button) => {
    button.addEventListener('click', async () => {
      const active = button.dataset.active !== 'true'
      if (!active && !window.confirm('Deactivate this product? It will disappear from the storefront, while its order history remains intact.')) return
      button.disabled = true
      try {
        await setAdminProductActive(supabase, button.dataset.siProductActive, active)
        await authorizeAndRender(container, { user: state.user }, state.section)
      } catch (error) {
        button.disabled = false
        renderMessage(container, displayError(error), true)
      }
    })
  })
  container.querySelectorAll('[data-si-variant-active]').forEach((button) => {
    button.addEventListener('click', async () => {
      const active = button.dataset.active !== 'true'
      const prompt = active
        ? 'Hide this variant from the storefront? Existing order history will remain intact.'
        : 'Restore this variant to the storefront if it has stock?'
      if (!window.confirm(prompt)) return
      button.disabled = true
      try {
        await setAdminVariantActive(supabase, button.dataset.siVariantActive, active)
        await authorizeAndRender(container, { user: state.user }, state.section)
      } catch (error) {
        button.disabled = false
        renderMessage(container, displayError(error), true)
      }
    })
  })
  container.querySelector('[data-si-cancel-edit]').addEventListener('click', () => authorizeAndRender(container, { user: state.user }, state.section))
}

function bindAnnouncementManagement(container, state) {
  const form = container.querySelector('[data-si-announcement-form]')
  const message = form.querySelector('[data-si-announcement-message]')
  const reset = () => {
    form.reset()
    form.elements.id.value = ''
    form.elements.mediaPath.value = ''
    form.elements.mediaType.value = ''
    form.elements.label.value = 'ARCADIA MOBILE'
    message.textContent = ''
    message.classList.remove('si-error', 'si-success')
  }
  container.querySelectorAll('[data-si-reset-announcement]').forEach((button) => button.addEventListener('click', reset))

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return
    const data = new FormData(form)
    const id = String(data.get('id') || crypto.randomUUID())
    const oldMediaPath = String(data.get('mediaPath') || '')
    const file = form.elements.media.files?.[0]
    let media = oldMediaPath
      ? { path: oldMediaPath, type: String(data.get('mediaType') || '') }
      : { path: null, type: null }
    let uploadedMedia = null
    const button = form.querySelector('button[type="submit"]')
    button.disabled = true
    message.classList.remove('si-error', 'si-success')
    message.textContent = 'Saving announcement…'
    try {
      if (file) {
        uploadedMedia = await uploadAnnouncementMedia(supabase, file, id)
        media = uploadedMedia
      }
      const values = {
        label: String(data.get('label') || '').trim(),
        title: String(data.get('title') || '').trim(),
        message: String(data.get('message') || '').trim(),
        media_path: media.path,
        media_type: media.type || null,
        published: data.has('published'),
        sort_order: Number(data.get('sortOrder'))
      }
      const query = id === form.elements.id.value
        ? supabase.from('announcements').update(values).eq('id', id).select('id').maybeSingle()
        : supabase.from('announcements').insert({ id, ...values }).select('id').maybeSingle()
      const { data: saved, error } = await query
      if (error) throw error
      if (!saved) throw new Error('Announcement was not saved.')
      if (uploadedMedia && oldMediaPath && oldMediaPath !== uploadedMedia.path) {
        try {
          await deleteAnnouncementMedia(supabase, oldMediaPath)
        } catch (cleanupError) {
          console.error('Announcement saved, but old media cleanup failed.', cleanupError)
        }
      }
      await authorizeAndRender(container, { user: state.user }, state.section)
      const status = container.querySelector('[data-si-announcement-message]')
      if (status) {
        status.textContent = 'Announcement saved.'
        status.classList.add('si-success')
      }
    } catch (error) {
      if (uploadedMedia) {
        try {
          await deleteAnnouncementMedia(supabase, uploadedMedia.path)
        } catch (cleanupError) {
          console.error('Could not clean up an unreferenced announcement upload.', cleanupError)
        }
      }
      button.disabled = false
      message.textContent = displayError(error)
      message.classList.add('si-error')
    }
  })

  container.querySelectorAll('[data-si-edit-announcement]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = state.announcements.find((announcement) => announcement.id === button.dataset.siEditAnnouncement)
      if (!item) return
      form.elements.id.value = item.id
      form.elements.label.value = item.label
      form.elements.title.value = item.title
      form.elements.message.value = item.message
      form.elements.mediaPath.value = item.media_path || ''
      form.elements.mediaType.value = item.media_type || ''
      form.elements.sortOrder.value = item.sort_order
      form.elements.published.checked = item.published
      form.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  container.querySelectorAll('[data-si-publish-announcement]').forEach((button) => {
    button.addEventListener('click', async () => {
      const item = state.announcements.find((announcement) => announcement.id === button.dataset.siPublishAnnouncement)
      if (!item) return
      button.disabled = true
      try {
        const { data, error } = await supabase.from('announcements')
          .update({ published: !item.published })
          .eq('id', item.id)
          .select('id')
          .maybeSingle()
        if (error) throw error
        if (!data) throw new Error('Announcement publication state was not updated.')
        await authorizeAndRender(container, { user: state.user }, state.section)
      } catch (error) {
        button.disabled = false
        message.textContent = displayError(error)
        message.classList.add('si-error')
      }
    })
  })

  container.querySelectorAll('[data-si-delete-announcement]').forEach((button) => {
    button.addEventListener('click', async () => {
      const item = state.announcements.find((announcement) => announcement.id === button.dataset.siDeleteAnnouncement)
      if (!item || !window.confirm('Delete this announcement from the homepage?')) return
      button.disabled = true
      try {
        const { data, error } = await supabase.from('announcements')
          .delete()
          .eq('id', item.id)
          .select('id')
          .maybeSingle()
        if (error) throw error
        if (!data) throw new Error('Announcement was not deleted.')
        await authorizeAndRender(container, { user: state.user }, state.section)
        if (item.media_path) {
          try {
            await deleteAnnouncementMedia(supabase, item.media_path)
          } catch (cleanupError) {
            const status = container.querySelector('[data-si-announcement-message]')
            if (status) {
              status.textContent = `Announcement deleted, but its private media could not be removed: ${displayError(cleanupError)}`
              status.classList.add('si-error')
            }
          }
        }
      } catch (error) {
        button.disabled = false
        message.textContent = displayError(error)
        message.classList.add('si-error')
      }
    })
  })
}

function bindCatalogManagement(container, state) {
  const status = container.querySelector('[data-si-catalog-message]')
  const persist = async (values) => {
    status.classList.remove('si-error', 'si-success')
    status.textContent = 'Saving catalog entry…'
    try {
      await manageAdminCatalogItem(supabase, values)
      await authorizeAndRender(container, { user: state.user }, state.section)
      const result = container.querySelector('[data-si-catalog-message]')
      if (result) {
        result.textContent = 'Catalog entry saved.'
        result.classList.add('si-success')
      }
    } catch (error) {
      status.textContent = displayError(error)
      status.classList.add('si-error')
    }
  }

  container.querySelectorAll('[data-si-catalog-form]').forEach((form) => {
    if (form.dataset.siCatalogForm === 'color') {
      form.addEventListener('reset', () => {
        form.querySelector('button[type="submit"]').textContent = 'ADD COLOR'
      })
    }
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      if (!form.reportValidity()) return
      const values = new FormData(form)
      const entity = form.dataset.siCatalogForm
      const oldName = String(values.get('old_name') || '')
      await persist({
        entity,
        action: entity === 'color' && oldName ? 'rename_color' : 'save',
        id: values.get('id'),
        parentId: values.get('parent_id'),
        name: values.get('name'),
        ramOptions: String(values.get('ramOptions') || '').split(',').map((item) => item.trim()).filter(Boolean),
        verified: values.has('verified'),
        oldName
      })
    })
  })

  container.querySelectorAll('[data-si-edit-catalog]').forEach((button) => {
    button.addEventListener('click', () => {
      const entity = button.dataset.siEditCatalog
      const item = entity === 'color'
        ? state.colors.find((row) => row.storage_option_id === button.dataset.parentId && row.color_name === button.dataset.name)
        : entity === 'manufacturer'
          ? state.manufacturers.find((row) => row.id === button.dataset.id)
          : entity === 'series'
            ? state.series.find((row) => row.id === button.dataset.id)
            : entity === 'model'
              ? state.models.find((row) => row.id === button.dataset.id)
              : state.storageOptions.find((row) => row.id === button.dataset.id)
      const form = container.querySelector(`[data-si-catalog-form="${entity}"]`)
      if (!item || !form) return
      if (entity === 'color') {
        form.elements.parent_id.value = item.storage_option_id
        form.elements.old_name.value = item.color_name
        form.elements.name.value = item.color_name
        form.querySelector('button[type="submit"]').textContent = 'SAVE COLOR'
        form.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      form.elements.id.value = item.id
      form.elements.name.value = entity === 'storage' ? item.storage_label : item.name
      if (form.elements.parent_id) {
        form.elements.parent_id.value = entity === 'series'
          ? item.manufacturer_id
          : entity === 'model'
            ? item.series_id
            : entity === 'storage'
              ? item.model_id
              : ''
      }
      if (entity === 'model') {
        form.elements.ramOptions.value = item.ram_options?.join(', ') || ''
        form.elements.verified.checked = item.verified
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })
}

function bindAdminOperations(container, state) {
  container.querySelectorAll('[data-si-confirm-payment]').forEach((button) => {
    button.addEventListener('click', async () => {
      const form = button.closest('[data-si-order-update]')
      button.disabled = true
      try {
        await updateAdminOrder(supabase, button.dataset.siConfirmPayment, {
          status: form.elements.status.value,
          paymentStatus: 'paid'
        })
        await authorizeAndRender(container, { user: state.user }, state.section)
        const message = container.querySelector('[data-si-operations-message]')
        if (message) message.textContent = 'Payment marked as confirmed.'
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

export async function renderSupabaseInventory(container, section = 'overview') {
  if (!supabaseConfiguration.configured || !supabase) {
    renderSignIn(container, supabaseConfiguration.message)
    return
  }
  renderSignIn(container)
  const session = supabaseAuthState.getSession()
  if (session) await authorizeAndRender(container, session, section)
}

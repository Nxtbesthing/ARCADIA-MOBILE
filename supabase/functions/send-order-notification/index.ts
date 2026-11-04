import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value: unknown): string {
  return `NGN ${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ARCADIA_ORDER_EMAIL_FROM");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !from || !authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Order email service is not configured." }, { status: 503, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userResult, error: userError } = await supabase.auth.getUser(authorization.slice(7));
  if (userError || !userResult.user) {
    return Response.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });
  }

  let orderId: string;
  try {
    const body = await request.json();
    orderId = String(body?.order_id || "");
  } catch {
    return Response.json({ error: "A valid order is required." }, { status: 400, headers: corsHeaders });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return Response.json({ error: "A valid order is required." }, { status: 400, headers: corsHeaders });
  }

  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id,user_id,order_number,status,payment_status,payment_method,subtotal,discount_total,delivery_fee,grand_total,delivery_method,delivery_state,delivery_city,delivery_address,customer_name,customer_phone,customer_email,created_at")
    .eq("user_id", userResult.user.id)
    .maybeSingle();
  if (orderError || !order) {
    return Response.json({ error: "Order could not be found." }, { status: 404, headers: corsHeaders });
  }

  const { data: items, error: itemsError } = await supabase.from("order_items")
    .select("product_name,variant_description,sku,quantity,unit_price,discount_amount,final_unit_price,line_total,warranty")
    .eq("order_id", orderId)
    .order("created_at");
  if (itemsError || !items?.length) {
    return Response.json({ error: "Order details could not be loaded." }, { status: 500, headers: corsHeaders });
  }

  const itemRows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.product_name)}<br>${escapeHtml(item.variant_description)}<br>SKU ${escapeHtml(item.sku)}</td>
      <td>${Number(item.quantity)}</td>
      <td>${formatCurrency(item.unit_price)}</td>
      <td>${formatCurrency(item.discount_amount)}</td>
      <td>${formatCurrency(item.final_unit_price)}</td>
      <td>${formatCurrency(item.line_total)}</td>
    </tr>`).join("");
  const delivery = order.delivery_method === "delivery"
    ? `${order.delivery_address}, ${order.delivery_city}, ${order.delivery_state}`
    : "Store pickup";
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `arcadia-order-${order.id}`,
    },
    body: JSON.stringify({
      from,
      to: ["arcadiamobile24@gmail.com"],
      subject: `New Arcadia order ${order.order_number}`,
      html: `<h1>New Arcadia Mobile order</h1>
        <p><strong>Reference:</strong> ${escapeHtml(order.order_number)}</p>
        <p><strong>Placed:</strong> ${escapeHtml(new Date(order.created_at).toISOString())}</p>
        <p><strong>Order status:</strong> ${escapeHtml(order.status)}</p>
        <p><strong>Payment status:</strong> ${escapeHtml(order.payment_status)} (not automatically paid)</p>
        <p><strong>Payment method:</strong> ${escapeHtml(order.payment_method)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_email)} · ${escapeHtml(order.customer_phone)}</p>
        <p><strong>Fulfilment:</strong> ${escapeHtml(delivery)}</p>
        <table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Item</th><th>Qty</th><th>Original unit price</th><th>Discount / unit</th><th>Final unit price</th><th>Line total</th></tr></thead><tbody>${itemRows}</tbody></table>
        <p>Subtotal: ${formatCurrency(order.subtotal)}<br>Discount: ${formatCurrency(order.discount_total)}<br>Delivery: ${formatCurrency(order.delivery_fee)}<br><strong>Total: ${formatCurrency(order.grand_total)}</strong></p>`,
    }),
  });
  if (!emailResponse.ok) {
    return Response.json({ error: "Order email provider rejected the notification." }, { status: 502, headers: corsHeaders });
  }
  return Response.json({ sent: true }, { headers: corsHeaders });
});

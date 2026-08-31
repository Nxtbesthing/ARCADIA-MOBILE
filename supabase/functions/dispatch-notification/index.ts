import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type NotificationRequest = {
  userId?: string;
  event: string;
  recipient: { email?: string; phone?: string; whatsapp?: string };
  channels: string[];
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await request.json() as NotificationRequest;
    const supportedEvents = [
      "order_confirmation", "payment_confirmation", "shipping_notification", "delivery_notification", "repair_update",
      "new_order", "new_repair_request", "payment_received", "low_stock"
    ];
    const channels = payload.channels.filter((channel) => ["email", "whatsapp", "sms"].includes(channel));
    if (!supportedEvents.includes(payload.event) || channels.length === 0) {
      return json({ sent: false, message: "Unsupported notification event or channel." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const rows = channels.map((channel) => ({
      user_id: payload.userId || null,
      audience: payload.userId ? "customer" : "admin",
      event_type: payload.event,
      channel,
      recipient: channel === "email" ? payload.recipient.email : payload.recipient.whatsapp || payload.recipient.phone,
      subject: payload.subject,
      message: payload.message,
      metadata: payload.metadata || {},
      status: "Queued"
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) throw error;

    // Provider adapters belong here. Their API keys must be Edge Function secrets.
    return json({ sent: true, queued: true, event: payload.event, channels });
  } catch (error) {
    console.error(error);
    return json({ sent: false, message: "Notification dispatch failed." }, 500);
  }
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

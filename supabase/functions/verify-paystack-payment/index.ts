import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await request.json();
    if (!body.reference || body.paymentMethod !== "paystack") {
      return json({ verified: false, message: "A valid Paystack reference is required." }, 400);
    }

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(body.reference)}`, {
      headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}` }
    });
    const paystackResult = await paystackResponse.json();
    const transaction = paystackResult.data;
    const expectedAmountKobo = Math.round(Number(body.expectedAmount) * 100);

    if (!paystackResponse.ok || transaction?.status !== "success" || transaction.amount !== expectedAmountKobo) {
      return json({ verified: false, message: "Paystack payment could not be verified." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: order, error } = await supabase.rpc("create_verified_order", {
      order_payload: {
        reference: body.reference,
        payment_method: body.paymentMethod,
        customer: body.customer,
        delivery: body.delivery,
        items: body.items,
        verified_amount: transaction.amount / 100
      }
    });

    if (error) throw error;
    return json({ verified: true, order });
  } catch (error) {
    console.error(error);
    return json({ verified: false, message: "Payment verification is temporarily unavailable." }, 500);
  }
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

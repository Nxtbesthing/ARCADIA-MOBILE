const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const methods = [
    {
      id: "moniepoint-mfb",
      name: "Moniepoint MFB",
      accountNumber: Deno.env.get("MONIEPOINT_ACCOUNT_NUMBER"),
      accountName: Deno.env.get("MONIEPOINT_ACCOUNT_NAME")
    },
    {
      id: "opay",
      name: "Opay",
      accountNumber: Deno.env.get("OPAY_ACCOUNT_NUMBER"),
      accountName: Deno.env.get("OPAY_ACCOUNT_NAME")
    }
  ].filter((method) => method.accountNumber && method.accountName);

  return new Response(JSON.stringify(methods), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});

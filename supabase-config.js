// Set these values in deployment configuration. Never put a Supabase service-role key here.
window.ARCADIA_SUPABASE_CONFIG = {
  url: "",
  anonKey: ""
};

// publicKey is safe for the browser. Keep secretKey inside the Edge Function only.
window.ARCADIA_PAYMENT_CONFIG = {
  publicKey: "",
  verifyEndpoint: "",
  methodsEndpoint: ""
};

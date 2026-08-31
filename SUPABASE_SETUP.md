# Supabase setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL editor.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment environment.
4. Never put a service-role key in this repository or browser code.
5. Create a Storage bucket named `product-images` and add an authenticated admin upload policy before enabling production image uploads.
6. Create an Auth user, insert the matching `auth.uid()` into `public.users`, and set `is_admin` to `true` for admin access.
7. Deploy `supabase/functions/verify-paystack-payment/index.ts` and set the Edge Function secrets `PAYSTACK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
8. Set `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_PAYSTACK_VERIFY_ENDPOINT`, and `VITE_PAYMENT_METHODS_ENDPOINT` in the deployment environment.
9. Deploy `supabase/functions/payment-methods/index.ts` and set these Edge Function secrets: `MONIEPOINT_ACCOUNT_NUMBER`, `MONIEPOINT_ACCOUNT_NAME`, `OPAY_ACCOUNT_NUMBER`, and `OPAY_ACCOUNT_NAME`.
10. Deploy `supabase/functions/dispatch-notification/index.ts` with `SUPABASE_SERVICE_ROLE_KEY`. Add provider secrets only on the Edge Function, such as `RESEND_API_KEY` for email, `TWILIO_AUTH_TOKEN` for SMS, and a WhatsApp Business API token for WhatsApp.

The static app uses its local catalog and localStorage when configuration is blank. Once configured, storefront products are loaded from `public.products` with category, inventory, and product-image relations. Admin product updates use the public REST API and are protected by the `public.is_admin()` RLS policies.

Production checkout, payment confirmation, and order creation should run through a server or Supabase Edge Function. The browser must not receive service-role credentials or treat client-submitted totals as authoritative.

Delivery rates currently supported by the shared `calculate_delivery_fee` logic are: Jos and Jos North `NGN 2,000`, Rayfield `NGN 2,500`, other Plateau locations `NGN 3,000`, Lagos/Abuja/Kaduna `NGN 5,000`, and Kano/Port Harcourt `NGN 5,500`. Add more destinations to both the frontend calculator and PostgreSQL function when expanding coverage.

Paystack checkout sends only a public key to the browser. The Edge Function verifies the transaction with Paystack, then calls `create_verified_order`, which recalculates prices from PostgreSQL, checks inventory under lock, inserts the order and payment, and decrements inventory atomically.

Set `VITE_PAYSTACK_PUBLIC_KEY` to the Paystack public key and `VITE_PAYSTACK_VERIFY_ENDPOINT` to the deployed function URL. Set `PAYSTACK_SECRET_KEY` only as an Edge Function secret; it must never be placed in browser code.

The checkout loads Moniepoint MFB and Opay account details from the deployed `payment-methods` function. Set both account-number secrets to the authorized account number and both account-name secrets to the authorized account name in Supabase Edge Function secrets. Do not paste those values into `script.js` or `index.html`.

Notifications are queued in `public.notifications` before provider delivery. Customer events are `order_confirmation`, `payment_confirmation`, `shipping_notification`, `delivery_notification`, and `repair_update`. Admin events are `new_order`, `new_repair_request`, `payment_received`, and `low_stock`. Supported channels are `email`, `whatsapp`, and `sms`.

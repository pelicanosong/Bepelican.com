import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wompi Production URL
const WOMPI_API_URL = "https://production.wompi.co/v1";

function appendQuery(url: string, params: Record<string, string>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WOMPI_PRIVATE_KEY = Deno.env.get("WOMPI_PRIVATE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!WOMPI_PRIVATE_KEY) {
      console.error("Wompi keys not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Payment provider not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create Supabase client with user's auth context
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid token:", claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      console.error("No user ID in token claims");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token claims" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Authenticated user:", userId);

    const body = await req.json();
    // Log request without sensitive PII
    console.log("Creating Wompi payment link for order:", body.orderId);

    const {
      orderId,
      bookingDate,
      amountInCents,
      currency,
      customerEmail,
      reference,
      redirectUrl,
      description,
    } = body;

    // Validate required fields
    if (!orderId || !amountInCents) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate redirectUrl to prevent open redirect attacks
    if (redirectUrl) {
      try {
        const redirectParsed = new URL(redirectUrl);
        // Define allowed origins for redirect (published, preview, and legacy URLs)
        const allowedOrigins = [
          "https://bepelican.com",
          "https://www.bepelican.com",
          "https://bepelicanecommerce.lovable.app",
          "https://id-preview--b0b04077-ee92-49fd-b3c7-85439bf58c4e.lovable.app",
          "https://b0b04077-ee92-49fd-b3c7-85439bf58c4e.lovableproject.com",
        ];
        // Also allow same origin as the request
        const requestOrigin = new URL(req.url).origin;
        if (!allowedOrigins.includes(redirectParsed.origin) && redirectParsed.origin !== requestOrigin) {
          console.error("Invalid redirectUrl origin:", redirectParsed.origin);
          return new Response(
            JSON.stringify({ success: false, error: "Invalid redirect URL" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } catch {
        console.error("Invalid redirectUrl format");
        return new Response(
          JSON.stringify({ success: false, error: "Invalid redirect URL format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Validate orderId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error("Invalid orderId format:", orderId);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate amountInCents is a positive integer
    if (typeof amountInCents !== "number" || !Number.isInteger(amountInCents) || amountInCents <= 0) {
      console.error("Invalid amountInCents:", amountInCents);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ===== ORDER OWNERSHIP VERIFICATION =====
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("user_id, status, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the authenticated user owns this order
    if (order.user_id !== userId) {
      console.error("User does not own this order. User:", userId, "Order owner:", order.user_id);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify order is in a valid state for payment
    if (order.status !== "pending") {
      console.error("Order is not in pending status:", order.status);
      return new Response(
        JSON.stringify({ success: false, error: "Order cannot be paid in current status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Order ownership verified for user:", userId);

    // Redirect URL: always include orderId (and booking date) for later reconciliation
    const redirectParams: Record<string, string> = { orderId };

    if (bookingDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(String(bookingDate))) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid bookingDate format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      redirectParams.fecha = String(bookingDate);
    }

    const finalRedirectUrl = appendQuery(
      redirectUrl || `${new URL(req.url).origin}/pago-resultado`,
      redirectParams,
    );

    // Create payment link payload
    // Docs: POST /v1/payment_links (Colombia)
    const paymentLinkPayload = {
      name: reference || `BEPELICAN-${orderId}`,
      description: description || "Reserva BePelican",
      single_use: true,
      collect_shipping: false,
      currency: currency || "COP",
      amount_in_cents: amountInCents,
      redirect_url: finalRedirectUrl,
      // sku max 36 chars: perfect to store the order UUID
      sku: String(orderId).slice(0, 36),
      // NOTE: customerEmail isn't part of payment_links creation, but we still accept it for the checkout form.
      _customer_email: customerEmail,
    };

    console.log("Creating Wompi payment link...");

    const paymentLinkResponse = await fetch(`${WOMPI_API_URL}/payment_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify(paymentLinkPayload),
    });

    const paymentLinkData = await paymentLinkResponse.json();
    console.log("Wompi payment link created with ID:", paymentLinkData?.data?.id);

    if (!paymentLinkResponse.ok || paymentLinkData?.error) {
      const reason = paymentLinkData?.error?.reason || paymentLinkData?.error?.message || "Failed to create payment link";
      console.error("Wompi payment link error:", reason);
      return new Response(
        JSON.stringify({ success: false, error: reason }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const paymentLinkId = paymentLinkData?.data?.id;

    if (!paymentLinkId) {
      console.error("Payment link created but no id returned");
      return new Response(
        JSON.stringify({ success: false, error: "Payment link created but no id returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const wompiCheckoutUrl = `https://checkout.wompi.co/l/${paymentLinkId}`;

    // Create payment record (provider_reference stores payment_link_id initially)
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: orderId,
        amount: amountInCents / 100,
        currency: currency || "COP",
        provider: "wompi",
        provider_reference: paymentLinkId,
        status: "pending",
      });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError.message);
      // Don't fail the request, payment link exists in Wompi.
    }

    console.log("Payment link created successfully for order:", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: paymentLinkId,
        redirectUrl: wompiCheckoutUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in wompi-create-transaction:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

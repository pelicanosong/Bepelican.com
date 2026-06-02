import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WOMPI_API_URL = "https://production.wompi.co/v1";

function mapWompiStatus(wompiStatus: string) {
  if (wompiStatus === "APPROVED") return { paymentStatus: "paid", orderStatus: "paid" };
  if (wompiStatus === "DECLINED" || wompiStatus === "ERROR" || wompiStatus === "VOIDED") {
    return { paymentStatus: "failed", orderStatus: "cancelled" };
  }
  return { paymentStatus: "pending", orderStatus: "pending" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const body = await req.json();
    const orderId = String(body?.orderId || "");
    const transactionId = String(body?.transactionId || "");

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!transactionId) {
      return new Response(JSON.stringify({ success: false, error: "Missing transactionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify order ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get latest payment row for the order
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, provider, provider_reference, status, amount")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ success: false, error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.provider !== "wompi") {
      return new Response(JSON.stringify({ success: false, error: "Not a Wompi payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Wompi transaction
    const wompiRes = await fetch(`${WOMPI_API_URL}/transactions/${transactionId}`);
    const wompiJson = await wompiRes.json();

    const wompiTx = wompiJson?.data;
    if (!wompiTx) {
      return new Response(JSON.stringify({ success: false, error: "Transaction not found in Wompi" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic cross-check: transaction must belong to the same payment link or reference our orderId
    const paymentLinkId = String(wompiTx.payment_link_id || "");
    const redirectUrl = String(wompiTx.redirect_url || "");

    let redirectHasOrder = false;
    try {
      if (redirectUrl) {
        const u = new URL(redirectUrl);
        redirectHasOrder = u.searchParams.get("orderId") === orderId;
      }
    } catch {
      // ignore
    }

    if (paymentLinkId && payment.provider_reference && paymentLinkId !== payment.provider_reference && !redirectHasOrder) {
      return new Response(JSON.stringify({ success: false, error: "Transaction does not match order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wompiStatus = String(wompiTx.status || "PENDING");
    const { paymentStatus, orderStatus } = mapWompiStatus(wompiStatus);

    // Update payment and order
    await supabaseAdmin
      .from("payments")
      .update({ status: paymentStatus, provider_reference: transactionId })
      .eq("id", payment.id);

    await supabaseAdmin.from("orders").update({ status: orderStatus }).eq("id", orderId);

    // Create bookings when approved
    if (paymentStatus === "paid") {
      let bookingDate: string | null = null;
      try {
        if (redirectUrl) {
          const u = new URL(redirectUrl);
          const fecha = u.searchParams.get("fecha");
          if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) bookingDate = fecha;
        }
      } catch {
        // ignore
      }

      if (bookingDate) {
        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("id, experience_id, quantity")
          .eq("order_id", orderId);

        for (const item of items || []) {
          const { data: existing } = await supabaseAdmin
            .from("experience_bookings")
            .select("id")
            .eq("order_item_id", item.id)
            .maybeSingle();

          if (!existing) {
            await supabaseAdmin.from("experience_bookings").insert({
              order_item_id: item.id,
              experience_id: item.experience_id,
              booking_date: bookingDate,
              participants: item.quantity,
              status: "confirmed",
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        transactionId,
        status: wompiStatus,
        paymentStatus,
        orderStatus,
        amount: payment?.amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in wompi-reconcile:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WOMPI_EVENTS_SECRET = Deno.env.get("WOMPI_EVENTS_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // CRITICAL: Fail immediately if webhook secret is not configured
    if (!WOMPI_EVENTS_SECRET) {
      console.error("CRITICAL: WOMPI_EVENTS_SECRET not configured - webhook disabled");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Webhook not properly configured" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const body = await req.json();
    const { event, data, signature, timestamp } = body;
    
    // Log only non-sensitive identifiers to avoid PII exposure
    console.log("Wompi webhook received:", {
      event,
      transactionId: data?.transaction?.id,
      status: data?.transaction?.status,
      timestamp: Date.now(),
    });

    // CRITICAL: Require signature on all webhook requests
    if (!signature || !signature.checksum) {
      console.error("Webhook signature missing or invalid");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Signature required" 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verify signature
    const properties = signature.properties || [];
    const checksumString =
      properties
        .map((prop: string) => {
          const keys = prop.split(".");
          let value = data;
          for (const key of keys) {
            value = value?.[key];
          }
          return value;
        })
        .join("") + timestamp + WOMPI_EVENTS_SECRET;

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(checksumString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedChecksum = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (calculatedChecksum !== signature.checksum) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    console.log("Webhook signature verified successfully");

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle transaction events
    if (event === "transaction.updated") {
      const transaction = data?.transaction;
      const transactionId = transaction?.id;
      const status = transaction?.status;
      const paymentLinkId = transaction?.payment_link_id;
      const redirectUrl = transaction?.redirect_url;

      if (!transactionId || !status) {
        console.warn("Webhook missing transaction id/status");
        return new Response(
          JSON.stringify({ success: true, ignored: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log(`Processing transaction ${transactionId} with status ${status}`);

      // Map Wompi status to our status
      let paymentStatus = "pending";
      if (status === "APPROVED") {
        paymentStatus = "paid";
      } else if (status === "DECLINED" || status === "ERROR" || status === "VOIDED") {
        paymentStatus = "failed";
      }

      // Try to update by transaction id first; if not found, fall back to payment_link_id
      let orderId: string | null = null;

      const { data: byTxn, error: byTxnErr } = await supabase
        .from("payments")
        .update({ status: paymentStatus })
        .eq("provider_reference", transactionId)
        .select("order_id")
        .maybeSingle();

      if (byTxnErr) {
        console.error("Error updating payment (by transaction id):", byTxnErr);
      }

      if (byTxn?.order_id) {
        orderId = byTxn.order_id;
      } else if (paymentLinkId) {
        const { data: byLink, error: byLinkErr } = await supabase
          .from("payments")
          // replace payment_link_id with the real transaction id once we have it
          .update({ status: paymentStatus, provider_reference: transactionId })
          .eq("provider_reference", paymentLinkId)
          .select("order_id")
          .maybeSingle();

        if (byLinkErr) {
          console.error("Error updating payment (by payment link id):", byLinkErr);
        }

        if (byLink?.order_id) {
          orderId = byLink.order_id;
        }
      }

      if (!orderId) {
        console.warn("No matching payment found for transaction", { transactionId, paymentLinkId });
        return new Response(
          JSON.stringify({ success: true, ignored: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Update order status
      const orderStatus = paymentStatus === "paid" ? "paid" : paymentStatus === "failed" ? "cancelled" : "pending";

      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: orderStatus })
        .eq("id", orderId);

      if (orderError) {
        console.error("Error updating order:", orderError);
      } else {
        console.log(`Order ${orderId} updated to ${orderStatus}`);

        // If payment is approved, create booking
        if (paymentStatus === "paid") {
          // Try to recover selected booking date from redirect_url (?fecha=YYYY-MM-DD)
          let bookingDateFromRedirect: string | null = null;
          try {
            if (redirectUrl) {
              const u = new URL(redirectUrl);
              const fecha = u.searchParams.get("fecha");
              if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                bookingDateFromRedirect = fecha;
              }
            }
          } catch {
            // ignore URL parse errors
          }

          const fallbackDate = new Date().toISOString().split("T")[0];
          const bookingDate = bookingDateFromRedirect || fallbackDate;

          const { data: orderItems, error: itemsError } = await supabase
            .from("order_items")
            .select("id, experience_id, quantity")
            .eq("order_id", orderId);

          if (itemsError) {
            console.error("Error fetching order items:", itemsError);
          } else if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
              const { data: existingBooking } = await supabase
                .from("experience_bookings")
                .select("id")
                .eq("order_item_id", item.id)
                .maybeSingle();

              if (!existingBooking) {
                const { error: bookingError } = await supabase
                  .from("experience_bookings")
                  .insert({
                    order_item_id: item.id,
                    experience_id: item.experience_id,
                    booking_date: bookingDate,
                    participants: item.quantity,
                    status: "confirmed",
                  });

                if (bookingError) {
                  console.error("Error creating booking:", bookingError);
                } else {
                  console.log(`Booking created for order item ${item.id}`);
                }
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in wompi-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

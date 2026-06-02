import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePostPurchaseUpsell } from "@/hooks/useUpsellExperiences";
import BePelicanHeader from "@/components/bepelican/BePelicanHeader";
import BePelicanFooter from "@/components/bepelican/BePelicanFooter";
import UpsellSection from "@/components/upsell/UpsellSection";
import { formatPrice } from "@/lib/formatPrice";

type PaymentStatus = "loading" | "approved" | "declined" | "pending" | "error" | "unknown";

interface PaymentInfo {
  status: PaymentStatus;
  orderId?: string;
  transactionId?: string;
  amount?: number;
  destinationCity?: string;
}

const PagoResultado = () => {
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({ status: "loading" });

  // Get transaction ID from Wompi redirect URL
  const transactionId = searchParams.get("id");
  const orderIdParam = searchParams.get("orderId");

  // Post-purchase upsell
  const { data: upsellExperiences, isLoading: upsellLoading } = usePostPurchaseUpsell(
    paymentInfo.status === "approved" ? paymentInfo.orderId : undefined
  );

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!transactionId) {
        setPaymentInfo({ status: "unknown" });
        return;
      }

      try {
        // Use server-side reconciliation to verify payment status securely
        // This ensures the client never directly accesses external payment APIs
        if (orderIdParam) {
          const { data: reconcileData, error: reconcileError } = await supabase.functions.invoke("wompi-reconcile", {
            body: { orderId: orderIdParam, transactionId },
          });

          if (!reconcileError && reconcileData) {
            const reconcileStatus = reconcileData.status;
            let status: PaymentStatus = "unknown";
            
            if (reconcileStatus === "APPROVED" || reconcileStatus === "paid") status = "approved";
            else if (reconcileStatus === "DECLINED" || reconcileStatus === "ERROR" || reconcileStatus === "VOIDED" || reconcileStatus === "failed") status = "declined";
            else if (reconcileStatus === "PENDING" || reconcileStatus === "pending") status = "pending";

            // Fetch destination city from order for upselling
            let destinationCity = "";
            if (status === "approved") {
              const { data: orderItems } = await supabase
                .from("order_items")
                .select("experiences(location_city)")
                .eq("order_id", orderIdParam)
                .limit(1);
              
              if (orderItems && orderItems[0]?.experiences) {
                destinationCity = (orderItems[0].experiences as { location_city: string }).location_city;
              }
            }

            setPaymentInfo({
              status,
              transactionId,
              orderId: orderIdParam,
              amount: reconcileData.amount ? Number(reconcileData.amount) : undefined,
              destinationCity,
            });
            return;
          }
        }

        // Fallback: Check our payments table (protected by RLS - user can only see own payments)
        const { data: payment } = await supabase
          .from("payments")
          .select("status, order_id, amount")
          .eq("provider_reference", transactionId)
          .maybeSingle();

        if (payment) {
          let status: PaymentStatus = "unknown";
          if (payment.status === "paid") status = "approved";
          else if (payment.status === "failed") status = "declined";
          else if (payment.status === "pending") status = "pending";

          // Fetch destination city for upselling
          let destinationCity = "";
          if (status === "approved") {
            const { data: orderItems } = await supabase
              .from("order_items")
              .select("experiences(location_city)")
              .eq("order_id", payment.order_id)
              .limit(1);
            
            if (orderItems && orderItems[0]?.experiences) {
              destinationCity = (orderItems[0].experiences as { location_city: string }).location_city;
            }
          }

          setPaymentInfo({
            status,
            orderId: payment.order_id,
            transactionId,
            amount: payment.amount,
            destinationCity,
          });
          return;
        }

        // If nothing found
        setPaymentInfo({ status: "unknown", transactionId });
      } catch (err) {
        console.error("Error checking payment status:", err);
        setPaymentInfo({ status: "error", transactionId });
      }
    };

    checkPaymentStatus();
  }, [transactionId, orderIdParam]);

  const getStatusContent = () => {
    switch (paymentInfo.status) {
      case "loading":
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Verificando pago...",
          description: "Estamos confirmando el estado de tu transacción.",
          color: "text-primary",
        };
      case "approved":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "¡Pago exitoso!",
          description: "Tu reserva ha sido confirmada. Recibirás un correo con los detalles.",
          color: "text-green-500",
        };
      case "declined":
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "Pago rechazado",
          description: "Tu pago no pudo ser procesado. Por favor, intenta con otro método de pago.",
          color: "text-destructive",
        };
      case "pending":
        return {
          icon: <Clock className="h-16 w-16 text-amber-500" />,
          title: "Pago pendiente",
          description: "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
          color: "text-amber-500",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-16 w-16 text-destructive" />,
          title: "Error al verificar",
          description: "No pudimos verificar el estado de tu pago. Por favor, contáctanos.",
          color: "text-destructive",
        };
      default:
        return {
          icon: <AlertCircle className="h-16 w-16 text-muted-foreground" />,
          title: "Estado desconocido",
          description: "No pudimos determinar el estado de tu transacción.",
          color: "text-muted-foreground",
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader />

      <main className="pt-24 pb-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-card border rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">{statusContent.icon}</div>

            <h1 className={`text-2xl font-semibold mb-3 ${statusContent.color}`}>
              {statusContent.title}
            </h1>
            <p className="text-muted-foreground mb-6">{statusContent.description}</p>

            {paymentInfo.amount && paymentInfo.status === "approved" && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">Monto pagado</p>
                <p className="text-2xl font-semibold">{formatPrice(paymentInfo.amount)}</p>
              </div>
            )}

            {paymentInfo.transactionId && (
              <p className="text-xs text-muted-foreground mb-6">
                ID de transacción: {paymentInfo.transactionId}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {paymentInfo.status === "approved" ? (
                <>
                  <Button asChild>
                    <Link to="/mi-cuenta">Ver mis reservas</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/experiencias">Explorar más experiencias</Link>
                  </Button>
                </>
              ) : paymentInfo.status === "declined" ? (
                <>
                  <Button asChild>
                    <Link to="/experiencias">Intentar de nuevo</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">Ir al inicio</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link to="/experiencias">Ver experiencias</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">Ir al inicio</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Necesitas ayuda? Escríbenos a{" "}
                <a href="mailto:soporte@bepelican.com" className="text-primary underline">
                  soporte@bepelican.com
                </a>
              </p>
            </div>

          </div>

          {/* Post-purchase Upselling */}
          {paymentInfo.status === "approved" && upsellExperiences && upsellExperiences.length > 0 && (
            <div className="mt-6">
              <UpsellSection
                experiences={upsellExperiences}
                destinationCity={paymentInfo.destinationCity || "tu destino"}
                variant="confirmation"
                isLoading={upsellLoading}
              />
            </div>
          )}
        </div>
      </main>

      <BePelicanFooter />
    </div>
  );
};

export default PagoResultado;

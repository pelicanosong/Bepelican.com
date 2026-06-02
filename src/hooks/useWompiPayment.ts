import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WompiPaymentOptions {
  orderId: string;
  bookingDate: string; // yyyy-MM-dd
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerDocument: string;
  customerDocumentType: string;
  experienceTitle: string;
  redirectUrl?: string;
}

interface WompiTransactionResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
}

export const useWompiPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCallback(async (options: WompiPaymentOptions): Promise<WompiTransactionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('wompi-create-transaction', {
        body: {
          orderId: options.orderId,
          bookingDate: options.bookingDate,
          amountInCents: Math.round(options.amount * 100),
          currency: options.currency || 'COP',
          customerEmail: options.customerEmail,
          customerFullName: options.customerName,
          customerPhoneNumber: options.customerPhone,
          customerLegalId: options.customerDocument,
          customerLegalIdType: options.customerDocumentType,
          reference: `BEPELICAN-${options.orderId}`,
          redirectUrl: options.redirectUrl || `${window.location.origin}/checkout/resultado`,
          description: `Reserva: ${options.experienceTitle}`,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Error al crear la transacción');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al procesar el pago');
      }

      return {
        success: true,
        transactionId: data.transactionId,
        redirectUrl: data.redirectUrl,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const redirectToPayment = useCallback((redirectUrl: string) => {
    window.location.href = redirectUrl;
  }, []);

  return {
    createTransaction,
    redirectToPayment,
    isLoading,
    error,
  };
};

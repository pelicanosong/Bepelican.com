import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Users, MapPin, Clock, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalizedExperience } from "@/hooks/useLocalizedExperiences";
import { useAuth } from "@/contexts/AuthContext";
import { useWompiPayment } from "@/hooks/useWompiPayment";
import { useUpsellExperiences } from "@/hooks/useUpsellExperiences";
import { usePublicExperienceLodgings } from "@/hooks/usePublicExperienceLodgings";
import { useLodgingCalendarPrices } from "@/hooks/useLodgingCalendarPrices";
import { customerDetailsSchema } from "@/lib/validations/checkout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import BePelicanHeader from "@/components/bepelican/BePelicanHeader";
import BePelicanFooter from "@/components/bepelican/BePelicanFooter";
import { ProfileSummary } from "@/components/checkout/ProfileSummary";
import { CustomerForm } from "@/components/checkout/CustomerForm";
import { GiftBookingToggle } from "@/components/checkout/GiftBookingToggle";
import UpsellSection from "@/components/upsell/UpsellSection";
import LodgingOptions from "@/components/experience/LodgingOptions";
import { formatPrice } from "@/lib/formatPrice";

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}
interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentType: "CC" | "CE" | "NIT" | "PP";
  documentNumber: string;
}

const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes} min`;
};

const ExperienciaCheckout = () => {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { createTransaction, redirectToPayment, isLoading: paymentLoading, error: paymentError } = useWompiPayment();

  const experienceSlug = searchParams.get("experiencia");
  const dateParam = searchParams.get("fecha");
  const participantsParam = searchParams.get("participantes");
  const precioParam = searchParams.get("precio");
  const origenParam = searchParams.get("origen");
  const acomodacionParam = searchParams.get("acomodacion");

  const { data: experience, isLoading: experienceLoading } = useLocalizedExperience(experienceSlug || "");

  // Lodging options for this experience
  const { data: lodgingOptions = [] } = usePublicExperienceLodgings(experience?.id);
  const [selectedLodgingLinkId, setSelectedLodgingLinkId] = useState<string | null>(null);

  const participants = parseInt(participantsParam || "1", 10);
  const bookingDate = dateParam ? (() => {
    const [year, month, day] = dateParam.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;
  const selectedUnitPrice = precioParam ? parseFloat(precioParam) : (experience ? Number(experience.price) : 0);

  // Find selected lodging option
  const selectedLodgingOption = lodgingOptions.find(o => o.id === selectedLodgingLinkId);

  // Dynamic pricing for selected lodging
  const bookingMonth = bookingDate || new Date();
  const { data: lodgingPrices } = useLodgingCalendarPrices(
    selectedLodgingOption?.lodging_id,
    selectedLodgingOption?.room_type_id,
    bookingMonth,
    participants
  );

  // Calculate lodging price: use dynamic season price if available, otherwise base_price
  const lodgingPrice = (() => {
    if (!selectedLodgingOption) return 0;
    if (dateParam && lodgingPrices?.has(dateParam)) {
      return lodgingPrices.get(dateParam)!.pricePerNight;
    }
    return selectedLodgingOption.room_type?.base_price || 0;
  })();
  const selectedSeasonName = dateParam && lodgingPrices?.get(dateParam)?.season;

  const totalAmount = selectedUnitPrice * participants + lodgingPrice;
  const isLodgingRequired = !!experience?.lodging_required && lodgingOptions.length > 0;

  // Upsell experiences
  const { data: upsellExperiences, isLoading: upsellLoading } = useUpsellExperiences({
    currentExperienceId: experience?.id || "",
    destinationCity: experience?.location_city || "",
    currentPrice: Number(experience?.price) || 0,
    maxResults: 3,
  });

  // Profile data
  const [profileData, setProfileData] = useState<CustomerDetails>({
    email: "", firstName: "", lastName: "", phone: "", documentType: "CC", documentNumber: "",
  });
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: "", firstName: "", lastName: "", phone: "", documentType: "CC", documentNumber: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isGiftBooking, setIsGiftBooking] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id || profileLoaded) return;
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name, email, phone, document_type, document_number")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !profile) {
          const fallbackData = { ...customerDetails, email: user.email || "" };
          setProfileData(fallbackData);
          setCustomerDetails(fallbackData);
          setProfileLoaded(true);
          return;
        }

        let firstName = profile.first_name || "";
        let lastName = profile.last_name || "";
        if (!firstName && profile.full_name) {
          const nameParts = profile.full_name.trim().split(" ");
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }
        const validDocTypes = ["CC", "CE", "NIT", "PP"] as const;
        const docType = validDocTypes.includes(profile.document_type as typeof validDocTypes[number])
          ? (profile.document_type as "CC" | "CE" | "NIT" | "PP") : "CC";
        const data: CustomerDetails = {
          email: profile.email || user.email || "",
          firstName, lastName,
          phone: profile.phone || user.user_metadata?.phone || "",
          documentType: docType,
          documentNumber: profile.document_number || "",
        };
        setProfileData(data);
        setCustomerDetails(data);
        setProfileLoaded(true);
      } catch { setProfileLoaded(true); }
    };
    fetchProfile();
  }, [user, profileLoaded]);

  const hasBasicProfile = profileData.firstName && profileData.email;

  const handleInputChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGiftToggle = (value: boolean) => {
    setIsGiftBooking(value);
    setIsEditingProfile(false);
    if (value) {
      setCustomerDetails({ email: "", firstName: "", lastName: "", phone: "", documentType: "CC", documentNumber: "" });
    } else {
      setCustomerDetails(profileData);
    }
    setFormErrors({});
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setCustomerDetails(profileData);
  };

  const validateForm = (): boolean => {
    const dataToValidate = isGiftBooking || isEditingProfile ? customerDetails : profileData;
    const result = customerDetailsSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormErrors;
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) { toast.error("Por favor completa todos los campos requeridos"); return; }
    if (!experience || !bookingDate || !user) { toast.error("Información incompleta para procesar el pago"); return; }
    if (isLodgingRequired && !selectedLodgingLinkId) {
      toast.error("Debes seleccionar un hospedaje para continuar");
      return;
    }

    setIsProcessing(true);
    try {
      const bookingDetails = isGiftBooking ? customerDetails : isEditingProfile ? customerDetails : profileData;

      // Sync profile if editing own data
      if (!isGiftBooking && isEditingProfile) {
        const fullName = `${customerDetails.firstName} ${customerDetails.lastName}`.trim();
        await supabase.from("profiles").update({
          full_name: fullName,
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          phone: customerDetails.phone,
          document_type: customerDetails.documentType,
          document_number: customerDetails.documentNumber,
        }).eq("id", user.id);
        setProfileData(customerDetails);
      }

      // Create order
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, total_amount: totalAmount, status: "pending", currency: "COP", payment_provider: "wompi",
      }).select().single();
      if (orderError || !order) throw new Error("Error al crear la orden");

      // Create order item
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        experience_id: experience.id,
        quantity: participants,
        unit_price: selectedUnitPrice,
        total_price: totalAmount,
        lodging_id: selectedLodgingOption?.lodging_id || null,
        lodging_room_type_id: selectedLodgingOption?.room_type_id || null,
      });
      if (itemError) throw new Error("Error al crear el detalle de la orden");

      const fullName = `${bookingDetails.firstName} ${bookingDetails.lastName}`.trim();
      const result = await createTransaction({
        orderId: order.id, bookingDate: format(bookingDate, "yyyy-MM-dd"), amount: totalAmount,
        currency: "COP", customerEmail: bookingDetails.email, customerName: fullName,
        customerPhone: bookingDetails.phone, customerDocument: bookingDetails.documentNumber,
        customerDocumentType: bookingDetails.documentType, experienceTitle: experience.title,
      });

      if (result.success && result.redirectUrl) {
        toast.success("Redirigiendo a Wompi...");
        redirectToPayment(result.redirectUrl);
      } else {
        throw new Error(result.error || "Error al procesar el pago");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (authLoading || experienceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!experience || !bookingDate) {
    return (
      <div className="min-h-screen bg-background">
        <BePelicanHeader />
        <main className="pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Información incompleta</h1>
            <p className="text-muted-foreground mb-6">No se encontró la experiencia o la fecha seleccionada.</p>
            <Button asChild><Link to="/experiencias">Ver experiencias</Link></Button>
          </div>
        </main>
        <BePelicanFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <BePelicanHeader />
        <main className="pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Inicia sesión para continuar</h1>
            <p className="text-muted-foreground mb-6">Necesitas una cuenta para completar tu reserva.</p>
            <Button asChild>
              <Link to={`/login?redirect=${encodeURIComponent(`/checkout?experiencia=${experienceSlug}&fecha=${dateParam}&participantes=${participantsParam}`)}`}>
                Iniciar sesión
              </Link>
            </Button>
          </div>
        </main>
        <BePelicanFooter />
      </div>
    );
  }

  const activeDetails = isGiftBooking || isEditingProfile ? customerDetails : profileData;
  const isFormComplete = activeDetails.email && activeDetails.firstName && activeDetails.lastName && activeDetails.phone && activeDetails.documentNumber;
  const lodgingBlocking = isLodgingRequired && !selectedLodgingLinkId;
  const isButtonDisabled = !isFormComplete || isProcessing || paymentLoading || lodgingBlocking;

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader />
      <main className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <Link to={`/experiencias/${experience.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" /> Volver a la experiencia
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gift Toggle */}
              <GiftBookingToggle isGiftBooking={isGiftBooking} onToggle={handleGiftToggle} />

              {/* Profile / Customer Form */}
              {isGiftBooking ? (
                <CustomerForm customerDetails={customerDetails} formErrors={formErrors} onInputChange={handleInputChange} title="Datos del beneficiario" />
              ) : hasBasicProfile && !isEditingProfile ? (
                <ProfileSummary
                  firstName={profileData.firstName} lastName={profileData.lastName}
                  email={profileData.email} phone={profileData.phone}
                  documentType={profileData.documentType} documentNumber={profileData.documentNumber}
                  onEdit={handleEditProfile}
                />
              ) : (
                <CustomerForm customerDetails={customerDetails} formErrors={formErrors} onInputChange={handleInputChange} title="Datos del comprador" />
              )}

              {/* ── Lodging Selection Block ── */}
              {lodgingOptions.length > 0 && (
                <div className="bg-card border rounded-lg p-6">
                  <LodgingOptions
                    options={lodgingOptions}
                    selectedLodgingLinkId={selectedLodgingLinkId}
                    onSelect={setSelectedLodgingLinkId}
                    required={isLodgingRequired}
                  />
                </div>
              )}

              {/* Upsell */}
              {upsellExperiences && upsellExperiences.length > 0 && (
                <UpsellSection
                  experiences={upsellExperiences}
                  destinationCity={experience.location_city}
                  variant="checkout"
                  isLoading={upsellLoading}
                />
              )}

              {/* Payment */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Método de pago</h2>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium">Pago seguro con Wompi</p>
                    <p className="text-sm text-muted-foreground">Serás redirigido a Wompi para completar tu pago de forma segura.</p>
                  </div>
                </div>

                {paymentError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{paymentError}</p>
                  </div>
                )}

                {lodgingBlocking && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">Selecciona un hospedaje para poder continuar con el pago.</p>
                  </div>
                )}

                <Button onClick={handlePayment} disabled={isButtonDisabled} className="w-full h-12 text-base">
                  {isProcessing || paymentLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
                  ) : lodgingBlocking ? (
                    'Selecciona un hospedaje'
                  ) : (
                    `Pagar ${formatPrice(totalAmount)}`
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Al hacer clic en "Pagar" aceptas nuestros{" "}
                  <Link to="/terms-of-service" className="underline hover:text-foreground">Términos de Servicio</Link>{" "}y{" "}
                  <Link to="/privacy-policy" className="underline hover:text-foreground">Política de Privacidad</Link>
                </p>
                <p className="text-xs text-muted-foreground text-center mt-3">🔒 Pago 100% seguro · Recibirás confirmación inmediata por email o WhatsApp.</p>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Resumen de la reserva</h2>

                {experience.cover_image && (
                  <div className="rounded-lg overflow-hidden mb-4">
                    <img src={experience.cover_image} alt={experience.title} className="w-full h-32 object-cover" />
                  </div>
                )}

                <h3 className="font-medium mb-3">{experience.title}</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(bookingDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{participants} {participants === 1 ? "participante" : "participantes"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(experience.duration_minutes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{experience.location_city}</span>
                  </div>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2 text-sm">
                  {origenParam && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Origen</span>
                      <span>{origenParam}</span>
                    </div>
                  )}
                  {acomodacionParam && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acomodación</span>
                      <span>{acomodacionParam}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Experiencia: {formatPrice(selectedUnitPrice)} × {participants}
                    </span>
                    <span>{formatPrice(selectedUnitPrice * participants)}</span>
                  </div>

                  {/* Dynamic lodging line in summary */}
                  {lodgingPrice > 0 && selectedLodgingOption && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Hospedaje{selectedSeasonName ? ` (${selectedSeasonName})` : " (1 noche)"}
                      </span>
                      <span>{formatPrice(lodgingPrice)}</span>
                    </div>
                  )}

                  {/* Show selected lodging info */}
                  {selectedLodgingOption && (
                    <div className="text-xs text-muted-foreground">
                      {selectedLodgingOption.lodging.name}
                      {selectedLodgingOption.room_type && ` — ${selectedLodgingOption.room_type.name}`}
                    </div>
                  )}

                  {!selectedLodgingLinkId && lodgingOptions.length > 0 && !isLodgingRequired && (
                    <div className="flex justify-between text-muted-foreground/60">
                      <span>Hospedaje</span>
                      <span>No incluido</span>
                    </div>
                  )}
                </div>

                <div className="border-t my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Incluye impuestos</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BePelicanFooter />
    </div>
  );
};

export default ExperienciaCheckout;

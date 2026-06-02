import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useExperiences";
import { useCreateExperience, useUpdateExperience, useSyncExperienceCategories, AdminExperienceWithCategory } from "@/hooks/useAdminExperiences";
import { useExperienceImages, GalleryImage } from "@/hooks/useExperienceImages";
import { usePricingRules } from "@/hooks/usePricingRules";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { LocalPricingRule } from "./PricingRulesEditor";
import { toMinutes, fromMinutes } from "@/lib/formatDuration";
import { ItineraryDay } from "./experience-form/ItineraryEditor";

import { experienceFormSchema, ExperienceFormData, FORM_STEPS } from "./experience-form/types";
import { StepProgress } from "./experience-form/StepProgress";
import { Step1Information } from "./experience-form/Step1Information";
import { Step2Location } from "./experience-form/Step2Location";
import { Step3Details } from "./experience-form/Step3Details";
import { Step4Pricing } from "./experience-form/Step4Pricing";
import { Step5Logistics } from "./experience-form/Step5Logistics";
import { Step6ClimatePolicy } from "./experience-form/Step6ClimatePolicy";
import { Step7Multimedia } from "./experience-form/Step7Multimedia";
import { Step8Lodgings, LodgingLink } from "./experience-form/Step8Lodgings";
import { useExperienceLodgings, useSyncExperienceLodgings } from "@/hooks/useExperienceLodgings";

interface ExperienceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: AdminExperienceWithCategory | null;
}

export function ExperienceFormDialog({ open, onOpenChange, experience }: ExperienceFormDialogProps) {
  const { toast } = useToast();
  const { data: categories } = useCategories();
  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();
  const syncCategories = useSyncExperienceCategories();
  const syncExperienceLodgings = useSyncExperienceLodgings();

  const isEditing = !!experience;

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days">("minutes");
  const [localPricingRules, setLocalPricingRules] = useState<LocalPricingRule[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [lodgingLinks, setLodgingLinks] = useState<LodgingLink[]>([]);
  const [lodgingRequired, setLodgingRequired] = useState(false);
  const [savedExperienceId, setSavedExperienceId] = useState<string | null>(null);
  const [isSavingStep, setIsSavingStep] = useState(false);

  const { data: existingRules } = usePricingRules(experience?.id);
  const { data: existingLodgingLinks } = useExperienceLodgings(experience?.id);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      title: "", description: "", short_description: "", location_city: "",
      location_name: "", price: 0, duration_minutes: 60,
      category_ids: [], status: "borrador", max_participants: 10,
      pricing_type: "fixed", location_department: "", environment_type: [],
      difficulty: "", difficulty_notes: "", languages: ["espanol"],
      extra_language_cost: false, location_address: "", meeting_point_url: "",
      end_point_same: true, end_point: "", start_time: "", start_time_flexible: false,
      available_days: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      temperature_range: "", recommended_season: "", arrival_tips: "",
      requirements: [], accessible_reduced_mobility: false, accessible_children: false,
      pets_allowed: false, accessibility_notes: "", cancellation_policy_type: "flexible",
      cancellation_policy: "", includes: [], not_includes: [],
    },
  });

  const currentTitle = form.watch("title");
  const currentSlug = useMemo(() => {
    if (experience?.slug) return experience.slug;
    return currentTitle ? generateSlug(currentTitle) : "";
  }, [experience?.slug, currentTitle]);

  const {
    isUploading, uploadCoverImage, uploadGalleryImage,
    deleteGalleryImage, deleteCoverImage,
  } = useExperienceImages(currentSlug);

  // Reset form when experience changes
  useEffect(() => {
    if (!open) return;
    setCurrentStep(1);
    setCompletedSteps([]);

    if (experience) {
      setSavedExperienceId(experience.id);
      const expAny = experience as any;
      const existingCatIds = experience.categories?.map((c: any) => c.id) || [];
      form.reset({
        title: experience.title,
        description: experience.description,
        short_description: experience.short_description || "",
        location_city: experience.location_city,
        location_name: experience.location_name,
        price: experience.price,
        duration_minutes: experience.duration_minutes,
        
        category_ids: existingCatIds,
        status: experience.status,
        max_participants: experience.max_participants,
        pricing_type: expAny.pricing_type || "fixed",
        location_department: experience.location_department || "",
        environment_type: (() => {
          const raw = expAny.environment_type;
          if (!raw) return [];
          const arr = Array.isArray(raw) ? raw : [raw];
          const flat: string[] = [];
          for (const item of arr) {
            if (typeof item === 'string') {
              try { const p = JSON.parse(item); if (Array.isArray(p)) p.forEach((v: string) => flat.push(v)); else flat.push(item); } catch { flat.push(item); }
            }
          }
          return [...new Set(flat)];
        })(),
        difficulty: expAny.difficulty || "",
        difficulty_notes: expAny.difficulty_notes || "",
        languages: expAny.languages || ["espanol"],
        extra_language_cost: expAny.extra_language_cost || false,
        location_address: experience.location_address || "",
        meeting_point_url: expAny.meeting_point_url || "",
        end_point_same: expAny.end_point_same ?? true,
        end_point: expAny.end_point || "",
        start_time: expAny.start_time || "",
        start_time_flexible: expAny.start_time_flexible || false,
        available_days: expAny.available_days || ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
        temperature_range: expAny.temperature_range || "",
        recommended_season: expAny.recommended_season || "",
        arrival_tips: experience.arrival_tips || "",
        requirements: expAny.requirements || [],
        accessible_reduced_mobility: expAny.accessible_reduced_mobility || false,
        accessible_children: expAny.accessible_children || false,
        pets_allowed: expAny["Se aceptan mascotas"] || false,
        accessibility_notes: expAny.accessibility_notes || "",
        cancellation_policy_type: expAny.cancellation_policy_type || "flexible",
        cancellation_policy: experience.cancellation_policy || "",
        includes: expAny.includes || [],
        not_includes: expAny.not_includes || [],
      });
      setDurationUnit(expAny.duration_unit || "minutes");
      setItinerary(Array.isArray(expAny.itinerary) ? expAny.itinerary : []);
      setLodgingRequired(expAny.lodging_required || false);
      setCoverImageUrl(experience.cover_image);
      if (experience.gallery_images && experience.gallery_images.length > 0) {
        setGalleryImages(experience.gallery_images.map((url, idx) => ({ url, alt: "", index: idx + 1 })));
      } else {
        setGalleryImages([]);
      }
    } else {
      form.reset();
      setDurationUnit("minutes");
      setCoverImageUrl(null);
      setGalleryImages([]);
      setLocalPricingRules([]);
      setItinerary([]);
      setLodgingLinks([]);
      setLodgingRequired(false);
      setSavedExperienceId(null);
    }
  }, [experience, open]);

  // Sync existing pricing rules
  useEffect(() => {
    if (existingRules) {
      setLocalPricingRules(
        existingRules.map((r) => ({
          id: r.id, rule_type: r.rule_type as LocalPricingRule["rule_type"],
          label: r.label, origin_label: (r as any).origin_label ?? null,
          min_pax: r.min_pax, max_pax: r.max_pax, price: r.price,
          sort_order: r.sort_order, is_active: r.is_active,
        }))
      );
    }
  }, [existingRules]);

  // Sync existing lodging links
  useEffect(() => {
    if (existingLodgingLinks) {
      setLodgingLinks(
        existingLodgingLinks.map((l) => ({
          lodging_id: l.lodging_id,
          room_type_id: l.room_type_id,
          is_default_option: l.is_default_option,
          is_active: l.is_active,
        }))
      );
    }
  }, [existingLodgingLinks]);

  // Image handlers
  const handleCoverUpload = async (file: File): Promise<string | null> => {
    if (!currentSlug) {
      toast({ title: "Ingresa un título primero", variant: "destructive" });
      return null;
    }
    const url = await uploadCoverImage(file);
    if (url) setCoverImageUrl(url);
    return url;
  };

  const handleCoverRemove = async () => {
    await deleteCoverImage();
    setCoverImageUrl(null);
  };

  const handleGalleryUpload = async (file: File, index: number): Promise<string | null> => {
    if (!currentSlug) {
      toast({ title: "Ingresa un título primero", variant: "destructive" });
      return null;
    }
    return await uploadGalleryImage(file, index);
  };

  const handleGalleryDelete = async (index: number): Promise<boolean> => {
    return await deleteGalleryImage(index);
  };

  const handleSetAsCover = (imageUrl: string) => {
    setCoverImageUrl(imageUrl);
    toast({ title: "Portada actualizada" });
  };

  const normalizeLodgingLinks = (items: LodgingLink[]) =>
    items
      .filter((item) => Boolean(item.lodging_id))
      .map((item) => ({
        lodging_id: item.lodging_id,
        room_type_id: item.room_type_id || null,
        is_default_option: Boolean(item.is_default_option),
        is_active: Boolean(item.is_active),
      }))
      .sort((a, b) => `${a.lodging_id}:${a.room_type_id ?? ""}`.localeCompare(`${b.lodging_id}:${b.room_type_id ?? ""}`));

  const sanitizedLodgingLinks = useMemo<LodgingLink[]>(
    () => normalizeLodgingLinks(lodgingLinks),
    [lodgingLinks]
  );

  const normalizedExistingLodgingLinks = useMemo<LodgingLink[]>(
    () =>
      normalizeLodgingLinks(
        (existingLodgingLinks || []).map((item) => ({
          lodging_id: item.lodging_id,
          room_type_id: item.room_type_id,
          is_default_option: item.is_default_option,
          is_active: item.is_active,
        }))
      ),
    [existingLodgingLinks]
  );

  const hasLodgingLinksChanges = useMemo(
    () => JSON.stringify(sanitizedLodgingLinks) !== JSON.stringify(normalizedExistingLodgingLinks),
    [sanitizedLodgingLinks, normalizedExistingLodgingLinks]
  );

  const normalizePricingRules = (rules: LocalPricingRule[]) =>
    rules
      .map((rule) => ({
        rule_type: rule.rule_type,
        label: (rule.label || "").trim(),
        origin_label: rule.origin_label?.trim() || null,
        min_pax: rule.min_pax ?? null,
        max_pax: rule.max_pax ?? null,
        price: Number(rule.price || 0),
        sort_order: rule.sort_order ?? 0,
        is_active: Boolean(rule.is_active),
      }))
      .sort((a, b) => (a.sort_order - b.sort_order) || a.label.localeCompare(b.label));

  const normalizedCurrentPricingRules = useMemo(
    () => normalizePricingRules(localPricingRules),
    [localPricingRules]
  );

  const normalizedExistingPricingRules = useMemo(
    () =>
      normalizePricingRules(
        (existingRules || []).map((rule) => ({
          id: rule.id,
          rule_type: rule.rule_type as LocalPricingRule["rule_type"],
          label: rule.label,
          origin_label: (rule as any).origin_label ?? null,
          min_pax: rule.min_pax,
          max_pax: rule.max_pax,
          price: Number(rule.price || 0),
          sort_order: rule.sort_order ?? 0,
          is_active: rule.is_active ?? true,
        }))
      ),
    [existingRules]
  );

  const hasPricingRulesChanges = useMemo(
    () => JSON.stringify(normalizedCurrentPricingRules) !== JSON.stringify(normalizedExistingPricingRules),
    [normalizedCurrentPricingRules, normalizedExistingPricingRules]
  );

  const isTransientFetchError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || "");
    return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
  };

  const runWithRetry = async <T,>(operation: string, fn: () => Promise<T>, maxAttempts = 2): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (!isTransientFetchError(error) || attempt === maxAttempts) {
          const message = error instanceof Error ? error.message : "Error desconocido";
          throw new Error(`${operation}: ${message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`${operation}: error desconocido`);
  };

  // Save pricing rules
  const savePricingRules = async (experienceId: string) => {
    // Batch delete all existing rules at once instead of individual calls
    if (normalizedExistingPricingRules.length > 0) {
      const { error: delErr } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('experience_id', experienceId);
      if (delErr) throw delErr;
    }
    // Batch insert all new rules at once
    if (normalizedCurrentPricingRules.length > 0) {
      const rows = normalizedCurrentPricingRules.map((rule) => ({
        experience_id: experienceId,
        rule_type: rule.rule_type,
        label: rule.label,
        min_pax: rule.min_pax,
        max_pax: rule.max_pax,
        price: rule.price,
        sort_order: rule.sort_order,
        is_active: rule.is_active,
        origin_label: rule.origin_label,
      }));
      const { error: insErr } = await supabase
        .from('pricing_rules')
        .insert(rows as any);
      if (insErr) throw insErr;
    }
  };

  const buildPayload = () => {
    const data = form.getValues();
    const slug = savedExperienceId && experience?.slug ? experience.slug : generateSlug(data.title || "borrador");
    const galleryUrls = galleryImages.map((img) => img.url);
    return {
      title: data.title || "Sin título",
      description: data.description || "Sin descripción",
      short_description: data.short_description || null,
      location_city: data.location_city || "Sin ciudad",
      location_name: data.location_name || "Sin lugar",
      location_department: data.location_department || null,
      location_address: data.location_address || null,
      price: data.price || 0,
      duration_minutes: data.duration_minutes || 60,
      duration_unit: durationUnit,
      // category_id removed - using experience_categories junction table
      status: data.status || "borrador",
      max_participants: data.max_participants || 10,
      pricing_type: data.pricing_type || "fixed",
      slug,
      cover_image: coverImageUrl,
      gallery_images: galleryUrls.length > 0 ? galleryUrls : null,
      environment_type: data.environment_type && data.environment_type.length > 0 ? data.environment_type : null,
      difficulty: data.difficulty || null,
      difficulty_notes: data.difficulty_notes || null,
      languages: data.languages || null,
      extra_language_cost: data.extra_language_cost || false,
      meeting_point_url: data.meeting_point_url || null,
      end_point_same: data.end_point_same ?? true,
      end_point: data.end_point || null,
      start_time: data.start_time || null,
      start_time_flexible: data.start_time_flexible || false,
      available_days: data.available_days || null,
      temperature_range: data.temperature_range || null,
      recommended_season: data.recommended_season || null,
      arrival_tips: data.arrival_tips || null,
      requirements: data.requirements || null,
      "Se aceptan mascotas": data.pets_allowed || false,
      accessible_reduced_mobility: data.accessible_reduced_mobility || false,
      accessible_children: data.accessible_children || false,
      accessibility_notes: data.accessibility_notes || null,
      cancellation_policy_type: data.cancellation_policy_type || null,
      cancellation_policy: data.cancellation_policy || null,
      includes: data.includes || null,
      not_includes: data.not_includes || null,
      itinerary: durationUnit === "days" && itinerary.length > 0 ? itinerary : null,
      lodging_required: lodgingRequired,
    } as any;
  };

  const autoSave = async () => {
    try {
      setIsSavingStep(true);
      const payload = buildPayload();
      const data = form.getValues();
      console.log("[AutoSave] savedExperienceId:", savedExperienceId, "payload:", payload);

      if (savedExperienceId) {
        const result = await runWithRetry("Actualización de experiencia", () =>
          updateExperience.mutateAsync({ id: savedExperienceId, ...payload })
        );
        console.log("[AutoSave] update result:", result);

        if (data.category_ids && data.category_ids.length > 0) {
          await runWithRetry("Sincronización de categorías", () =>
            syncCategories.mutateAsync({ experienceId: savedExperienceId, categoryIds: data.category_ids })
          );
        }

        if (hasLodgingLinksChanges) {
          await runWithRetry("Sincronización de hospedajes", () =>
            syncExperienceLodgings.mutateAsync({ experienceId: savedExperienceId, links: sanitizedLodgingLinks })
          );
        }
      } else {
        // First save — create the experience
        const created = await runWithRetry("Creación de experiencia", () =>
          createExperience.mutateAsync(payload)
        );
        console.log("[AutoSave] create result:", created);
        if (created?.id) {
          setSavedExperienceId(created.id);
          if (data.category_ids && data.category_ids.length > 0) {
            await runWithRetry("Sincronización de categorías", () =>
              syncCategories.mutateAsync({ experienceId: created.id, categoryIds: data.category_ids })
            );
          }
        }
      }
      console.log("[AutoSave] success");
    } catch (error: any) {
      console.error("[AutoSave] error:", error);
      toast({
        title: "Error al guardar automáticamente",
        description: error.message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsSavingStep(false);
    }
  };

  const markStepCompleted = (step: number) => {
    setCompletedSteps((prev) => prev.includes(step) ? prev : [...prev, step]);
  };

  const goNext = async () => {
    markStepCompleted(currentStep);
    await autoSave();
    setCurrentStep((s) => Math.min(s + 1, FORM_STEPS.length));
  };

  const goPrev = async () => {
    await autoSave();
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleStepClick = async (step: number) => {
    if (step === currentStep) return;
    await autoSave();
    markStepCompleted(currentStep);
    setCurrentStep(step);
  };

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const payload = buildPayload();
      const expId = savedExperienceId;

      if (expId) {
        await runWithRetry("Actualización de experiencia", () =>
          updateExperience.mutateAsync({ id: expId, ...payload })
        );
        await runWithRetry("Sincronización de categorías", () =>
          syncCategories.mutateAsync({ experienceId: expId, categoryIds: data.category_ids })
        );

        if (hasPricingRulesChanges) {
          await runWithRetry("Sincronización de reglas de precio", () => savePricingRules(expId));
        }

        if (hasLodgingLinksChanges) {
          await runWithRetry("Sincronización de hospedajes", () =>
            syncExperienceLodgings.mutateAsync({ experienceId: expId, links: sanitizedLodgingLinks })
          );
        }

        toast({ title: "¡Experiencia guardada!" });
      } else {
        const created = await runWithRetry("Creación de experiencia", () =>
          createExperience.mutateAsync(payload)
        );
        if (created?.id) {
          setSavedExperienceId(created.id);
          await runWithRetry("Sincronización de categorías", () =>
            syncCategories.mutateAsync({ experienceId: created.id, categoryIds: data.category_ids })
          );
          if (hasPricingRulesChanges) {
            await runWithRetry("Sincronización de reglas de precio", () => savePricingRules(created.id));
          }
          if (hasLodgingLinksChanges) {
            await runWithRetry("Sincronización de hospedajes", () =>
              syncExperienceLodgings.mutateAsync({ experienceId: created.id, links: sanitizedLodgingLinks })
            );
          }
        }
        toast({ title: "¡Experiencia creada!" });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la experiencia",
        variant: "destructive",
      });
    }
  };

  const isPending = createExperience.isPending || updateExperience.isPending || isSavingStep;
  const isLastStep = currentStep === FORM_STEPS.length;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Information form={form} categories={categories} />;
      case 2: return <Step2Location form={form} />;
      case 3: return <Step3Details form={form} durationUnit={durationUnit} onDurationUnitChange={setDurationUnit} itinerary={itinerary} onItineraryChange={setItinerary} />;
      case 4: return <Step4Pricing form={form} localPricingRules={localPricingRules} onPricingRulesChange={setLocalPricingRules} />;
      case 5: return <Step5Logistics form={form} />;
      case 6: return <Step6ClimatePolicy form={form} />;
      case 7: return (
        <Step7Multimedia
          coverImageUrl={coverImageUrl}
          galleryImages={galleryImages}
          isUploading={isUploading}
          currentSlug={currentSlug}
          onCoverUpload={handleCoverUpload}
          onCoverRemove={handleCoverRemove}
          onGalleryUpload={handleGalleryUpload}
          onGalleryDelete={handleGalleryDelete}
          onGalleryImagesChange={setGalleryImages}
          onSetAsCover={handleSetAsCover}
        />
      );
      case 8: return <Step8Lodgings links={lodgingLinks} onLinksChange={setLodgingLinks} lodgingRequired={lodgingRequired} onLodgingRequiredChange={setLodgingRequired} />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">
            {isEditing || savedExperienceId ? "Editar Experiencia" : "Nueva Experiencia"}
          </DialogTitle>
          {isSavingStep && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Guardando…
            </p>
          )}
        </DialogHeader>

        <StepProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 pb-4">
              {renderStep()}
            </div>

            {/* Navigation footer */}
            <div className="flex-shrink-0 border-t border-border pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={goPrev}
                disabled={currentStep === 1 || isPending}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending || isUploading}
                >
                  Cancelar
                </Button>

                {isLastStep ? (
                  <Button type="submit" disabled={isPending || isUploading} className="gap-2">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" />
                    Guardar y cerrar
                  </Button>
                ) : (
                  <Button type="button" onClick={goNext} disabled={isPending} className="gap-2">
                    {isSavingStep && <Loader2 className="h-4 w-4 animate-spin" />}
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

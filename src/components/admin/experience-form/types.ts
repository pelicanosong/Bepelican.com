import { z } from "zod";

export const experienceFormSchema = z.object({
  // Step 1: Information
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(100),
  category_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos una categoría"),
  short_description: z.string().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(5000),
  status: z.enum(["activa", "borrador", "pausada", "eliminada"]),

  // Step 2: Location
  location_department: z.string().optional().or(z.literal("")),
  location_city: z.string().min(2, "La ciudad es requerida"),
  location_name: z.string().min(2, "El nombre del lugar es requerido"),
  environment_type: z.array(z.string()).optional(),

  // Step 3: Details
  duration_minutes: z.coerce.number().min(1, "La duración es requerida"),
  max_participants: z.coerce.number().min(1, "Mínimo 1 participante").default(10),
  difficulty: z.string().optional().or(z.literal("")),
  difficulty_notes: z.string().optional().or(z.literal("")),
  languages: z.array(z.string()).optional(),
  extra_language_cost: z.boolean().optional(),

  // Step 4: Pricing
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
  pricing_type: z.enum(["fixed", "per_person", "per_origin", "per_accommodation", "per_origin_accommodation"]).default("fixed"),

  // Step 5: Logistics
  location_address: z.string().optional().or(z.literal("")),
  meeting_point_url: z.string().optional().or(z.literal("")),
  end_point_same: z.boolean().optional(),
  end_point: z.string().optional().or(z.literal("")),
  start_time: z.string().optional().or(z.literal("")),
  start_time_flexible: z.boolean().optional(),
  available_days: z.array(z.string()).optional(),

  // Step 6: Climate, recommendations, policies
  temperature_range: z.string().optional().or(z.literal("")),
  recommended_season: z.string().optional().or(z.literal("")),
  arrival_tips: z.string().optional().or(z.literal("")),
  requirements: z.array(z.string()).optional(),
  accessible_reduced_mobility: z.boolean().optional(),
  accessible_children: z.boolean().optional(),
  pets_allowed: z.boolean().optional(),
  accessibility_notes: z.string().optional().or(z.literal("")),
  cancellation_policy_type: z.string().optional().or(z.literal("")),
  cancellation_policy: z.string().optional().or(z.literal("")),

  // Itinerary (day-by-day for multi-day experiences)
  itinerary: z.any().optional(),

  // Step 7: Multimedia (handled via state, not form)
  // Includes/not-includes lists
  includes: z.array(z.string()).optional(),
  not_includes: z.array(z.string()).optional(),

  // Hidden/compat
  category_id: z.string().optional(), // deprecated, kept for compat
});

export type ExperienceFormData = z.infer<typeof experienceFormSchema>;

export const FORM_STEPS = [
  { id: 1, title: "Información", icon: "FileText" },
  { id: 2, title: "Ubicación", icon: "MapPin" },
  { id: 3, title: "Detalles", icon: "Settings" },
  { id: 4, title: "Precios", icon: "DollarSign" },
  { id: 5, title: "Logística", icon: "Navigation" },
  { id: 6, title: "Clima y Políticas", icon: "Shield" },
  { id: 7, title: "Multimedia", icon: "Image" },
  { id: 8, title: "Hospedajes", icon: "Hotel" },
] as const;

export const COLOMBIA_DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar",
  "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
  "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
  "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo",
  "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre",
  "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
];

export const ENVIRONMENT_TYPES = [
  { value: "rural", label: "Rural" },
  { value: "urbano", label: "Urbano" },
  { value: "mixto", label: "Mixto" },
  { value: "costero", label: "Costero" },
  { value: "montaña", label: "Montaña" },
  { value: "selva", label: "Selva" },
  { value: "desierto", label: "Desierto" },
];

export const DIFFICULTY_LEVELS = [
  { value: "baja", label: "Baja", description: "Apto para todos", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "media", label: "Media", description: "Condición física básica", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "alta", label: "Alta", description: "Buena condición física", color: "bg-red-100 text-red-700 border-red-300" },
];

export const LANGUAGE_OPTIONS = [
  { value: "espanol", label: "Español" },
  { value: "ingles", label: "Inglés" },
  { value: "portugues", label: "Portugués" },
  { value: "frances", label: "Francés" },
  { value: "aleman", label: "Alemán" },
];

export const WEEKDAYS = [
  { value: "lunes", label: "Lun" },
  { value: "martes", label: "Mar" },
  { value: "miercoles", label: "Mié" },
  { value: "jueves", label: "Jue" },
  { value: "viernes", label: "Vie" },
  { value: "sabado", label: "Sáb" },
  { value: "domingo", label: "Dom" },
];

export const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible", description: "Cancelación gratuita hasta 24h antes" },
  { value: "moderada", label: "Moderada", description: "Cancelación gratuita hasta 5 días antes" },
  { value: "estricta", label: "Estricta", description: "Sin reembolso después de la reserva" },
];

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import UpsellCard from "./UpsellCard";

interface UpsellExperience {
  id: string;
  title: string;
  slug: string;
  price: number;
  duration_minutes: number;
  cover_image: string | null;
  location_city: string;
  location_name: string;
  short_description: string | null;
}

interface UpsellSectionProps {
  experiences: UpsellExperience[];
  destinationCity: string;
  variant: "checkout" | "confirmation";
  isLoading?: boolean;
}

const UpsellSection = ({
  experiences,
  destinationCity,
  variant,
  isLoading = false
}: UpsellSectionProps) => {
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);

  // Don't render if no experiences or loading
  if (isLoading || !experiences || experiences.length === 0) {
    return null;
  }

  const handleAddExperience = (experienceId: string, slug: string) => {
    setAddingId(experienceId);
    // Navigate to the experience detail page
    navigate(`/experiencias/${slug}`);
  };

  const copyText = variant === "checkout"
    ? `Ya que estarás en ${destinationCity}, muchos viajeros agregan esto 👇`
    : `¡Tu viaje a ${destinationCity} está confirmado! 🎉 Mientras estés allí, puedes sumar estas experiencias recomendadas 👇`;

  const sectionTitle = variant === "checkout"
    ? "Complementa tu viaje"
    : "Experiencias recomendadas";

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h3 className="font-medium text-sm">{sectionTitle}</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{copyText}</p>

      <div className="space-y-3">
        {experiences.map((experience) => (
          <UpsellCard
            key={experience.id}
            id={experience.id}
            title={experience.title}
            slug={experience.slug}
            price={experience.price}
            durationMinutes={experience.duration_minutes}
            coverImage={experience.cover_image}
            locationCity={experience.location_city}
            locationName={experience.location_name}
            shortDescription={experience.short_description}
            onAdd={handleAddExperience}
            isAdding={addingId === experience.id}
          />
        ))}
      </div>
    </div>
  );
};

export default UpsellSection;

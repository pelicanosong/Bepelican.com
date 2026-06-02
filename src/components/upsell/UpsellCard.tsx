import { Clock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/formatPrice";

interface UpsellCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  durationMinutes: number;
  coverImage: string | null;
  locationCity: string;
  locationName: string;
  shortDescription: string | null;
  onAdd: (experienceId: string, slug: string) => void;
  isAdding?: boolean;
}

const UpsellCard = ({
  id,
  title,
  slug,
  price,
  durationMinutes,
  coverImage,
  locationCity,
  locationName,
  shortDescription,
  onAdd,
  isAdding = false
}: UpsellCardProps) => {
  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-0 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {locationCity}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(durationMinutes)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="font-semibold text-sm text-primary">
              {formatPrice(price)}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onAdd(id, slug)}
              disabled={isAdding}
            >
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default UpsellCard;

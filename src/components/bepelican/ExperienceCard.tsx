import { Link } from 'react-router-dom';
import { Clock, MapPin, Users } from 'lucide-react';
import type { ExperienceWithCategory } from '@/hooks/useExperiences';
import { formatPrice } from '@/lib/formatPrice';

interface ExperienceCardProps {
  experience: ExperienceWithCategory;
}

const ExperienceCard = ({ experience }: ExperienceCardProps) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Link 
      to={`/experiencias/${experience.slug}`}
      className="group block bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {experience.cover_image ? (
          <img
            src={experience.cover_image}
            alt={experience.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="font-display text-2xl text-primary/40">BePelican</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category badges */}
        {experience.categories && experience.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {experience.categories.map(cat => (
              <span key={cat.id} className="inline-block text-xs font-medium text-primary uppercase tracking-wider">
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-display text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {experience.title}
        </h3>

        {/* Short description */}
        {experience.short_description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {experience.short_description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{experience.location_city}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(experience.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Hasta {experience.max_participants}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(Number(experience.price))}
          </span>
          <span className="text-sm text-muted-foreground">/ persona</span>
        </div>
      </div>
    </Link>
  );
};

export default ExperienceCard;

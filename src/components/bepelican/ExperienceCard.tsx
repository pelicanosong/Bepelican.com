import type { ExperienceWithCategory } from '@/hooks/useExperiences';
import ExperienceListingCard from '@/components/bepelican/ExperienceListingCard';

interface ExperienceCardProps {
  experience: ExperienceWithCategory;
}

/** Tarjeta de experiencia (listado / grid). */
const ExperienceCard = ({ experience }: ExperienceCardProps) => (
  <ExperienceListingCard experience={experience} />
);

export default ExperienceCard;

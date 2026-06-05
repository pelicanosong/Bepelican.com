type CategoryLike = { name: string; slug: string };

/** Etiqueta de categoría localizada; nunca muestra claves i18n crudas. */
export function getCategoryDisplayName(
  category: CategoryLike | null | undefined,
  t: (key: string) => string,
  language: string
): string | null {
  if (!category) return null;

  if (language === 'es') return category.name;

  const key = `category.${category.slug}`;
  const translated = t(key);
  if (translated !== key) return translated;

  return humanizeCategorySlug(category.slug);
}

function humanizeCategorySlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Primera categoría visible para tarjetas (prioriza la del join). */
export function getPrimaryCategory(
  experience: { category?: CategoryLike | null; categories?: CategoryLike[] }
): CategoryLike | null {
  return experience.category ?? experience.categories?.[0] ?? null;
}

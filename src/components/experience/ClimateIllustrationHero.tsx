import { cn } from '@/lib/utils';
import type { ClimateScenePresetKey } from '@/lib/briseldaDestino';
import { resolveWeatherVisual } from '@/lib/weatherVisual';
import {
  getTerritoryIllustration,
  getWeatherIllustration,
} from '@/lib/climateIllustrationCatalog';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClimateIllustrationHeroProps {
  icon?: string | null;
  preset: ClimateScenePresetKey;
  conditionLabel?: string | null;
  feelsLike?: number | null;
  destino?: string | null;
  className?: string;
}

export function ClimateIllustrationHero({
  icon,
  preset,
  conditionLabel,
  feelsLike,
  destino,
  className,
}: ClimateIllustrationHeroProps) {
  const { language } = useLanguage();
  const variant = resolveWeatherVisual(icon);
  const territory = getTerritoryIllustration(preset);
  const weatherIcon = getWeatherIllustration(variant);
  const alt = language.startsWith('en') ? territory.altEn : territory.altEs;

  return (
    <figure
      className={cn('climate-illustration-hero', `climate-illustration-hero--${preset}`, className)}
      aria-label={conditionLabel ?? alt}
    >
      <div className="climate-illustration-hero__stage">
        <div
          className={cn(
            'climate-illustration-hero__backdrop',
            `climate-illustration-hero__backdrop--${preset}`,
          )}
          aria-hidden
        />

        <img
          src={territory.src}
          alt={alt}
          className="climate-illustration-hero__art"
          width={512}
          height={512}
          loading="eager"
          decoding="async"
        />

        {weatherIcon && (
          <img
            src={weatherIcon}
            alt=""
            className="climate-illustration-hero__weather-badge"
            width={96}
            height={96}
            aria-hidden
          />
        )}

        <div className="climate-illustration-hero__vignette" aria-hidden />

        <div className="climate-illustration-hero__overlay">
          {destino && (
            <p className="climate-illustration-hero__destino font-sans uppercase tracking-[0.2em] text-white/90 text-[11px]">
              {destino}
            </p>
          )}
          <div className="climate-illustration-hero__bottom">
            {feelsLike != null && (
              <p className="climate-illustration-hero__temp font-display tabular-nums">
                {feelsLike}
                <span className="climate-illustration-hero__temp-unit">°</span>
              </p>
            )}
            {conditionLabel && (
              <p className="climate-illustration-hero__condition font-display capitalize text-white">
                {conditionLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      <figcaption className="climate-illustration-hero__credit font-sans">
        <a
          href="https://icons8.com/icon/set/3d-fluency"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bepelican-deepblue/45 hover:text-bepelican-orange transition-colors"
        >
          Ilustraciones 3D · Icons8
        </a>
      </figcaption>
    </figure>
  );
}

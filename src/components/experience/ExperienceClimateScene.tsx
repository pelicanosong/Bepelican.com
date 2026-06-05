import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getThermalBand,
  formatWeatherAge,
  type ThermalBand,
} from '@/lib/briseldaDestino';
import { ClimateIllustrationHero } from '@/components/experience/ClimateIllustrationHero';
import type { ExperienceClimateDisplay } from '@/hooks/useExperienceClimate';
import { Skeleton } from '@/components/ui/skeleton';

export interface ExperienceClimateSceneProps {
  climate: ExperienceClimateDisplay | null | undefined;
  isLoading?: boolean;
  staticClimate?: {
    temperature_range?: string | null;
    recommended_season?: string | null;
  };
  className?: string;
}

function ClimateMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[4.5rem]">
      <span className="text-sm text-bepelican-deepblue/85 tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-bepelican-deepblue/50">
        {label}
      </span>
    </div>
  );
}

function buildAriaLabel(
  destino: string,
  feels: number | null,
  humedad: number | null,
  viento: number | null,
  desc: string | null,
  t: (k: string) => string,
): string {
  const parts = [t('exp.climateLive'), destino];
  if (feels != null) parts.push(`${t('exp.feelsLike')} ${Math.round(feels)}°`);
  if (humedad != null) parts.push(`${t('exp.humidity')} ${humedad}%`);
  if (viento != null) parts.push(`${Math.round(viento)} km/h`);
  if (desc) parts.push(desc);
  return parts.join('. ');
}

export function ExperienceClimateScene({
  climate,
  isLoading,
  staticClimate,
  className,
}: ExperienceClimateSceneProps) {
  const { language, t } = useLanguage();

  const preset = climate?.climate_scene_preset ?? null;
  const destino = climate?.briselda_destino;
  const hasBinding = !!(destino && preset);

  const sensacion = climate?.sensacion_termica ?? null;
  const band: ThermalBand | null =
    sensacion != null ? getThermalBand(Number(sensacion)) : preset === 'nevado_alto' ? 'frio' : null;

  const ageLabel = formatWeatherAge(climate?.weather_fetched_at, language);

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl overflow-hidden border border-border/60', className)}>
        <Skeleton className="h-[min(52vw,420px)] w-full rounded-none bg-muted/40" />
      </div>
    );
  }

  if (!hasBinding) return null;

  const weatherPending = climate?.sensacion_termica == null;
  const feelsDisplay =
    sensacion != null ? Math.round(Number(sensacion)) : weatherPending ? null : null;

  const show3dHero = !weatherPending && climate?.icono && preset;

  return (
    <section
      className={cn(
        'rounded-2xl overflow-hidden border border-border/70 bg-card',
        band && `climate-scene--${band}`,
        preset && `climate-scene--preset-${preset}`,
        className,
      )}
      aria-label={buildAriaLabel(
        destino!,
        sensacion != null ? Number(sensacion) : null,
        climate?.humedad ?? null,
        climate?.viento_kmh ?? null,
        climate?.weather_descripcion ?? null,
        t,
      )}
    >
      {show3dHero && (
        <ClimateIllustrationHero
          preset={preset}
          icon={climate.icono}
          conditionLabel={climate.weather_descripcion}
          feelsLike={feelsDisplay}
          destino={destino}
        />
      )}

      <div className="climate-scene-data px-8 py-8 md:px-10 md:py-10">
        <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-bepelican-deepblue/70 mb-6">
          {t('exp.climateLive')}
        </p>

        {weatherPending ? (
          <p className="font-display text-2xl text-bepelican-deepblue/90">
            {t('exp.climateUpdating')}
          </p>
        ) : (
          <>
            {!show3dHero && (
              <div className="mb-8">
                <p className="font-sans text-sm text-bepelican-deepblue/75 mb-2 tracking-wide">
                  {t('exp.feelsLike')}
                </p>
                <p className="font-display text-6xl md:text-7xl font-normal leading-none text-bepelican-deepblue tabular-nums">
                  {feelsDisplay}
                  <span className="text-3xl md:text-4xl align-top ml-0.5 opacity-80">°</span>
                </p>
                {climate?.weather_descripcion && (
                  <p className="mt-4 font-sans text-sm text-bepelican-deepblue/65 capitalize tracking-wide">
                    {climate.weather_descripcion}
                  </p>
                )}
              </div>
            )}

            {show3dHero && (
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-bepelican-deepblue/45 mb-6">
                {t('exp.climateVisualHint')}
              </p>
            )}

            <div className="pt-2 border-t border-bepelican-deepblue/10 font-sans">
              <div className="flex flex-wrap gap-x-8 gap-y-5 sm:gap-x-10">
                {destino && (
                  <ClimateMetric value={destino} label={t('exp.climateCity')} />
                )}
                {climate?.temperatura != null && (
                  <ClimateMetric
                    value={`${Math.round(Number(climate.temperatura))}°`}
                    label={t('exp.climateAirTempLabel')}
                  />
                )}
                {climate?.humedad != null && (
                  <ClimateMetric
                    value={`${climate.humedad}%`}
                    label={t('exp.climateHumidityLabel')}
                  />
                )}
                {climate?.viento_kmh != null && (
                  <ClimateMetric
                    value={`${Math.round(Number(climate.viento_kmh))} km/h`}
                    label={t('exp.climateWindLabel')}
                  />
                )}
                {ageLabel && (
                  <ClimateMetric value={ageLabel} label={t('exp.climateUpdatedLabel')} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {(staticClimate?.temperature_range || staticClimate?.recommended_season) && (
        <div className="px-8 py-6 md:px-10 border-t border-border/60 bg-bepelican-beige/15">
          <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            {t('exp.climate')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {staticClimate.temperature_range && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('exp.typicalTemp')}</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {staticClimate.temperature_range}
                </p>
              </div>
            )}
            {staticClimate.recommended_season && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('exp.recommendedSeason')}</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {staticClimate.recommended_season}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

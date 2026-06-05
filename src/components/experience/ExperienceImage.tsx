import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import {
  experienceHeroImageProps,
  experienceListImageProps,
  experienceThumbImageProps,
  experienceCarouselImageProps,
} from '@/lib/experienceImage';
import {
  experienceImageSources,
  SIZE_DIMENSIONS,
  type ExperienceImageSize,
} from '@/lib/experienceImageUrls';

type ExtraImgProps = Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  'loading' | 'decoding' | 'fetchPriority' | 'draggable'
>;

interface ExperienceImageProps {
  src: string | null | undefined;
  alt: string;
  size: ExperienceImageSize;
  className?: string;
  priority?: 'list' | 'hero' | 'thumb' | 'carousel-first' | 'carousel';
  imgProps?: ExtraImgProps;
}

function resolvePriorityProps(
  priority: ExperienceImageProps['priority']
): ExtraImgProps {
  switch (priority) {
    case 'hero':
      return experienceHeroImageProps();
    case 'thumb':
      return experienceThumbImageProps();
    case 'carousel-first':
      return experienceCarouselImageProps(true);
    case 'carousel':
      return experienceCarouselImageProps(false);
    case 'list':
    default:
      return experienceListImageProps();
  }
}

export function ExperienceImage({
  src,
  alt,
  size,
  className,
  priority = 'list',
  imgProps,
}: ExperienceImageProps) {
  const [useLegacySrc, setUseLegacySrc] = useState(false);

  if (!src) return null;

  const sources = experienceImageSources(src, size);
  const dims = SIZE_DIMENSIONS[size];
  const loadProps = { ...resolvePriorityProps(priority), ...imgProps };
  const onError = () => setUseLegacySrc(true);

  if (!sources || sources.legacy || useLegacySrc) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={dims.width}
        height={dims.height}
        onError={useLegacySrc ? undefined : onError}
        {...loadProps}
      />
    );
  }

  return (
    <picture>
      <source srcSet={sources.webp} type="image/webp" />
      <img
        src={sources.jpeg}
        alt={alt}
        className={className}
        width={dims.width}
        height={dims.height}
        onError={onError}
        {...loadProps}
      />
    </picture>
  );
}

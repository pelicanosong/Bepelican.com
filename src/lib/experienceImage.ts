import type { ImgHTMLAttributes } from 'react';

type ExperienceImgAttrs = Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  'loading' | 'decoding' | 'fetchPriority'
>;

/** Portada / LCP en ficha de experiencia */
export function experienceHeroImageProps(): ExperienceImgAttrs {
  return { loading: 'eager', decoding: 'async', fetchPriority: 'high' };
}

/** Tarjetas, miniaturas y imágenes fuera del viewport inicial */
export function experienceListImageProps(): ExperienceImgAttrs {
  return { loading: 'lazy', decoding: 'async' };
}

/** Miniaturas de galería (no la imagen principal) */
export function experienceThumbImageProps(): ExperienceImgAttrs {
  return { loading: 'lazy', decoding: 'async' };
}

/** Imagen visible en carrusel móvil (siempre en pantalla) */
export function experienceCarouselImageProps(isFirstSlide: boolean): ExperienceImgAttrs {
  return isFirstSlide
    ? { loading: 'eager', decoding: 'async', fetchPriority: 'high' }
    : { loading: 'eager', decoding: 'async' };
}

/** Ratio 4:3 habitual en cards y galería */
export const EXPERIENCE_CARD_ASPECT = { width: 640, height: 480 } as const;

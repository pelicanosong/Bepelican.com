import * as React from 'react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExperienceImage } from '@/components/experience/ExperienceImage';

interface ExperienceGalleryProps {
  coverImage: string | null;
  galleryImages: string[] | null;
  title: string;
}

const ExperienceGallery = ({ coverImage, galleryImages, title }: ExperienceGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const allImages: string[] = [];
  if (coverImage) allImages.push(coverImage);
  if (galleryImages) {
    galleryImages.forEach((img) => {
      if (img && img !== coverImage) allImages.push(img);
    });
  }

  if (allImages.length === 0) {
    return (
      <div className="aspect-video md:aspect-video aspect-[4/3] rounded-lg overflow-hidden bg-muted">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <span className="font-display text-4xl text-primary/40">BePelican</span>
        </div>
      </div>
    );
  }

  if (allImages.length === 1) {
    return (
      <div
        className="aspect-video md:aspect-video aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer"
        onClick={() => {
          setZoomIndex(0);
          setIsZoomOpen(true);
        }}
      >
        <ExperienceImage
          src={allImages[0]}
          alt={title}
          size="hero"
          priority="hero"
          className="w-full h-full object-cover"
        />
        <ZoomModal
          images={allImages}
          index={zoomIndex}
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          title={title}
        />
      </div>
    );
  }

  const next = () => setCurrentIndex((i) => (i + 1) % allImages.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const openZoom = (idx: number) => {
    setZoomIndex(idx);
    setIsZoomOpen(true);
  };

  return (
    <>
      <div className="hidden md:block">
        {allImages.length <= 2 ? (
          <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
            {allImages.map((img, i) => (
              <div key={i} className="aspect-[4/3] cursor-pointer group" onClick={() => openZoom(i)}>
                <ExperienceImage
                  src={img}
                  alt={`${title} - ${i + 1}`}
                  size={i === 0 ? 'hero' : 'card'}
                  priority={i === 0 ? 'hero' : 'thumb'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-4 grid-rows-2 gap-2 rounded-lg overflow-hidden"
            style={{ height: '480px' }}
          >
            <div className="col-span-2 row-span-2 cursor-pointer group" onClick={() => openZoom(0)}>
              <ExperienceImage
                src={allImages[0]}
                alt={`${title} - 1`}
                size="hero"
                priority="hero"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {allImages.slice(1, 5).map((img, i) => (
              <div key={i} className="relative cursor-pointer group" onClick={() => openZoom(i + 1)}>
                <ExperienceImage
                  src={img}
                  alt={`${title} - ${i + 2}`}
                  size="card"
                  priority="thumb"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {i === 3 && allImages.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-display text-2xl">+{allImages.length - 5}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="md:hidden">
        <div className="relative">
          <div
            className="aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer touch-pan-y"
            onClick={() => openZoom(currentIndex)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ExperienceImage
              src={allImages[currentIndex]}
              alt={`${title} - ${currentIndex + 1}`}
              size="hero"
              priority={currentIndex === 0 ? 'carousel-first' : 'carousel'}
              className="w-full h-full object-cover select-none"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 h-8 w-8 rounded-full"
            onClick={prev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 h-8 w-8 rounded-full"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {allImages.length}
          </div>

          <div className="flex justify-center mt-3 gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-foreground' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <ZoomModal
        images={allImages}
        index={zoomIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        title={title}
      />
    </>
  );
};

function ZoomModal({
  images,
  index,
  isOpen,
  onClose,
  title,
}: {
  images: string[];
  index: number;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) {
  const [current, setCurrent] = React.useState(index);

  React.useEffect(() => {
    if (isOpen) setCurrent(index);
  }, [isOpen, index]);

  const goNext = React.useCallback(
    () => setCurrent((i) => (i + 1) % images.length),
    [images.length]
  );
  const goPrev = React.useCallback(
    () => setCurrent((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/95 animate-fade-in flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 p-2"
      >
        <X className="h-7 w-7" />
      </Button>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/80 text-sm font-medium">
        {current + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <button
          onClick={goPrev}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 md:p-3 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      )}

      {images.length > 1 && (
        <button
          onClick={goNext}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 md:p-3 transition-colors"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      )}

      <div className="relative z-[1] w-full h-full flex items-center justify-center px-16 py-16 pointer-events-none">
        <div className="pointer-events-auto max-w-full max-h-full">
          <ExperienceImage
            src={images[current]}
            alt={`${title} - ${current + 1}`}
            size="hero"
            priority="hero"
            className="max-w-full max-h-[calc(100vh-8rem)] object-contain select-none"
            imgProps={{ draggable: false }}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-[80vw] overflow-x-auto py-1 px-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-10 md:w-16 md:h-12 rounded overflow-hidden border-2 transition-all ${
                i === current ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <ExperienceImage
                src={img}
                alt=""
                size="thumb"
                priority="thumb"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

export default ExperienceGallery;

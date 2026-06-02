import { useRef, useState, useEffect, useCallback } from 'react';
import { usePdfToPages } from '@/hooks/usePdfToPages';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MobilePageViewerProps {
  pdfUrl: string;
  title: string;
  coverImageUrl?: string | null;
}

const MobilePageViewer = ({ pdfUrl, title, coverImageUrl }: MobilePageViewerProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Pinch state
  const pinchRef = useRef({ initialDistance: 0, initialScale: 1 });
  const panRef = useRef({ startX: 0, startY: 0, startTranslateX: 0, startTranslateY: 0 });
  const touchModeRef = useRef<'none' | 'pan' | 'pinch'>('none');

  const { pages, totalPages, isLoading, error, loadPage, progress } = usePdfToPages(pdfUrl, {
    preloadPages: 6,
    coverImageUrl,
  });

  // Preload adjacent pages
  useEffect(() => {
    [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
      .filter(p => p >= 0 && p < totalPages)
      .forEach(p => {
        const pageNum = p + 1;
        if (!pages.find(pg => pg.pageNumber === pageNum && !pg.isLowRes)) {
          loadPage(pageNum);
        }
      });
  }, [currentPage, totalPages, pages, loadPage]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const goToPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      resetZoom();
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
      resetZoom();
    }
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const zoomOut = () => {
    setScale(s => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  // Touch handlers for pinch-to-zoom and pan
  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchModeRef.current = 'pinch';
      pinchRef.current = {
        initialDistance: getDistance(e.touches[0], e.touches[1]),
        initialScale: scale,
      };
    } else if (e.touches.length === 1 && scale > 1) {
      touchModeRef.current = 'pan';
      panRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTranslateX: translate.x,
        startTranslateY: translate.y,
      };
    }
  }, [scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchModeRef.current === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const newScale = Math.min(4, Math.max(1, pinchRef.current.initialScale * (dist / pinchRef.current.initialDistance)));
      setScale(newScale);
      if (newScale <= 1) setTranslate({ x: 0, y: 0 });
    } else if (touchModeRef.current === 'pan' && e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - panRef.current.startX;
      const dy = e.touches[0].clientY - panRef.current.startY;
      setTranslate({
        x: panRef.current.startTranslateX + dx,
        y: panRef.current.startTranslateY + dy,
      });
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    touchModeRef.current = 'none';
  }, []);

  // Swipe to change page (only when not zoomed)
  const swipeRef = useRef({ startX: 0, startTime: 0 });

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (scale > 1 || e.touches.length !== 1) return;
    swipeRef.current = { startX: e.touches[0].clientX, startTime: Date.now() };
  }, [scale]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (scale > 1) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeRef.current.startX;
    const dt = Date.now() - swipeRef.current.startTime;
    if (dt < 400 && Math.abs(dx) > 50) {
      if (dx < 0) goToNext();
      else goToPrev();
    }
  }, [scale, currentPage, totalPages]);

  const currentPageData = pages.find(p => p.pageNumber === currentPage + 1);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-20 relative">
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              background: 'linear-gradient(135deg, #334155 0%, #475569 50%, #334155 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <div className="absolute inset-y-1 left-1 right-1.5 rounded-sm" style={{ background: '#f8fafc' }} />
        </div>
        <p className="text-white/60 text-sm">Abriendo libro...</p>
        <div className="w-44">
          <Progress value={progress} className="h-1" />
        </div>
        <p className="text-xs text-white/30">{progress}%</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Page area — fills space */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center w-full overflow-hidden relative"
        onTouchStart={(e) => { handleTouchStart(e); handleSwipeStart(e); }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => { handleTouchEnd(); handleSwipeEnd(e); }}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
      >
        {currentPageData ? (
          <div
            ref={imageRef}
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              transition: touchModeRef.current !== 'none' ? 'none' : 'transform 0.2s ease-out',
            }}
          >
            <img
              src={currentPageData.imageUrl}
              alt={`Página ${currentPage + 1}`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
              style={{ pointerEvents: 'none' }}
            />
          </div>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        )}

        {/* Zoom indicator */}
        {scale > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className="text-xs text-white/80 font-medium">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="w-full px-4 py-2.5 flex items-center justify-between shrink-0">
        {/* Page nav */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrev}
            disabled={currentPage === 0}
            className="text-white/50 hover:text-white/80 disabled:opacity-20 h-9 w-9 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-xs text-white/40 font-serif tabular-nums min-w-[3rem] text-center">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentPage >= totalPages - 1}
            className="text-white/50 hover:text-white/80 disabled:opacity-20 h-9 w-9 p-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 1}
            className="text-white/50 hover:text-white/80 disabled:opacity-20 h-9 w-9 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 4}
            className="text-white/50 hover:text-white/80 disabled:opacity-20 h-9 w-9 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {scale > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetZoom}
              className="text-white/50 hover:text-white/80 h-9 w-9 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobilePageViewer;

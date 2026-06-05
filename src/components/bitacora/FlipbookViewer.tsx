import { useRef, useState, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { usePdfToPages } from '@/hooks/usePdfToPages';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface FlipbookViewerProps {
  pdfUrl: string;
  title: string;
  coverImageUrl?: string | null;
}

// DEBUG: set to true to show colored borders and console logs
const DEBUG = false;

const FlipbookViewer = ({ pdfUrl, title, coverImageUrl }: FlipbookViewerProps) => {
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const isMobile = useIsMobile();

  const { pages, totalPages, isLoading, error, loadPage, progress, pageAspectRatio } = usePdfToPages(pdfUrl, {
    preloadPages: 6,
    coverImageUrl,
    loadKey: loadAttempt,
  });

  // Measure the actual container and derive book dimensions from it
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availH = rect.height;
      const availW = rect.width;

      if (DEBUG) {
        console.log('[FlipbookViewer] window:', window.innerWidth, window.innerHeight);
        console.log('[FlipbookViewer] container rect:', rect);
      }

      const ratio = pageAspectRatio ?? 0.707;
      const isLandscape = ratio > 1;

      let bookW: number;
      let bookH: number;

      if (isMobile) {
        bookW = availW * 0.98;
        bookH = Math.min(bookW / ratio, availH * 0.97);
        bookW = bookH * ratio;
      } else {
        // Desktop: two-page spread. Contain within container.
        bookH = availH * 0.96;
        const maxWPerPage = (availW * 0.97) / 2;

        bookW = bookH * ratio;
        if (bookW > maxWPerPage) {
          bookW = maxWPerPage;
          bookH = bookW / ratio;
        }
      }

      bookW = Math.max(200, Math.floor(bookW));
      bookH = Math.max(280, Math.floor(bookH));

      if (DEBUG) {
        console.log('[FlipbookViewer] bookW:', bookW, 'bookH:', bookH, 'ratio:', ratio);
      }

      setDims({ w: bookW, h: bookH });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [pageAspectRatio, isMobile]);

  // Lazy-load pages around current position
  useEffect(() => {
    const pagesToLoad = [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
      .filter(p => p >= 1 && p <= totalPages);
    pagesToLoad.forEach(pageNum => {
      if (!pages.find(p => p.pageNumber === pageNum && !p.isLowRes)) {
        loadPage(pageNum);
      }
    });
  }, [currentPage, totalPages, pages, loadPage]);

  const handleFlip = useCallback((e: any) => setCurrentPage(e.data), []);
  const goToPrevPage = () => bookRef.current?.pageFlip()?.flipPrev();
  const goToNextPage = () => bookRef.current?.pageFlip()?.flipNext();

  const debugBorder = DEBUG ? 'border-2' : '';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => setLoadAttempt((n) => n + 1)}>Reintentar</Button>
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

  const { w: bookWidth, h: bookHeight } = dims;

  return (
    // Outer: flex column, fills 100% of the flex-1 parent in the modal
    <div
      className={`flex flex-col w-full h-full ${debugBorder} border-green-500`}
    >
      {/* Book area — grows to fill available space */}
      <div
        ref={containerRef}
        className={`flex-1 min-h-0 flex items-center justify-center w-full relative ${debugBorder} border-blue-500`}
      >
        {/* Desktop nav zones */}
        {!isMobile && (
          <>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="absolute left-0 top-0 bottom-0 w-20 z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-4 disabled:pointer-events-none"
              aria-label="Página anterior"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-2.5">
                <ChevronLeft className="h-5 w-5 text-white/70" />
              </div>
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="absolute right-0 top-0 bottom-0 w-20 z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-4 disabled:pointer-events-none"
              aria-label="Página siguiente"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-2.5">
                <ChevronRight className="h-5 w-5 text-white/70" />
              </div>
            </button>
          </>
        )}

        {pages.length > 0 && bookWidth > 0 && (
          <div className="relative">
            {/* Shadow beneath book */}
            <div
              className="absolute -bottom-4 left-8 right-8 h-8 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)' }}
            />

            <HTMLFlipBook
              ref={bookRef}
              width={bookWidth}
              height={bookHeight}
              size="fixed"
              minWidth={bookWidth}
              maxWidth={bookWidth}
              minHeight={bookHeight}
              maxHeight={bookHeight}
              showCover={true}
              mobileScrollSupport={true}
              onFlip={handleFlip}
              className=""
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={700}
              usePortrait={isMobile}
              startZIndex={0}
              autoSize={false}
              maxShadowOpacity={0.5}
              showPageCorners={true}
              disableFlipByClick={false}
              swipeDistance={30}
              clickEventForward={true}
              useMouseEvents={true}
            >
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = pages.find(p => p.pageNumber === index + 1);
                return (
                  <div
                    key={index}
                    className="relative overflow-hidden bg-white"
                    style={{ width: bookWidth, height: bookHeight }}
                  >
                    {page ? (
                      <img
                        src={page.imageUrl}
                        alt={`Página ${index + 1}`}
                        className="w-full h-full"
                        style={{ objectFit: 'fill', display: 'block' }}
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {index > 0 && (
                      <div className="absolute bottom-1.5 left-0 right-0 text-center pointer-events-none">
                        <span className="text-[9px] text-black/20 font-serif">{index + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </HTMLFlipBook>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className={`w-full px-6 py-2 flex items-center justify-between shrink-0 ${debugBorder} border-red-500`}>
        <p className="text-xs text-white/30 font-serif tabular-nums">
          {currentPage + 1} / {totalPages}
        </p>
        {isMobile ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={currentPage === 0}
              className="text-white/40 hover:text-white/80 disabled:opacity-20 h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages - 1}
              className="text-white/40 hover:text-white/80 disabled:opacity-20 h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-[10px] text-white/25 italic font-serif">
            Arrastra las esquinas o usa las flechas
          </p>
        )}
      </div>
    </div>
  );
};

export default FlipbookViewer;

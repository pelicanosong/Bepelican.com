import { useEffect, useRef } from 'react';
import { X, Share2, Heart, ExternalLink, Download } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FlipbookViewer from './FlipbookViewer';
import MobilePageViewer from './MobilePageViewer';
import { Flipbook, useIncrementViewCount } from '@/hooks/useFlipbooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ExperienceImage } from '@/components/experience/ExperienceImage';

interface FlipbookModalProps {
  flipbook: (Flipbook & { related_experiences?: any[] }) | null;
  isOpen: boolean;
  onClose: () => void;
}

const FlipbookModal = ({ flipbook, isOpen, onClose }: FlipbookModalProps) => {
  const incrementView = useIncrementViewCount();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const handleDownload = async () => {
    if (!flipbook) return;
    if (!user) {
      toast.error('Debes iniciar sesión para descargar este contenido', {
        action: {
          label: 'Iniciar sesión',
          onClick: () => { window.location.href = '/login'; },
        },
      });
      return;
    }
    try {
      const response = await fetch(flipbook.pdf_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${flipbook.slug || flipbook.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar el archivo');
    }
  };

  useEffect(() => {
    if (isOpen && flipbook) {
      incrementView.mutate(flipbook.id);
    }
  }, [isOpen, flipbook?.id]);

  const handleShare = async () => {
    if (!flipbook) return;
    const shareUrl = `${window.location.origin}/biblioteca/${flipbook.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: flipbook.title,
          text: flipbook.description || 'Descubre esta historia en BePelican',
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (!flipbook) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        {/* Content — truly fullscreen, no Radix/shadcn size constraints */}
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col overflow-hidden focus:outline-none"
          style={{ background: '#0f172a' }}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {flipbook.title}
          </DialogPrimitive.Title>

          {/* Top bar — 56px */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="flex flex-col items-center gap-1">
              <h2 className="text-sm font-serif text-white/60 font-medium tracking-wide hidden md:block">
                {flipbook.title}
              </h2>
              <div className="flex items-center gap-1.5">
                {flipbook.categories?.slice(0, 2).map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="text-[10px] border-white/20 text-white/40 bg-transparent font-serif"
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
                title="Descargar PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toast.info('Función próximamente disponible')}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Viewer — fills remaining height */}
          <div className="flex-1 min-h-0 w-full">
            {isMobile ? (
              <MobilePageViewer
                pdfUrl={flipbook.pdf_url}
                title={flipbook.title}
                coverImageUrl={flipbook.cover_image}
              />
            ) : (
              <FlipbookViewer
                pdfUrl={flipbook.pdf_url}
                title={flipbook.title}
                coverImageUrl={flipbook.cover_image}
              />
            )}
          </div>

          {/* Related experiences */}
          {flipbook.related_experiences && flipbook.related_experiences.length > 0 && (
            <div className="absolute bottom-14 left-4 right-4 md:left-auto md:right-4 md:w-80 pointer-events-auto">
              <div
                className="rounded-xl p-3 border border-white/10"
                style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)' }}
              >
                <h4 className="text-xs font-serif text-white/40 mb-2 uppercase tracking-wider">
                  Experiencias relacionadas
                </h4>
                <div className="flex flex-col gap-2">
                  {flipbook.related_experiences.slice(0, 3).map((exp: any) => (
                    <a
                      key={exp.id}
                      href={`/experiencias/${exp.slug}`}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {exp.cover_image && (
                        <ExperienceImage
                          src={exp.cover_image}
                          alt={exp.title}
                          size="thumb"
                          priority="list"
                          className="w-9 h-9 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/70 line-clamp-1 font-serif">{exp.title}</p>
                        <p className="text-[10px] text-white/30">{exp.location_city}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-white/20 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default FlipbookModal;

import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using Vite's ?url import for reliable loading
// Worker desde CDN: nginx servía .mjs como octet-stream → "Failed to fetch dynamically imported module"
const PDFJS_VERSION = '4.10.38';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const RECOMMENDED_PDF_BYTES = 20 * 1024 * 1024;

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchPdfBytes(
  url: string,
  onProgress: (pct: number) => void
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo descargar el PDF (error ${res.status}).`);
  }

  const total = Number(res.headers.get('content-length') || 0);
  if (total > MAX_PDF_BYTES) {
    throw new Error(
      `El PDF pesa ${formatMb(total)}. Comprimilo a menos de ${formatMb(RECOMMENDED_PDF_BYTES)} (máximo ${formatMb(MAX_PDF_BYTES)}).`
    );
  }

  if (!res.body || !total) {
    onProgress(35);
    return res.arrayBuffer();
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress(Math.min(45, Math.round((loaded / total) * 45)));
  }

  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged.buffer;
}

function pdfLoadErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Error al cargar el PDF. Probá con un archivo más liviano (menos de 20 MB).';
}

interface PdfPage {
  pageNumber: number;
  imageUrl: string;
  isLowRes?: boolean;
}

interface UsePdfToPagesResult {
  pages: PdfPage[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  loadPage: (pageNumber: number) => Promise<string | null>;
  progress: number;
  pageAspectRatio: number | null; // width / height of PDF pages
}

export const usePdfToPages = (pdfUrl: string | null, options?: {
  scale?: number;
  preloadPages?: number;
  coverImageUrl?: string | null;
  /** Incrementar para forzar recarga (botón Reintentar). */
  loadKey?: number;
}): UsePdfToPagesResult => {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Use devicePixelRatio for sharp rendering — minimum 2 for retina clarity
  const hiResScale = Math.max(2, window.devicePixelRatio || 2);
  const lowResScale = Math.max(0.8, hiResScale * 0.4);
  const preloadPages = options?.preloadPages || 4;
  const coverImageUrl = options?.coverImageUrl;

  // Render a single page to canvas at the given scale
  const renderPage = useCallback(async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    pageScale: number
  ): Promise<string | null> => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: pageScale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      // High quality JPEG for hi-res, lower for preview
      return canvas.toDataURL('image/jpeg', pageScale >= 1.5 ? 0.92 : 0.65);
    } catch (err) {
      console.error(`Error rendering page ${pageNumber}:`, err);
      return null;
    }
  }, []);

  // Load PDF with progressive strategy: cover → low-res → hi-res
  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setPages([]);
      setPageAspectRatio(null);

      // Step 1: Show cover image immediately if available
      if (coverImageUrl) {
        setPages([{ pageNumber: 1, imageUrl: coverImageUrl, isLowRes: true }]);
        setProgress(10);
      }

      try {
        const pdfBytes = await fetchPdfBytes(pdfUrl, (pct) => {
          if (!cancelled) setProgress(Math.max(5, pct));
        });
        if (cancelled) return;

        setProgress(48);
        const pdf = await pdfjsLib.getDocument({
          data: pdfBytes,
          useSystemFonts: true,
          disableFontFace: true,
        }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);

        // Detect page aspect ratio from first page
        const firstPage = await pdf.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        setPageAspectRatio(vp.width / vp.height);

        const pagesToLoad = Math.min(preloadPages, pdf.numPages);

        // Step 2: Render initial pages in LOW resolution (fast first paint)
        const lowResPages: PdfPage[] = coverImageUrl
          ? [{ pageNumber: 1, imageUrl: coverImageUrl, isLowRes: true }]
          : [];

        const startPage = coverImageUrl ? 2 : 1;

        for (let i = startPage; i <= pagesToLoad; i++) {
          if (cancelled) return;
          const imageUrl = await renderPage(pdf, i, lowResScale);
          if (imageUrl) {
            lowResPages.push({ pageNumber: i, imageUrl, isLowRes: true });
          }
          setProgress(Math.round((i / pagesToLoad) * 55));
        }

        if (cancelled) return;
        setPages(lowResPages);
        setIsLoading(false); // Reader can start immediately

        // Step 3: Upgrade silently to HI-RES (sharp, re-renders at full devicePixelRatio)
        for (let i = 1; i <= pagesToLoad; i++) {
          if (cancelled) return;
          const imageUrl = await renderPage(pdf, i, hiResScale);
          if (imageUrl) {
            setPages(prev =>
              prev.map(p =>
                p.pageNumber === i ? { pageNumber: i, imageUrl, isLowRes: false } : p
              )
            );
          }
          setProgress(55 + Math.round((i / pagesToLoad) * 45));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading PDF:', err);
          setError(pdfLoadErrorMessage(err));
          setIsLoading(false);
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl, hiResScale, lowResScale, preloadPages, coverImageUrl, renderPage, options?.loadKey]);

  // Load a specific page on demand (hi-res only)
  const loadPage = useCallback(async (pageNumber: number): Promise<string | null> => {
    const existing = pages.find(p => p.pageNumber === pageNumber);
    if (existing && !existing.isLowRes) return existing.imageUrl;

    const pdf = pdfDocRef.current;
    if (!pdf || pageNumber < 1 || pageNumber > totalPages) return null;

    try {
      const imageUrl = await renderPage(pdf, pageNumber, hiResScale);
      if (imageUrl) {
        setPages(prev => {
          const exists = prev.some(p => p.pageNumber === pageNumber);
          if (exists) {
            return prev.map(p =>
              p.pageNumber === pageNumber ? { pageNumber, imageUrl, isLowRes: false } : p
            );
          }
          return [...prev, { pageNumber, imageUrl, isLowRes: false }].sort(
            (a, b) => a.pageNumber - b.pageNumber
          );
        });
      }
      return imageUrl;
    } catch (err) {
      console.error(`Error loading page ${pageNumber}:`, err);
      return null;
    }
  }, [pages, totalPages, hiResScale, renderPage]);

  return { pages, totalPages, isLoading, error, loadPage, progress, pageAspectRatio };
};

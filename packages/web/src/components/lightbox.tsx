'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { MediaRenderer, extractDominantColor } from './media-renderer';
import { ZoomableImage } from './zoomable-image';
import { Notes } from './notes';
import { useTouch } from '@/lib/use-touch';
import { ShareButton } from './share-button';
import { api } from '@/lib/api';

interface LightboxProps {
  piece: {
    id?: string;
    title: string;
    description?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
    sourceUrl: string;
    tags: string[];
    isFavorite?: boolean;
  } | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFavorite?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function Lightbox({ piece, onClose, onPrev, onNext, onToggleFavorite, hasPrev, hasNext }: LightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    },
    [onPrev, onNext, hasPrev, hasNext],
  );

  useEffect(() => {
    if (!piece) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [piece, handleKeyDown]);

  const [related, setRelated] = useState<any[]>([]);
  const [ambientColor, setAmbientColor] = useState<string | null>(null);

  useEffect(() => {
    if (piece?.id) {
      api.artPieces.related(piece.id).then(setRelated).catch(() => setRelated([]));
    } else {
      setRelated([]);
    }
  }, [piece?.id]);

  // Extract dominant color for ambient glow
  useEffect(() => {
    if (!piece || piece.mediaType !== 'IMAGE') {
      setAmbientColor(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const color = extractDominantColor(img);
      setAmbientColor(color);
    };
    img.onerror = () => setAmbientColor(null);
    img.src = piece.sourceUrl;
  }, [piece?.sourceUrl, piece?.mediaType]);

  const touchHandlers = useTouch(
    useMemo(
      () => ({
        onSwipeLeft: () => hasNext && onNext?.(),
        onSwipeRight: () => hasPrev && onPrev?.(),
        onSwipeDown: () => onClose(),
      }),
      [hasNext, hasPrev, onNext, onPrev, onClose],
    ),
  );

  const navButtonClass =
    'absolute top-1/2 -translate-y-1/2 z-10 rounded-full bg-themed-card p-3 text-themed shadow-lg transition-all hover:accent-text hover:scale-110 disabled:opacity-30 disabled:hover:scale-100';

  return (
    <Dialog.Root open={!!piece} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 backdrop-blur-sm transition-colors duration-500 data-[state=open]:animate-lightbox-bg"
          style={{
            backgroundColor: ambientColor
              ? ambientColor.replace('rgb', 'rgba').replace(')', ',0.15)')
              : 'rgba(0,0,0,0.85)',
            backgroundImage: ambientColor
              ? `radial-gradient(ellipse at center, ${ambientColor.replace('rgb', 'rgba').replace(')', ',0.2)')}, rgba(0,0,0,0.85) 70%)`
              : undefined,
          }}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          aria-label={piece?.title ? `Viewing: ${piece.title}` : 'Art piece viewer'}
          onPointerDownOutside={() => onClose()}
          {...touchHandlers}
        >
          {piece && (
            <div className="relative max-h-[90vh] max-w-[95vw] animate-lightbox-content sm:max-w-[90vw]">
              {/* Close button */}
              <Dialog.Close asChild>
                <button className="absolute -right-2 -top-2 z-20 rounded-full bg-themed-card p-2 text-themed shadow-lg hover:accent-text sm:-right-3 sm:-top-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>

              {/* Prev button */}
              {onPrev && (
                <button onClick={onPrev} disabled={!hasPrev} className={`${navButtonClass} -left-14 hidden lg:block`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}

              {/* Next button */}
              {onNext && (
                <button onClick={onNext} disabled={!hasNext} className={`${navButtonClass} -right-14 hidden lg:block`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              )}

              <div
                className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-themed-card transition-shadow duration-500"
                style={{
                  boxShadow: ambientColor
                    ? `0 0 60px 15px ${ambientColor.replace('rgb', 'rgba').replace(')', ',0.3)')}, 0 0 120px 40px ${ambientColor.replace('rgb', 'rgba').replace(')', ',0.15)')}`
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Image — shrinks to fit, never clips */}
                <div className="shrink-0">
                  {piece.mediaType === 'IMAGE' ? (
                    <ZoomableImage src={piece.sourceUrl} alt={piece.title} className="max-h-[55vh]" />
                  ) : (
                    <MediaRenderer
                      mediaType={piece.mediaType}
                      sourceUrl={piece.sourceUrl}
                      title={piece.title}
                      className="max-h-[55vh] object-contain"
                    />
                  )}
                </div>

                {/* Content — scrollable when needed */}
                <ScrollArea.Root className="min-h-0 flex-1">
                  <ScrollArea.Viewport className="max-h-[32vh] w-full">
                    <div className="p-4 sm:p-6">
                      {/* Title + actions */}
                      <div className="flex items-start justify-between gap-4">
                        <Dialog.Title className="text-lg font-bold text-themed sm:text-xl">
                          {piece.title}
                        </Dialog.Title>
                        <div className="flex shrink-0 items-center gap-2">
                          {onToggleFavorite && (
                            <button onClick={onToggleFavorite} className="p-1 transition-transform hover:scale-110">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill={piece.isFavorite ? 'var(--accent)' : 'none'}
                                stroke={piece.isFavorite ? 'var(--accent)' : 'currentColor'}
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="text-themed-muted">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                          )}
                          <ShareButton title={piece.title} text={piece.description} url={piece.sourceUrl} />
                          {piece.id && (
                            <a href={`/edit/${piece.id}`}
                              className="rounded-lg bg-themed-input px-3 py-1.5 text-xs font-medium text-themed-secondary hover:text-themed">
                              Edit
                            </a>
                          )}
                        </div>
                      </div>

                      {piece.description && (
                        <Dialog.Description className="mt-2 text-sm text-themed-secondary">
                          {piece.description}
                        </Dialog.Description>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {piece.tags.map((tag) => (
                          <span key={tag} className="rounded-full accent-soft-bg px-3 py-1 text-xs accent-text">{tag}</span>
                        ))}
                      </div>

                      {piece.id && <Notes artPieceId={piece.id} />}

                      {related.length > 0 && (
                        <div className="mt-4 border-t border-themed pt-4">
                          <h4 className="mb-3 text-sm font-semibold text-themed-secondary">Related</h4>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {related.map((r: any) => (
                              <a key={r.id} href={`/edit/${r.id}`}
                                className="h-14 w-18 shrink-0 overflow-hidden rounded-lg border border-themed hover:border-[var(--accent)]">
                                {r.mediaType === 'IMAGE' ? (
                                  <img src={r.sourceUrl} alt={r.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-themed-input text-[8px] text-themed-muted">{r.mediaType}</div>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {(onPrev || onNext) && (
                        <div className="mt-4 flex justify-between lg:hidden">
                          <button onClick={onPrev} disabled={!hasPrev}
                            className="rounded-lg bg-themed-input px-4 py-2 text-sm text-themed-secondary disabled:opacity-30">
                            &larr; Prev
                          </button>
                          <button onClick={onNext} disabled={!hasNext}
                            className="rounded-lg bg-themed-input px-4 py-2 text-sm text-themed-secondary disabled:opacity-30">
                            Next &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar orientation="vertical" className="flex w-2 touch-none select-none p-0.5">
                    <ScrollArea.Thumb className="relative flex-1 rounded-full bg-themed-muted/30" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

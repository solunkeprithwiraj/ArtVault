'use client';

import { useEffect, useCallback } from 'react';
import { MediaRenderer } from './media-renderer';
import { Notes } from './notes';

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
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext],
  );

  useEffect(() => {
    if (!piece) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [piece, handleKeyDown]);

  if (!piece) return null;

  const navButtonClass =
    'absolute top-1/2 -translate-y-1/2 z-10 rounded-full bg-themed-card p-3 text-themed shadow-lg transition-all hover:accent-text hover:scale-110 disabled:opacity-30 disabled:hover:scale-100';

  return (
    <div className="lightbox-overlay animate-lightbox-bg" onClick={onClose}>
      <div
        className="animate-lightbox-content relative max-h-[90vh] max-w-[95vw] sm:max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 rounded-full bg-themed-card p-2 text-themed shadow-lg hover:accent-text sm:-right-3 sm:-top-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Prev button */}
        {onPrev && (
          <button onClick={onPrev} disabled={!hasPrev} className={`${navButtonClass} -left-14 hidden sm:block`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {onNext && (
          <button onClick={onNext} disabled={!hasNext} className={`${navButtonClass} -right-14 hidden sm:block`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}

        <div className="overflow-hidden rounded-xl bg-themed-card shadow-2xl">
          <MediaRenderer
            mediaType={piece.mediaType}
            sourceUrl={piece.sourceUrl}
            title={piece.title}
            className="max-h-[70vh] object-contain"
          />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-themed sm:text-xl">{piece.title}</h2>
              <div className="flex shrink-0 items-center gap-2">
                {onToggleFavorite && (
                  <button onClick={onToggleFavorite} className="p-1 transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                      fill={piece.isFavorite ? 'var(--accent)' : 'none'}
                      stroke={piece.isFavorite ? 'var(--accent)' : 'currentColor'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-themed-muted"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
                {piece.id && (
                  <a
                    href={`/edit/${piece.id}`}
                    className="rounded-lg bg-themed-input px-3 py-1.5 text-xs font-medium text-themed-secondary hover:text-themed"
                  >
                    Edit
                  </a>
                )}
              </div>
            </div>
            {piece.description && (
              <p className="mt-2 text-themed-secondary">{piece.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {piece.tags.map((tag) => (
                <span key={tag} className="rounded-full accent-soft-bg px-3 py-1 text-sm accent-text">
                  {tag}
                </span>
              ))}
            </div>

            {/* Notes */}
            {piece.id && <Notes artPieceId={piece.id} />}

            {/* Mobile prev/next */}
            {(onPrev || onNext) && (
              <div className="mt-4 flex justify-between sm:hidden">
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="rounded-lg bg-themed-input px-4 py-2 text-sm text-themed-secondary disabled:opacity-30"
                >
                  &larr; Prev
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="rounded-lg bg-themed-input px-4 py-2 text-sm text-themed-secondary disabled:opacity-30"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaRenderer } from './media-renderer';

interface SlideshowProps {
  pieces: Array<{
    id: string;
    title: string;
    description?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
    sourceUrl: string;
  }>;
  onClose: () => void;
}

export function Slideshow({ pieces, onClose }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interval, setIntervalTime] = useState(5000);

  const piece = pieces[index];
  const total = pieces.length;

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (paused || piece?.mediaType !== 'IMAGE') return;
    const timer = setTimeout(next, interval);
    return () => clearTimeout(timer);
  }, [index, paused, interval, next, piece?.mediaType]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'p') setPaused((p) => !p);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, next, prev]);

  if (!piece) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-white">
          <h2 className="text-lg font-semibold">{piece.title}</h2>
          {piece.description && <p className="text-sm text-neutral-400">{piece.description}</p>}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{index + 1} / {total}</span>

          {/* Speed control */}
          <select
            value={interval}
            onChange={(e) => setIntervalTime(+e.target.value)}
            className="rounded bg-neutral-800 px-2 py-1 text-sm text-white"
          >
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={8000}>8s</option>
            <option value={15000}>15s</option>
          </select>

          {/* Pause/play */}
          <button onClick={() => setPaused((p) => !p)} className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700">
            {paused ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>

          {/* Close */}
          <button onClick={onClose} className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 items-center justify-center px-16">
        {/* Prev */}
        <button onClick={prev} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="max-h-[80vh] max-w-[85vw]">
          <MediaRenderer
            mediaType={piece.mediaType}
            sourceUrl={piece.sourceUrl}
            title={piece.title}
            className="max-h-[80vh] object-contain"
          />
        </div>

        {/* Next */}
        <button onClick={next} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {!paused && piece.mediaType === 'IMAGE' && (
        <div className="h-1 bg-neutral-800">
          <div
            className="h-full bg-[var(--accent)] transition-none"
            style={{
              animation: `slideshow-progress ${interval}ms linear`,
            }}
          />
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto px-6 py-3">
        {pieces.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            className={`h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
              i === index ? 'border-[var(--accent)] opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
            }`}
          >
            {p.mediaType === 'IMAGE' ? (
              <img src={p.sourceUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-[8px] text-neutral-400">
                {p.mediaType}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

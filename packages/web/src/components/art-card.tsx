'use client';

import { useState } from 'react';
import { MediaRenderer } from './media-renderer';

interface ArtCardProps {
  piece: {
    id: string;
    title: string;
    description?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
    sourceUrl: string;
    tags: string[];
    isFavorite?: boolean;
    collection?: { name: string } | null;
  };
  layout?: 'masonry' | 'grid' | 'list' | 'museum' | 'portfolio';
  index?: number;
  selected?: boolean;
  selectMode?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

export function ArtCard({
  piece,
  layout = 'masonry',
  index = 0,
  selected,
  selectMode,
  onSelect,
  onOpen,
  onDelete,
  onToggleFavorite,
  draggable,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: ArtCardProps) {
  const isListView = layout === 'list';
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  const handleClick = () => {
    if (selectMode && onSelect) {
      onSelect(piece.id);
    } else {
      onOpen?.(piece.id);
    }
  };

  return (
    <div
      className={`animate-card-enter group relative overflow-hidden rounded-xl bg-themed-card border transition-all hover:shadow-lg ${
        selected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-themed hover:border-[var(--border-hover)]'
      } ${isListView ? 'flex gap-4' : 'masonry-item'}`}
      style={{
        animationDelay: `${Math.min(index * 50, 500)}ms`,
        ...(dominantColor && !isListView ? { boxShadow: `0 8px 24px ${dominantColor.replace('rgb', 'rgba').replace(')', ',0.15)')}` } : {}),
      }}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, piece.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDragLeave={(e) => onDragLeave?.(e)}
      onDrop={(e) => onDrop?.(e, piece.id)}
    >
      {/* Selection checkbox */}
      {selectMode && (
        <div className="absolute left-2 top-2 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(piece.id); }}
            className="flex h-8 w-8 items-center justify-center rounded-md border-2 transition-colors sm:h-6 sm:w-6"
            style={{
              borderColor: selected ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              backgroundColor: selected ? 'var(--accent)' : 'rgba(0,0,0,0.4)',
            }}
          >
            {selected && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Media */}
      <div
        className={`cursor-pointer ${isListView ? 'h-24 w-36 shrink-0 sm:h-28 sm:w-44' : ''}`}
        onClick={handleClick}
      >
        <MediaRenderer
          mediaType={piece.mediaType}
          sourceUrl={piece.sourceUrl}
          title={piece.title}
          className={isListView ? 'h-full object-cover' : ''}
          thumbnail
          onColorExtract={piece.mediaType === 'IMAGE' ? setDominantColor : undefined}
        />
      </div>

      {/* Content */}
      <div className={`flex-1 ${isListView ? 'flex items-center justify-between gap-4 py-3 pr-4' : 'p-4'}`}>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-themed truncate">{piece.title}</h3>
          {piece.description && (
            <p className={`mt-1 text-sm text-themed-secondary ${isListView ? 'truncate' : 'line-clamp-2'}`}>
              {piece.description}
            </p>
          )}
          {!isListView && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {piece.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-themed-input px-2.5 py-0.5 text-xs text-themed-secondary">{tag}</span>
              ))}
            </div>
          )}
          {piece.collection && (
            <p className={`text-xs accent-text ${isListView ? 'mt-0.5' : 'mt-2'}`}>{piece.collection.name}</p>
          )}
        </div>

        {isListView && piece.tags.length > 0 && (
          <div className="hidden shrink-0 gap-1.5 lg:flex">
            {piece.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-themed-input px-2.5 py-0.5 text-xs text-themed-secondary">{tag}</span>
            ))}
            {piece.tags.length > 3 && <span className="text-xs text-themed-muted">+{piece.tags.length - 3}</span>}
          </div>
        )}

        {/* List view inline actions */}
        {isListView && (
          <div className="flex shrink-0 items-center gap-1">
            {onToggleFavorite && (
              <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(piece.id); }} className="p-2.5 sm:p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill={piece.isFavorite ? 'var(--accent)' : 'none'}
                  stroke={piece.isFavorite ? 'var(--accent)' : 'currentColor'}
                  strokeWidth="2" className="text-themed-muted">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
            <a href={`/edit/${piece.id}`} className="p-2.5 text-themed-muted hover:text-themed sm:p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </a>
          </div>
        )}

        {/* Mobile action bar (non-list views) — always visible on mobile */}
        {!isListView && !selectMode && (
          <div className="mt-2 flex items-center justify-between border-t border-themed pt-2 sm:hidden">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(piece.id); }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-themed-secondary active:bg-themed-input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill={piece.isFavorite ? '#ec4899' : 'none'} stroke={piece.isFavorite ? '#ec4899' : 'currentColor'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {piece.isFavorite ? 'Liked' : 'Like'}
              </button>
            )}
            <a
              href={`/edit/${piece.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-themed-secondary active:bg-themed-input"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </a>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(piece.id); }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-red-400 active:bg-red-500/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop overlay actions (masonry/grid) — hidden on mobile */}
      {!isListView && !selectMode && (
        <div className="absolute right-2 top-2 hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          {onToggleFavorite && (
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(piece.id); }} className="rounded-full bg-black/60 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill={piece.isFavorite ? '#ec4899' : 'none'} stroke={piece.isFavorite ? '#ec4899' : '#a3a3a3'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
          <a href={`/edit/${piece.id}`} onClick={(e) => e.stopPropagation()} className="rounded-full bg-black/60 p-2 text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </a>
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(piece.id); }} className="rounded-full bg-black/60 p-2 text-neutral-400 hover:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {draggable && !isListView && (
        <div className="absolute left-2 top-2 hidden cursor-grab rounded-full bg-black/60 p-2 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 sm:block">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      )}
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useKeyboard } from '@/lib/use-keyboard';
import { useInfiniteScroll } from '@/lib/use-infinite-scroll';
import { ArtCard } from '@/components/art-card';
import { Lightbox } from '@/components/lightbox';
import { FilterBar } from '@/components/filter-bar';
import { BatchBar } from '@/components/batch-bar';
import { Slideshow } from '@/components/slideshow';
import { useToast } from '@/components/toast';

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" /></div>}>
      <GalleryContent />
    </Suspense>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [pieces, setPieces] = useState<any[]>([]);
  const [tags, setTags] = useState<Array<{ name: string; count: number }>>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState('ALL');
  const [sort, setSort] = useState('custom');
  const [showFavorites, setShowFavorites] = useState(false);
  const [layout, setLayout] = useState<'masonry' | 'grid' | 'list' | 'museum' | 'portfolio'>('masonry');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const dragItemId = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const LIMIT = 10;
  const collectionId = searchParams.get('collectionId');
  const hasMore = pieces.length < total;
  const selectedPiece = selectedIndex !== null ? pieces[selectedIndex] : null;

  const buildParams = useCallback(
    (p: number): Record<string, string> => {
      const params: Record<string, string> = { page: String(p), limit: String(LIMIT) };
      if (activeTags.length) params.tags = activeTags.join(',');
      if (collectionId) params.collectionId = collectionId;
      if (search.trim()) params.search = search.trim();
      if (mediaType && mediaType !== 'ALL') params.mediaType = mediaType;
      if (showFavorites) params.favorite = 'true';
      if (sort) params.sort = sort;
      return params;
    },
    [activeTags, collectionId, search, mediaType, showFavorites, sort],
  );

  const loadPieces = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const res = await api.artPieces.list(buildParams(1));
      setPieces(res.data);
      setTotal(res.total);
    } catch (err: any) {
      toast(err.message || 'Failed to load art pieces', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildParams, toast]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await api.artPieces.list(buildParams(nextPage));
      setPieces((prev) => [...prev, ...res.data]);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err: any) {
      toast(err.message || 'Failed to load more', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [page, buildParams, loadingMore, toast]);

  // Infinite scroll
  const sentinelRef = useInfiniteScroll(loadMore, { enabled: hasMore, loading: loadingMore });

  useEffect(() => {
    loadPieces();
    api.artPieces.tags().then(setTags).catch(() => {});
    api.collections.list().then(setCollections).catch(() => {});
  }, [loadPieces]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBatchDone = () => {
    setSelectedIds([]);
    setSelectMode(false);
    loadPieces();
  };

  useEffect(() => {
    if (collectionId) {
      api.collections.get(collectionId).then((c) => setCollectionName(c.name)).catch(() => {});
    } else {
      setCollectionName(null);
    }
  }, [collectionId]);

  // Persist layout preference
  useEffect(() => {
    const saved = localStorage.getItem('artvault_layout');
    if (saved === 'masonry' || saved === 'grid' || saved === 'list' || saved === 'museum' || saved === 'portfolio') setLayout(saved);
  }, []);

  const handleLayoutChange = (l: 'masonry' | 'grid' | 'list' | 'museum' | 'portfolio') => {
    setLayout(l);
    localStorage.setItem('artvault_layout', l);
  };

  const handleToggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this piece?')) return;
    try {
      await api.artPieces.delete(id);
      toast('Art piece deleted', 'success');
      setPieces((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } catch (err: any) {
      toast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await api.artPieces.toggleFavorite(id);
      setPieces((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to toggle favorite', 'error');
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const updated = await api.artPieces.togglePin(id);
      setPieces((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast(updated.isPinned ? 'Pinned to top' : 'Unpinned', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to pin', 'error');
    }
  };

  const handleSurpriseMe = async () => {
    try {
      const piece = await api.artPieces.random();
      if (piece) {
        const idx = pieces.findIndex((p) => p.id === piece.id);
        if (idx !== -1) {
          setSelectedIndex(idx);
        } else {
          // Piece not in current view — open it directly
          setSelectedIndex(null);
          setPieces((prev) => [piece, ...prev]);
          setTimeout(() => setSelectedIndex(0), 50);
        }
      } else {
        toast('No pieces yet', 'info');
      }
    } catch (err: any) {
      toast(err.message || 'Failed', 'error');
    }
  };

  const handleOpen = (id: string) => {
    const idx = pieces.findIndex((p) => p.id === id);
    if (idx !== -1) setSelectedIndex(idx);
  };

  // Lightbox navigation
  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };
  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < pieces.length - 1) setSelectedIndex(selectedIndex + 1);
  };
  const handleLightboxFavorite = () => {
    if (selectedPiece) handleToggleFavorite(selectedPiece.id);
  };

  // Drag and drop
  const handleDragStart = (_e: React.DragEvent, id: string) => { dragItemId.current = id; };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
  };
  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  };
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    const sourceId = dragItemId.current;
    if (!sourceId || sourceId === targetId) return;
    const newPieces = [...pieces];
    const sourceIdx = newPieces.findIndex((p) => p.id === sourceId);
    const targetIdx = newPieces.findIndex((p) => p.id === targetId);
    const [moved] = newPieces.splice(sourceIdx, 1);
    newPieces.splice(targetIdx, 0, moved);
    setPieces(newPieces);
    try {
      await api.artPieces.reorder(newPieces.map((p) => p.id));
      toast('Order saved', 'success');
    } catch {
      toast('Failed to save order', 'error');
      loadPieces();
    }
  };

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => [
      { key: 'n', handler: () => router.push('/add') },
      { key: '/', handler: () => searchInputRef.current?.focus() },
      { key: 'f', handler: () => setShowFavorites((v) => !v) },
      { key: '1', handler: () => handleLayoutChange('masonry') },
      { key: '2', handler: () => handleLayoutChange('grid') },
      { key: '3', handler: () => handleLayoutChange('list') },
      { key: 's', handler: () => setSelectMode((v) => { if (v) setSelectedIds([]); return !v; }) },
      { key: 'p', handler: () => pieces.length > 0 && setShowSlideshow(true) },
    ],
    [router],
  );
  useKeyboard(shortcuts);

  const layoutContainerClass: Record<string, string> = {
    masonry: 'masonry',
    grid: 'grid-uniform',
    list: 'list-layout',
    museum: 'museum-layout',
    portfolio: 'portfolio-layout',
  };

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-themed sm:text-4xl">
          {collectionName || 'Gallery'}
        </h1>
        <p className="mt-1 text-sm text-themed-secondary sm:mt-2 sm:text-base">
          {collectionName ? 'Viewing collection' : 'Your curated collection of art, videos, and media'}
          {!loading && total > 0 && (
            <span className="ml-2 text-themed-muted">({total} pieces)</span>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {collectionName && (
            <a href="/" className="text-sm accent-text hover:underline">&larr; Back to all</a>
          )}
          <button
            onClick={handleSurpriseMe}
            className="rounded-lg bg-themed-input px-3 py-1.5 text-sm text-themed-secondary hover:text-themed"
          >
            Surprise me
          </button>
          <a href="/discover" className="rounded-lg bg-themed-input px-3 py-1.5 text-sm text-themed-secondary hover:text-themed">
            Discover
          </a>
          <span className="hidden text-xs text-themed-muted sm:inline-flex sm:items-center sm:ml-2">
            <kbd className="rounded border border-themed bg-themed-input px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd>+<kbd className="rounded border border-themed bg-themed-input px-1 py-0.5 font-mono text-[10px]">K</kbd> command palette
          </span>
        </div>
      </div>

      {/* Search bar + reorder toggle */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search... (press / to focus)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-themed bg-themed-input px-4 py-3 pl-10 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedIds([]); setReorderMode(false); }}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              selectMode ? 'accent-bg text-white' : 'bg-themed-input text-themed-secondary hover:text-themed'
            }`}
          >
            {selectMode ? `Cancel (${selectedIds.length})` : 'Select'}
          </button>
          {pieces.length > 0 && (
            <button
              onClick={() => setShowSlideshow(true)}
              className="rounded-lg bg-themed-input px-3 py-2.5 text-sm font-medium text-themed-secondary hover:text-themed"
              title="Slideshow (p)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          )}
          <button
            onClick={() => { setReorderMode(!reorderMode); setSelectMode(false); setSelectedIds([]); }}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              reorderMode ? 'accent-bg text-white' : 'bg-themed-input text-themed-secondary hover:text-themed'
            }`}
          >
            {reorderMode ? 'Done' : 'Reorder'}
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      <FilterBar
        tags={tags}
        activeTags={activeTags}
        onToggleTag={handleToggleTag}
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        sort={sort}
        onSortChange={setSort}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((v) => !v)}
        layout={layout}
        onLayoutChange={handleLayoutChange}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : pieces.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-xl text-themed-muted">
            {search || activeTags.length || (mediaType && mediaType !== 'ALL') || showFavorites ? 'No results found' : 'No art pieces yet'}
          </p>
          {!search && !activeTags.length && (!mediaType || mediaType === 'ALL') && !showFavorites && (
            <a href="/add" className="mt-4 inline-block rounded-lg accent-bg px-6 py-2.5 font-medium text-white accent-bg-hover">
              Add your first piece
            </a>
          )}
        </div>
      ) : (
        <>
          <div className={layoutContainerClass[layout]}>
            {pieces.map((piece, i) => (
              <ArtCard
                key={piece.id}
                piece={piece}
                layout={layout}
                index={i}
                selectMode={selectMode}
                selected={selectedIds.includes(piece.id)}
                onSelect={handleToggleSelect}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                draggable={reorderMode}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              )}
            </div>
          )}
        </>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="mt-12 border-t border-themed pt-4 text-center text-xs text-themed-muted animate-fade-in">
        <span className="hidden sm:inline">
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">n</kbd> new
          &nbsp;&middot;&nbsp;
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">/</kbd> search
          &nbsp;&middot;&nbsp;
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">f</kbd> favorites
          &nbsp;&middot;&nbsp;
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">1</kbd>
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">2</kbd>
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">3</kbd> layout
          &nbsp;&middot;&nbsp;
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">s</kbd> select
          &nbsp;&middot;&nbsp;
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">p</kbd> slideshow
          &nbsp;&middot;&nbsp;
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">&larr;</kbd>
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 font-mono">&rarr;</kbd> navigate
        </span>
      </div>

      <Lightbox
        piece={selectedPiece}
        onClose={() => setSelectedIndex(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleFavorite={handleLightboxFavorite}
        hasPrev={selectedIndex !== null && selectedIndex > 0}
        hasNext={selectedIndex !== null && selectedIndex < pieces.length - 1}
      />

      {selectMode && (
        <BatchBar
          selectedIds={selectedIds}
          collections={collections}
          onDone={handleBatchDone}
          onClear={() => { setSelectedIds([]); setSelectMode(false); }}
        />
      )}

      {showSlideshow && (
        <Slideshow pieces={pieces} onClose={() => setShowSlideshow(false)} />
      )}
    </>
  );
}

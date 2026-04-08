'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { detectMedia } from '@/lib/url-detect';
import { useToast } from '@/components/toast';
import { MediaRenderer } from '@/components/media-renderer';

interface ScrapedMedia {
  type: 'IMAGE' | 'IFRAME';
  url: string;
  thumbnail?: string;
  title?: string;
}

export default function AddPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'IFRAME',
    sourceUrl: '',
    thumbnailUrl: '',
    tags: '',
    collectionId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [duplicate, setDuplicate] = useState<any>(null);

  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedMedia, setScrapedMedia] = useState<ScrapedMedia[]>([]);
  const [scrapedTitle, setScrapedTitle] = useState('');
  const [scrapedDesc, setScrapedDesc] = useState('');
  const [scrapedFavicon, setScrapedFavicon] = useState<string | null>(null);
  const [showScraper, setShowScraper] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'IFRAME'>('ALL');

  // Bulk select state
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(new Set());
  const [bulkTags, setBulkTags] = useState('');
  const [bulkCollectionId, setBulkCollectionId] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);

  useEffect(() => {
    api.collections.list().then(setCollections).catch(() => {});
  }, []);

  const handleUrlChange = (url: string) => {
    const newForm = { ...form, sourceUrl: url };
    const detected = detectMedia(url);
    if (detected) {
      newForm.mediaType = detected.mediaType;
      newForm.sourceUrl = detected.sourceUrl;
      if (detected.title && !form.title) newForm.title = detected.title;
      setAutoDetected(true);
    } else {
      setAutoDetected(false);
    }
    setForm(newForm);

    const urlToCheck = detected?.sourceUrl || url;
    if (urlToCheck) {
      api.artPieces.checkDuplicate(urlToCheck).then((res) => setDuplicate(res.existing)).catch(() => {});
    } else {
      setDuplicate(null);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setScraping(true);
    setScrapedMedia([]);
    setSelectedMedia(new Set());
    try {
      const result = await api.scrape(scrapeUrl);
      setScrapedMedia(result.media);
      setScrapedTitle(result.pageTitle);
      setScrapedDesc(result.pageDescription);
      setScrapedFavicon(result.favicon);
      if (result.media.length === 0) {
        toast('No media found on this page', 'info');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to scrape page', 'error');
    } finally {
      setScraping(false);
    }
  };

  const handleSelectMedia = (media: ScrapedMedia) => {
    setForm({
      ...form,
      sourceUrl: media.url,
      mediaType: media.type,
      title: media.title || form.title || scrapedTitle,
      thumbnailUrl: media.thumbnail || '',
    });
    setAutoDetected(true);
    setShowScraper(false);
    toast('Media selected — fill in details and save', 'success');
  };

  const toggleMediaSelect = (index: number) => {
    setSelectedMedia((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const indices = filteredMedia.map((_, i) => {
      const actualIndex = scrapedMedia.indexOf(filteredMedia[i]);
      return actualIndex;
    });
    setSelectedMedia((prev) => {
      const allSelected = indices.every((i) => prev.has(i));
      const next = new Set(prev);
      if (allSelected) {
        indices.forEach((i) => next.delete(i));
      } else {
        indices.forEach((i) => next.add(i));
      }
      return next;
    });
  };

  const handleBulkAdd = async () => {
    if (selectedMedia.size === 0) return;
    setBulkAdding(true);
    const tags = bulkTags.split(',').map((t) => t.trim()).filter(Boolean);
    let added = 0;
    let failed = 0;

    for (const index of selectedMedia) {
      const media = scrapedMedia[index];
      if (!media) continue;
      try {
        await api.artPieces.create({
          title: media.title || scrapedTitle || 'Untitled',
          mediaType: media.type,
          sourceUrl: media.url,
          thumbnailUrl: media.thumbnail || undefined,
          tags,
          collectionId: bulkCollectionId || undefined,
        });
        added++;
      } catch {
        failed++;
      }
    }

    setBulkAdding(false);
    if (added > 0) {
      toast(`Added ${added} item${added > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`, 'success');
      setSelectedMedia(new Set());
      router.push('/');
    } else {
      toast('Failed to add items', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.artPieces.create({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        collectionId: form.collectionId || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
      });
      toast('Art piece added', 'success');
      router.push('/');
    } catch (err: any) {
      toast(err.message || 'Failed to add art piece', 'error');
      setSubmitting(false);
    }
  };

  const filteredMedia = filterType === 'ALL'
    ? scrapedMedia
    : scrapedMedia.filter((m) => m.type === filterType);

  const videoCount = scrapedMedia.filter((m) => m.type === 'IFRAME').length;
  const imageCount = scrapedMedia.filter((m) => m.type === 'IMAGE').length;

  const inputClass =
    'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-themed-secondary hover:text-themed">&larr;</Link>
        <h1 className="text-3xl font-bold text-themed">Add Art Piece</h1>
      </div>

      {/* Scrape toggle */}
      <div className="mx-auto mb-6 max-w-4xl">
        <button
          type="button"
          onClick={() => setShowScraper(!showScraper)}
          className="flex items-center gap-2 rounded-lg border border-themed bg-themed-card px-4 py-2.5 text-sm font-medium text-themed-secondary transition-colors hover:text-themed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {showScraper ? 'Hide Page Scraper' : 'Scrape Media from Page'}
        </button>
      </div>

      {/* Scraper panel */}
      {showScraper && (
        <div className="mx-auto mb-8 max-w-4xl rounded-xl border border-themed bg-themed-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-themed">Page Scraper</h2>
          <p className="mb-4 text-sm text-themed-secondary">
            Paste a webpage URL to extract all videos and images. Select multiple to bulk-add.
          </p>

          <div className="flex gap-3">
            <input
              type="url"
              placeholder="https://example.com/gallery"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleScrape}
              disabled={scraping || !scrapeUrl}
              className="whitespace-nowrap rounded-lg accent-bg px-6 py-3 font-semibold text-white accent-bg-hover disabled:opacity-50"
            >
              {scraping ? 'Scraping...' : 'Scrape'}
            </button>
          </div>

          {scrapedMedia.length > 0 && (
            <div className="mt-6">
              {/* Page info */}
              {(scrapedTitle || scrapedDesc) && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-themed bg-themed-input p-3">
                  {scrapedFavicon && (
                    <img src={scrapedFavicon} alt="" className="mt-0.5 h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div className="min-w-0">
                    {scrapedTitle && <p className="truncate text-sm font-medium text-themed">{scrapedTitle}</p>}
                    {scrapedDesc && <p className="mt-0.5 line-clamp-2 text-xs text-themed-muted">{scrapedDesc}</p>}
                  </div>
                </div>
              )}

              {/* Header with counts and filters */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-themed-secondary">
                  Found {scrapedMedia.length} media ({videoCount} videos, {imageCount} images)
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-xs font-medium accent-text hover:underline"
                  >
                    {filteredMedia.every((_, i) => selectedMedia.has(scrapedMedia.indexOf(filteredMedia[i])))
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <div className="flex gap-1 rounded-lg border border-themed bg-themed-input p-0.5">
                    {(['ALL', 'IFRAME', 'IMAGE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFilterType(t)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          filterType === t ? 'bg-themed-card text-themed shadow-sm' : 'text-themed-muted hover:text-themed'
                        }`}
                      >
                        {t === 'ALL' ? 'All' : t === 'IFRAME' ? 'Videos' : 'Images'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredMedia.map((media) => {
                  const actualIndex = scrapedMedia.indexOf(media);
                  const isSelected = selectedMedia.has(actualIndex);
                  return (
                    <button
                      key={`${media.url}-${actualIndex}`}
                      type="button"
                      onClick={() => toggleMediaSelect(actualIndex)}
                      className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] shadow-lg ring-2 ring-[var(--accent)]/30'
                          : 'border-themed hover:border-[var(--accent)]/50'
                      }`}
                    >
                      {media.thumbnail ? (
                        <img
                          src={media.thumbnail}
                          alt={media.title || ''}
                          className="aspect-video w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-themed-input">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-themed-muted">
                            {media.type === 'IFRAME' ? (
                              <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></>
                            ) : (
                              <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>
                            )}
                          </svg>
                        </div>
                      )}

                      {/* Type badge */}
                      <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${
                        media.type === 'IFRAME' ? 'bg-red-500/80' : 'bg-blue-500/80'
                      }`}>
                        {media.type === 'IFRAME' ? 'Video' : 'Image'}
                      </span>

                      {/* Selection checkbox */}
                      <div className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-white/70 bg-black/30 group-hover:border-white'
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>

                      {/* Title */}
                      {media.title && (
                        <p className="truncate px-2 py-1.5 text-left text-[11px] text-themed-secondary">
                          {media.title}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bulk add bar */}
              {selectedMedia.size > 0 && (
                <div className="mt-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                      {selectedMedia.size}
                    </span>
                    <span className="text-sm font-medium text-themed">
                      item{selectedMedia.size > 1 ? 's' : ''} selected
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-themed-secondary">Collection</label>
                      <select
                        className="w-full rounded-lg border border-themed bg-themed-input px-3 py-2 text-sm text-themed focus:border-[var(--accent)] focus:outline-none"
                        value={bulkCollectionId}
                        onChange={(e) => setBulkCollectionId(e.target.value)}
                      >
                        <option value="">No collection</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-themed-secondary">Tags (comma-separated)</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-themed bg-themed-input px-3 py-2 text-sm text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none"
                        value={bulkTags}
                        onChange={(e) => setBulkTags(e.target.value)}
                        placeholder="art, scraped"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={handleBulkAdd}
                        disabled={bulkAdding}
                        className="flex-1 rounded-lg accent-bg px-4 py-2 text-sm font-semibold text-white accent-bg-hover disabled:opacity-50"
                      >
                        {bulkAdding ? 'Adding...' : `Add ${selectedMedia.size} Item${selectedMedia.size > 1 ? 's' : ''}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMedia(new Set())}
                        className="rounded-lg border border-themed px-3 py-2 text-sm text-themed-secondary hover:text-themed"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr,320px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Title</label>
            <input
              type="text"
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="The Starry Night"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Description</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Media Type</label>
            <div className="flex gap-3">
              {(['IMAGE', 'VIDEO', 'IFRAME'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, mediaType: type })}
                  className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
                    form.mediaType === type
                      ? 'accent-bg text-white'
                      : 'bg-themed-input text-themed-secondary hover:text-themed'
                  }`}
                >
                  {type === 'IFRAME' ? 'Embed' : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Source URL</label>
            <input
              type="url"
              required
              className={inputClass}
              value={form.sourceUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste URL or <iframe> embed code..."
            />
            {autoDetected && (
              <p className="mt-1.5 text-xs accent-text">
                Auto-detected as {form.mediaType === 'IFRAME' ? 'Embed' : form.mediaType.charAt(0) + form.mediaType.slice(1).toLowerCase()}
              </p>
            )}
            {duplicate && (
              <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                Duplicate: &ldquo;{duplicate.title}&rdquo; already uses this URL.{' '}
                <Link href={`/edit/${duplicate.id}`} className="underline">View it</Link>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">
              Thumbnail URL <span className="text-themed-muted">(optional)</span>
            </label>
            <input
              type="url"
              className={inputClass}
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">
              Tags <span className="text-themed-muted">(comma-separated)</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="painting, abstract, modern"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Collection</label>
            <select
              className={inputClass}
              value={form.collectionId}
              onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile preview */}
          {form.sourceUrl && (
            <div className="overflow-hidden rounded-xl border border-themed bg-themed-card lg:hidden">
              <p className="px-4 pt-3 text-xs font-medium text-themed-secondary">Preview</p>
              <div className="p-3">
                <MediaRenderer
                  mediaType={form.mediaType}
                  sourceUrl={form.sourceUrl}
                  title={form.title || 'Preview'}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg accent-bg py-3.5 font-semibold text-white accent-bg-hover disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add to Vault'}
          </button>
        </form>

        {/* Live preview — mobile: above form; desktop: sidebar */}
        <div className="hidden lg:block">
          <p className="mb-3 text-sm font-medium text-themed-secondary">Preview</p>
          <div className="overflow-hidden rounded-xl border border-themed bg-themed-card">
            {form.sourceUrl ? (
              <MediaRenderer
                mediaType={form.mediaType}
                sourceUrl={form.sourceUrl}
                title={form.title || 'Preview'}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-themed-input">
                <p className="text-sm text-themed-muted">Enter a URL to preview</p>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-themed">{form.title || 'Untitled'}</h3>
              {form.description && (
                <p className="mt-1 text-sm text-themed-secondary line-clamp-3">{form.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

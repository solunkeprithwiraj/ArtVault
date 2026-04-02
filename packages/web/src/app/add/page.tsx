'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [showScraper, setShowScraper] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'IFRAME'>('ALL');

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
    try {
      const result = await api.scrape(scrapeUrl);
      setScrapedMedia(result.media);
      setScrapedTitle(result.pageTitle);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.artPieces.create({
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
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
        <a href="/" className="text-themed-secondary hover:text-themed">&larr;</a>
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
            Paste a webpage URL to extract all videos and images from it.
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
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-themed-secondary">
                  Found {scrapedMedia.length} media ({videoCount} videos, {imageCount} images)
                  {scrapedTitle && <span className="text-themed-muted"> from &ldquo;{scrapedTitle}&rdquo;</span>}
                </p>
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredMedia.map((media, i) => (
                  <button
                    key={`${media.url}-${i}`}
                    type="button"
                    onClick={() => handleSelectMedia(media)}
                    className="group relative overflow-hidden rounded-lg border border-themed bg-themed-input transition-all hover:border-[var(--accent)] hover:shadow-lg"
                  >
                    {media.thumbnail ? (
                      <img
                        src={media.thumbnail}
                        alt={media.title || ''}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
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

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                      <span className="scale-0 rounded-full bg-white/90 p-2 transition-transform group-hover:scale-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </div>

                    {/* Title */}
                    {media.title && (
                      <p className="truncate px-2 py-1.5 text-left text-[11px] text-themed-secondary">
                        {media.title}
                      </p>
                    )}
                  </button>
                ))}
              </div>
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
              placeholder="Paste any URL — YouTube, Vimeo, image, video..."
            />
            {autoDetected && (
              <p className="mt-1.5 text-xs accent-text">
                Auto-detected as {form.mediaType === 'IFRAME' ? 'Embed' : form.mediaType.charAt(0) + form.mediaType.slice(1).toLowerCase()}
              </p>
            )}
            {duplicate && (
              <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                Duplicate: &ldquo;{duplicate.title}&rdquo; already uses this URL.{' '}
                <a href={`/edit/${duplicate.id}`} className="underline">View it</a>
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg accent-bg py-3 font-semibold text-white accent-bg-hover disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add to Vault'}
          </button>
        </form>

        {/* Live preview */}
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

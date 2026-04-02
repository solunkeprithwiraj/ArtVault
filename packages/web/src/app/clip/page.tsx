'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { detectMedia } from '@/lib/url-detect';
import { useToast } from '@/components/toast';
import { MediaRenderer } from '@/components/media-renderer';

export default function ClipPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" /></div>}>
      <ClipContent />
    </Suspense>
  );
}

function ClipContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const urlParam = searchParams.get('url') || '';
  const titleParam = searchParams.get('title') || '';
  const pageUrl = searchParams.get('pageUrl') || '';
  const typeParam = searchParams.get('type') as 'IMAGE' | 'VIDEO' | 'IFRAME' | null;

  const [collections, setCollections] = useState<any[]>([]);
  const [duplicate, setDuplicate] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect media type — prefer explicit type param from bookmarklet
  const detected = detectMedia(urlParam);
  const mediaType = typeParam || detected?.mediaType || 'IMAGE';
  const sourceUrl = detected?.sourceUrl || urlParam;

  const [form, setForm] = useState({
    title: decodeURIComponent(titleParam) || detected?.title || '',
    description: pageUrl ? `Clipped from ${decodeURIComponent(pageUrl)}` : '',
    mediaType: mediaType as 'IMAGE' | 'VIDEO' | 'IFRAME',
    sourceUrl,
    thumbnailUrl: '',
    tags: '',
    collectionId: '',
  });

  useEffect(() => {
    api.collections.list().then(setCollections).catch(() => {});
    if (form.sourceUrl) {
      api.artPieces.checkDuplicate(form.sourceUrl).then((res) => setDuplicate(res.existing)).catch(() => {});
    }
  }, [form.sourceUrl]);

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
      toast('Clipped to vault!', 'success');
      // Close the window if opened as popup, otherwise go to gallery
      if (window.opener) {
        window.close();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to clip', 'error');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg accent-soft-bg p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="accent-text" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.6 2.7a10 10 0 1 0 5.7 5.7" /><circle cx="12" cy="12" r="2" /><path d="M13.4 2.1a10 10 0 0 1 8.5 8.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-themed">Clip to ArtVault</h1>
          {pageUrl && <p className="text-xs text-themed-muted truncate max-w-md">{pageUrl}</p>}
        </div>
      </div>

      {duplicate && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          This URL is already in your vault: &ldquo;{duplicate.title}&rdquo;.{' '}
          <a href={`/edit/${duplicate.id}`} className="underline">View it</a>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr,300px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Title</label>
            <input
              type="text"
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Source URL</label>
            <input
              type="url"
              required
              className={inputClass}
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Media Type</label>
            <div className="flex gap-2">
              {(['IMAGE', 'VIDEO', 'IFRAME'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, mediaType: type })}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    form.mediaType === type ? 'accent-bg text-white' : 'bg-themed-input text-themed-secondary'
                  }`}
                >
                  {type === 'IFRAME' ? 'Embed' : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
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
              placeholder="art, inspiration"
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
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg accent-bg py-3 font-semibold text-white accent-bg-hover disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Clip to Vault'}
          </button>
        </form>

        {/* Preview */}
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
                <p className="text-sm text-themed-muted">No URL</p>
              </div>
            )}
            <div className="p-3">
              <h3 className="truncate text-sm font-semibold text-themed">{form.title || 'Untitled'}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

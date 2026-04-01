'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { detectMedia } from '@/lib/url-detect';
import { useToast } from '@/components/toast';
import { MediaRenderer } from '@/components/media-renderer';

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

    // Check for duplicates
    const urlToCheck = detected?.sourceUrl || url;
    if (urlToCheck) {
      api.artPieces.checkDuplicate(urlToCheck).then((res) => setDuplicate(res.existing)).catch(() => {});
    } else {
      setDuplicate(null);
    }
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

  const inputClass =
    'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <a href="/" className="text-themed-secondary hover:text-themed">&larr;</a>
        <h1 className="text-3xl font-bold text-themed">Add Art Piece</h1>
      </div>

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

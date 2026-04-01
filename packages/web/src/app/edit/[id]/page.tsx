'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import { MediaRenderer } from '@/components/media-renderer';

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'IFRAME',
    sourceUrl: '',
    thumbnailUrl: '',
    tags: '',
    collectionId: '',
  });

  useEffect(() => {
    Promise.all([api.artPieces.get(id), api.collections.list()])
      .then(([piece, cols]) => {
        setForm({
          title: piece.title,
          description: piece.description || '',
          mediaType: piece.mediaType,
          sourceUrl: piece.sourceUrl,
          thumbnailUrl: piece.thumbnailUrl || '',
          tags: piece.tags.join(', '),
          collectionId: piece.collectionId || '',
        });
        setCollections(cols);
        setLoading(false);
      })
      .catch((err) => {
        toast(err.message || 'Failed to load art piece', 'error');
        router.push('/');
      });
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.artPieces.update(id, {
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        collectionId: form.collectionId || null,
        thumbnailUrl: form.thumbnailUrl || null,
        description: form.description || null,
      });
      toast('Art piece updated', 'success');
      router.push('/');
    } catch (err: any) {
      toast(err.message || 'Failed to update', 'error');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <a href="/" className="text-themed-secondary hover:text-themed">&larr;</a>
        <h1 className="text-3xl font-bold text-themed">Edit Art Piece</h1>
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
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-themed-secondary">Description</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            />
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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg accent-bg py-3 font-semibold text-white accent-bg-hover disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <a
              href="/"
              className="rounded-lg border border-themed bg-themed-input px-6 py-3 font-medium text-themed-secondary hover:text-themed"
            >
              Cancel
            </a>
          </div>
        </form>

        {/* Live preview */}
        <div className="hidden lg:block">
          <p className="mb-3 text-sm font-medium text-themed-secondary">Preview</p>
          <div className="overflow-hidden rounded-xl border border-themed bg-themed-card">
            {form.sourceUrl && (
              <MediaRenderer
                mediaType={form.mediaType}
                sourceUrl={form.sourceUrl}
                title={form.title || 'Preview'}
              />
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

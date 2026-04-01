'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AddPage() {
  const router = useRouter();
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

  useEffect(() => {
    api.collections.list().then(setCollections);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await api.artPieces.create({
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      collectionId: form.collectionId || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
    });
    router.push('/');
  };

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500';

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold">Add Art Piece</h1>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Title</label>
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
          <label className="mb-2 block text-sm font-medium text-neutral-300">Description</label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Media Type</label>
          <div className="flex gap-3">
            {(['IMAGE', 'VIDEO', 'IFRAME'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, mediaType: type })}
                className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
                  form.mediaType === type
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {type === 'IFRAME' ? 'Embed' : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Source URL</label>
          <input
            type="url"
            required
            className={inputClass}
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">
            Thumbnail URL <span className="text-neutral-500">(optional)</span>
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
          <label className="mb-2 block text-sm font-medium text-neutral-300">
            Tags <span className="text-neutral-500">(comma-separated)</span>
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
          <label className="mb-2 block text-sm font-medium text-neutral-300">Collection</label>
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
          className="w-full rounded-lg bg-pink-500 py-3 font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add to Vault'}
        </button>
      </form>
    </>
  );
}

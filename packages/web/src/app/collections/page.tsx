'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = () => api.collections.list().then(setCollections);

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.collections.create({ name, description: description || undefined });
    setName('');
    setDescription('');
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    await api.collections.delete(id);
    load();
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-pink-500 px-5 py-2 text-sm font-medium text-white hover:bg-pink-600"
        >
          {showForm ? 'Cancel' : '+ New Collection'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-white/10 bg-neutral-900 p-6">
          <input
            type="text"
            required
            placeholder="Collection name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-neutral-500 focus:border-pink-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-neutral-500 focus:border-pink-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-pink-500 px-6 py-2 text-sm font-medium text-white hover:bg-pink-600"
          >
            Create
          </button>
        </form>
      )}

      {collections.length === 0 ? (
        <p className="py-20 text-center text-xl text-neutral-500">No collections yet</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <div
              key={c.id}
              className="group relative rounded-xl border border-white/5 bg-neutral-900 p-6 transition-all hover:border-pink-500/30"
            >
              <a href={`/?collectionId=${c.id}`}>
                <h3 className="text-lg font-semibold">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 text-sm text-neutral-400">{c.description}</p>
                )}
                <p className="mt-3 text-sm text-pink-400">
                  {c._count?.artPieces || 0} pieces
                </p>
              </a>
              <button
                onClick={() => handleDelete(c.id)}
                className="absolute right-3 top-3 text-neutral-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

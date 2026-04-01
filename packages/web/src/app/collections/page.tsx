'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';

export default function CollectionsPage() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const load = () =>
    api.collections
      .list()
      .then(setCollections)
      .catch((err) => toast(err.message || 'Failed to load collections', 'error'));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.collections.create({ name, description: description || undefined });
      toast('Collection created', 'success');
      setName('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast(err.message || 'Failed to create collection', 'error');
    }
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.collections.update(editingId, {
        name: editName,
        description: editDescription || null,
      });
      toast('Collection updated', 'success');
      setEditingId(null);
      load();
    } catch (err: any) {
      toast(err.message || 'Failed to update collection', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection? Art pieces in it will not be deleted.')) return;
    try {
      await api.collections.delete(id);
      toast('Collection deleted', 'success');
      load();
    } catch (err: any) {
      toast(err.message || 'Failed to delete collection', 'error');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none';

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-themed">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg accent-bg px-5 py-2 text-sm font-medium text-white accent-bg-hover"
        >
          {showForm ? 'Cancel' : '+ New Collection'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-themed bg-themed-card p-6">
          <input
            type="text"
            required
            placeholder="Collection name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mb-3`}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mb-4`}
          />
          <button
            type="submit"
            className="rounded-lg accent-bg px-6 py-2 text-sm font-medium text-white accent-bg-hover"
          >
            Create
          </button>
        </form>
      )}

      {collections.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-xl text-themed-muted">No collections yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg accent-bg px-6 py-2.5 font-medium text-white accent-bg-hover"
          >
            Create your first collection
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) =>
            editingId === c.id ? (
              /* Inline edit form */
              <form
                key={c.id}
                onSubmit={handleUpdate}
                className="rounded-xl border-2 border-[var(--accent)] bg-themed-card p-6"
              >
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`${inputClass} mb-3 text-lg font-semibold`}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={`${inputClass} mb-4 text-sm`}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg accent-bg px-4 py-1.5 text-sm font-medium text-white accent-bg-hover"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-themed-input px-4 py-1.5 text-sm font-medium text-themed-secondary hover:text-themed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Collection card */
              <div
                key={c.id}
                className="group relative rounded-xl border border-themed bg-themed-card p-6 transition-all hover:border-[var(--border-hover)]"
              >
                <a href={`/?collectionId=${c.id}`}>
                  <h3 className="text-lg font-semibold text-themed">{c.name}</h3>
                  {c.description && (
                    <p className="mt-1 text-sm text-themed-secondary">{c.description}</p>
                  )}
                  <p className="mt-3 text-sm accent-text">
                    {c._count?.artPieces || 0} pieces
                  </p>
                </a>

                {/* Action buttons */}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(c)}
                    className="rounded-full p-1.5 text-themed-muted hover:text-themed"
                    title="Edit collection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-full p-1.5 text-themed-muted hover:text-red-400"
                    title="Delete collection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}

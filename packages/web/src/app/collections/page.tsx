'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';

function CoverGrid({ images }: { images: Array<{ sourceUrl: string; title: string }> }) {
  if (images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-themed-input">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-themed-muted" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  if (images.length === 1) {
    return <img src={images[0].sourceUrl} alt={images[0].title} className="h-full w-full object-cover" />;
  }

  if (images.length <= 3) {
    return (
      <div className="grid h-full grid-cols-2 gap-0.5">
        <img src={images[0].sourceUrl} alt="" className="h-full w-full object-cover" />
        <div className="flex flex-col gap-0.5">
          {images.slice(1).map((img, i) => (
            <img key={i} src={img.sourceUrl} alt="" className="flex-1 w-full object-cover" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
      {images.map((img, i) => (
        <img key={i} src={img.sourceUrl} alt="" className="h-full w-full object-cover" />
      ))}
    </div>
  );
}

function MediaTypeIcons({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-themed-muted" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-sm font-medium text-themed">{count}</span>
      <span className="text-xs text-themed-muted">pieces</span>
    </div>
  );
}

export default function CollectionsPage() {
  const { toast } = useToast();
  const [tree, setTree] = useState<any[]>([]);
  const [allCollections, setAllCollections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const load = () => {
    api.collections.tree().then(setTree).catch((err) => toast(err.message || 'Failed to load', 'error'));
    api.collections.list().then(setAllCollections).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.collections.create({ name, description: description || undefined, parentId: parentId || undefined });
      toast('Collection created', 'success');
      setName(''); setDescription(''); setParentId(''); setShowForm(false);
      load();
    } catch (err: any) { toast(err.message || 'Failed to create', 'error'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.collections.update(editingId, { name: editName, description: editDescription || null });
      toast('Collection updated', 'success');
      setEditingId(null);
      load();
    } catch (err: any) { toast(err.message || 'Failed to update', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection and all sub-collections?')) return;
    try {
      await api.collections.delete(id);
      toast('Collection deleted', 'success');
      load();
    } catch (err: any) { toast(err.message || 'Failed to delete', 'error'); }
  };

  const inputClass = 'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none';

  // Find hero collection (most pieces)
  const allFlat = allCollections.sort((a, b) => (b._count?.artPieces || 0) - (a._count?.artPieces || 0));
  const hero = allFlat[0];

  const totalPieces = allCollections.reduce((sum, c) => sum + (c._count?.artPieces || 0), 0);

  const renderCollection = (c: any, depth = 0) => {
    const previews = c.artPieces || [];
    const pieceCount = c._count?.artPieces || 0;
    const childCount = c.children?.length || 0;

    if (editingId === c.id) {
      return (
        <form key={c.id} onSubmit={handleUpdate}
          className="rounded-2xl border-2 border-[var(--accent)] bg-themed-card p-6"
          style={{ marginLeft: depth * 32 }}>
          <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
            className={`${inputClass} mb-3 text-lg font-semibold`} autoFocus />
          <input type="text" placeholder="Description (optional)" value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)} className={`${inputClass} mb-4 text-sm`} />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg accent-bg px-4 py-1.5 text-sm font-medium text-white accent-bg-hover">Save</button>
            <button type="button" onClick={() => setEditingId(null)}
              className="rounded-lg bg-themed-input px-4 py-1.5 text-sm font-medium text-themed-secondary hover:text-themed">Cancel</button>
          </div>
        </form>
      );
    }

    return (
      <div key={c.id} className="animate-card-enter" style={{ animationDelay: `${depth * 50}ms` }}>
        <div
          className="group relative overflow-hidden rounded-2xl border border-themed bg-themed-card transition-all hover:border-[var(--border-hover)] hover:shadow-xl"
          style={{ marginLeft: depth * 32 }}
        >
          <a href={`/?collectionId=${c.id}`} className="flex flex-col sm:flex-row">
            {/* Cover image grid */}
            <div className="h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
              <CoverGrid images={previews} />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="flex items-center gap-2">
                  {depth > 0 && (
                    <span className="rounded-full accent-soft-bg px-2 py-0.5 text-[10px] font-medium accent-text">
                      Sub
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-themed">{c.name}</h3>
                </div>
                {c.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-themed-secondary">{c.description}</p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <MediaTypeIcons count={pieceCount} />
                {childCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-themed-muted" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-xs text-themed-muted">{childCount} sub</span>
                  </div>
                )}
              </div>
            </div>
          </a>

          {/* Action buttons */}
          <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => { setShowForm(true); setParentId(c.id); }}
              className="rounded-full bg-black/50 p-1.5 text-white/70 backdrop-blur-sm hover:text-white" title="Add sub-collection">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
              </svg>
            </button>
            <button onClick={() => { setEditingId(c.id); setEditName(c.name); setEditDescription(c.description || ''); }}
              className="rounded-full bg-black/50 p-1.5 text-white/70 backdrop-blur-sm hover:text-white" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button onClick={() => handleDelete(c.id)}
              className="rounded-full bg-black/50 p-1.5 text-white/70 backdrop-blur-sm hover:text-red-400" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Children with connector line */}
        {c.children?.length > 0 && (
          <div className="relative mt-3 space-y-3" style={{ marginLeft: depth * 32 }}>
            <div className="absolute left-4 top-0 bottom-4 w-px bg-themed-input" style={{ marginLeft: 0 }} />
            {c.children.map((child: any) => renderCollection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-themed">Collections</h1>
          {allCollections.length > 0 && (
            <p className="mt-1 text-sm text-themed-secondary">
              {allCollections.length} collections &middot; {totalPieces} total pieces
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) setParentId(''); }}
          className="rounded-lg accent-bg px-5 py-2.5 text-sm font-medium text-white accent-bg-hover"
        >
          {showForm ? 'Cancel' : '+ New Collection'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-themed bg-themed-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-themed">
            {parentId ? `New sub-collection` : 'New collection'}
          </h3>
          <input type="text" required placeholder="Collection name" value={name}
            onChange={(e) => setName(e.target.value)} className={`${inputClass} mb-3`} autoFocus />
          <input type="text" placeholder="Description (optional)" value={description}
            onChange={(e) => setDescription(e.target.value)} className={`${inputClass} mb-3`} />
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={`${inputClass} mb-4`}>
            <option value="">Top-level collection</option>
            {allCollections.map((c) => (
              <option key={c.id} value={c.id}>{c.parent ? `${c.parent.name} / ${c.name}` : c.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg accent-bg px-6 py-2.5 text-sm font-medium text-white accent-bg-hover">
            Create
          </button>
        </form>
      )}

      {tree.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 rounded-full accent-soft-bg p-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="accent-text" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-themed">No collections yet</h2>
          <p className="mb-6 max-w-sm text-center text-sm text-themed-secondary">
            Collections help you organize your art pieces into groups. Create your first collection to get started.
          </p>
          <button onClick={() => setShowForm(true)}
            className="rounded-lg accent-bg px-6 py-2.5 font-medium text-white accent-bg-hover">
            Create your first collection
          </button>
        </div>
      ) : (
        <>
          {/* Hero collection */}
          {hero && hero._count?.artPieces > 0 && (
            <a href={`/?collectionId=${hero.id}`}
              className="group mb-8 block overflow-hidden rounded-2xl border border-themed bg-themed-card transition-all hover:border-[var(--border-hover)] hover:shadow-2xl">
              <div className="relative h-56 overflow-hidden sm:h-72">
                <CoverGrid images={hero.artPieces || []} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="mb-2 inline-block rounded-full accent-bg px-3 py-1 text-xs font-semibold text-white">
                    Featured Collection
                  </span>
                  <h2 className="text-2xl font-bold text-white">{hero.name}</h2>
                  {hero.description && (
                    <p className="mt-1 text-sm text-white/70">{hero.description}</p>
                  )}
                  <p className="mt-2 text-sm text-white/50">{hero._count?.artPieces || 0} pieces</p>
                </div>
              </div>
            </a>
          )}

          {/* Collection tree */}
          <div className="space-y-3">
            {tree.map((c) => renderCollection(c))}
          </div>
        </>
      )}
    </div>
  );
}

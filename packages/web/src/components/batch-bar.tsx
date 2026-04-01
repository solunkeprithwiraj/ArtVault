'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from './toast';

interface BatchBarProps {
  selectedIds: string[];
  collections: Array<{ id: string; name: string }>;
  onDone: () => void;
  onClear: () => void;
}

export function BatchBar({ selectedIds, collections, onDone, onClear }: BatchBarProps) {
  const { toast } = useToast();
  const [showMove, setShowMove] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const count = selectedIds.length;

  const handleDelete = async () => {
    if (!confirm(`Delete ${count} selected pieces?`)) return;
    try {
      await api.artPieces.batchDelete(selectedIds);
      toast(`${count} pieces deleted`, 'success');
      onDone();
    } catch (err: any) {
      toast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleMove = async (collectionId: string | null) => {
    try {
      await api.artPieces.batchMove(selectedIds, collectionId);
      toast(`${count} pieces moved`, 'success');
      setShowMove(false);
      onDone();
    } catch (err: any) {
      toast(err.message || 'Failed to move', 'error');
    }
  };

  const handleTag = async () => {
    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (!tags.length) return;
    try {
      await api.artPieces.batchTag(selectedIds, tags, 'add');
      toast(`Tags added to ${count} pieces`, 'success');
      setTagInput('');
      setShowTag(false);
      onDone();
    } catch (err: any) {
      toast(err.message || 'Failed to tag', 'error');
    }
  };

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-xl border border-themed bg-themed-card px-6 py-3 shadow-2xl sm:bottom-8">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-themed">{count} selected</span>

        <div className="h-5 w-px bg-themed-input" />

        {/* Move */}
        <div className="relative">
          <button
            onClick={() => { setShowMove(!showMove); setShowTag(false); }}
            className="rounded-lg bg-themed-input px-3 py-1.5 text-sm text-themed-secondary hover:text-themed"
          >
            Move
          </button>
          {showMove && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-themed bg-themed-card py-1 shadow-xl">
              <button
                onClick={() => handleMove(null)}
                className="w-full px-3 py-2 text-left text-sm text-themed-secondary hover:bg-themed-input"
              >
                Remove from collection
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleMove(c.id)}
                  className="w-full px-3 py-2 text-left text-sm text-themed-secondary hover:bg-themed-input"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tag */}
        <div className="relative">
          <button
            onClick={() => { setShowTag(!showTag); setShowMove(false); }}
            className="rounded-lg bg-themed-input px-3 py-1.5 text-sm text-themed-secondary hover:text-themed"
          >
            Tag
          </button>
          {showTag && (
            <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-themed bg-themed-card p-3 shadow-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="tag1, tag2..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTag()}
                  className="flex-1 rounded border border-themed bg-themed-input px-2 py-1.5 text-sm text-themed"
                  autoFocus
                />
                <button onClick={handleTag} className="rounded accent-bg px-3 py-1.5 text-sm text-white">Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20"
        >
          Delete
        </button>

        <div className="h-5 w-px bg-themed-input" />

        {/* Clear selection */}
        <button onClick={onClear} className="text-sm text-themed-muted hover:text-themed">
          Cancel
        </button>
      </div>
    </div>
  );
}

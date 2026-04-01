'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from './toast';

interface NotesProps {
  artPieceId: string;
}

export function Notes({ artPieceId }: NotesProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.notes
      .list(artPieceId)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [artPieceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await api.notes.create(artPieceId, newNote.trim());
      setNewNote('');
      toast('Note added', 'success');
      load();
    } catch (err: any) {
      toast(err.message || 'Failed to add note', 'error');
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      await api.notes.update(artPieceId, noteId, editContent.trim());
      setEditingId(null);
      toast('Note updated', 'success');
      load();
    } catch (err: any) {
      toast(err.message || 'Failed to update note', 'error');
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await api.notes.delete(artPieceId, noteId);
      toast('Note deleted', 'success');
      load();
    } catch (err: any) {
      toast(err.message || 'Failed to delete note', 'error');
    }
  };

  return (
    <div className="mt-4 border-t border-themed pt-4">
      <h4 className="mb-3 text-sm font-semibold text-themed-secondary">Notes</h4>

      {/* Add note */}
      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          type="text"
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="flex-1 rounded-lg border border-themed bg-themed-input px-3 py-2 text-sm text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="rounded-lg accent-bg px-3 py-2 text-sm font-medium text-white accent-bg-hover disabled:opacity-30"
        >
          Add
        </button>
      </form>

      {/* Notes list */}
      {loading ? (
        <p className="text-xs text-themed-muted">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-themed-muted">No notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="group flex items-start gap-2 rounded-lg bg-themed-input p-3">
              {editingId === note.id ? (
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 rounded border border-themed bg-themed px-2 py-1 text-sm text-themed focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(note.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button onClick={() => handleUpdate(note.id)} className="text-xs accent-text">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-themed-muted">Cancel</button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-sm text-themed">{note.content}</p>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                      className="p-1 text-themed-muted hover:text-themed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 text-themed-muted hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <span className="shrink-0 text-[10px] text-themed-muted">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

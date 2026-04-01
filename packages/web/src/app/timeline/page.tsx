'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MediaRenderer } from '@/components/media-renderer';
import { useToast } from '@/components/toast';

interface TimelineGroup {
  date: string;
  items: any[];
}

export default function TimelinePage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.artPieces
      .timeline()
      .then(setGroups)
      .catch((err) => toast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="mb-8 text-3xl font-bold text-themed">Timeline</h1>

      {groups.length === 0 ? (
        <p className="py-20 text-center text-xl text-themed-muted">No pieces yet</p>
      ) : (
        <div className="relative ml-4 border-l-2 border-themed pl-8">
          {groups.map((group) => (
            <div key={group.date} className="mb-10">
              {/* Date marker */}
              <div className="absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-[var(--accent)] bg-themed" />
              <h2 className="mb-4 text-lg font-semibold text-themed">{formatDate(group.date)}</h2>
              <span className="mb-4 block text-sm text-themed-muted">{group.items.length} piece{group.items.length !== 1 ? 's' : ''}</span>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((piece: any) => (
                  <a
                    key={piece.id}
                    href={`/edit/${piece.id}`}
                    className="group overflow-hidden rounded-xl border border-themed bg-themed-card transition-all hover:border-[var(--border-hover)]"
                  >
                    <div className="aspect-video">
                      <MediaRenderer
                        mediaType={piece.mediaType}
                        sourceUrl={piece.sourceUrl}
                        title={piece.title}
                        className="h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="truncate text-sm font-medium text-themed">{piece.title}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-themed-input px-1.5 py-0.5 text-[10px] text-themed-muted">{piece.mediaType}</span>
                        {piece.collection && (
                          <span className="text-[10px] accent-text">{piece.collection.name}</span>
                        )}
                        {piece.isFavorite && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="var(--accent)" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

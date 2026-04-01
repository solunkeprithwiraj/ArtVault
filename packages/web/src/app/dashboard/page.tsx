'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';

interface Stats {
  total: number;
  favorites: number;
  byType: Record<string, number>;
  byCollection: Array<{ id: string; name: string; _count: { artPieces: number } }>;
  recent: Array<{ id: string; title: string; mediaType: string; createdAt: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  IMAGE: 'Images',
  VIDEO: 'Videos',
  IFRAME: 'Embeds',
};

const TYPE_ICONS: Record<string, string> = {
  IMAGE: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  VIDEO: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  IFRAME: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.artPieces
      .stats()
      .then(setStats)
      .catch((err) => toast(err.message || 'Failed to load stats', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-8 text-3xl font-bold text-themed">Dashboard</h1>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pieces" value={stats.total} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        <StatCard label="Favorites" value={stats.favorites} icon="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" accent />
        <StatCard label="Collections" value={stats.byCollection.length} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        <StatCard label="Tags" value="-" icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* By type */}
        <div className="rounded-xl border border-themed bg-themed-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-themed">By Type</h2>
          <div className="space-y-3">
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = stats.byType[type] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-themed-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={TYPE_ICONS[type]} />
                      </svg>
                      {label}
                    </span>
                    <span className="font-medium text-themed">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-themed-input">
                    <div
                      className="h-full rounded-full accent-bg transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By collection */}
        <div className="rounded-xl border border-themed bg-themed-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-themed">By Collection</h2>
          {stats.byCollection.length === 0 ? (
            <p className="text-sm text-themed-muted">No collections yet</p>
          ) : (
            <div className="space-y-2">
              {stats.byCollection.map((c) => (
                <a
                  key={c.id}
                  href={`/?collectionId=${c.id}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-themed-input"
                >
                  <span className="text-sm text-themed">{c.name}</span>
                  <span className="rounded-full accent-soft-bg px-2.5 py-0.5 text-xs font-medium accent-text">
                    {c._count.artPieces}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-themed bg-themed-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-themed">Recently Added</h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-themed-muted">No pieces yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recent.map((piece) => (
                <div key={piece.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-themed-input">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-themed-input px-2 py-1 text-xs font-mono text-themed-muted">
                      {piece.mediaType}
                    </span>
                    <span className="text-sm text-themed">{piece.title}</span>
                  </div>
                  <span className="text-xs text-themed-muted">
                    {new Date(piece.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-themed bg-themed-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-themed-secondary">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${accent ? 'accent-text' : 'text-themed'}`}>{value}</p>
        </div>
        <div className="rounded-lg accent-soft-bg p-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="accent-text">
            <path d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

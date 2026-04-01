'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ZoomableImage } from '@/components/zoomable-image';

export default function ComparePage() {
  const [pieces, setPieces] = useState<any[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  useEffect(() => {
    api.artPieces.list({ limit: '100' }).then((res) => setPieces(res.data));
  }, []);

  const left = pieces.find((p) => p.id === leftId);
  const right = pieces.find((p) => p.id === rightId);
  const selectClass = 'w-full rounded-lg border border-themed bg-themed-input px-3 py-2 text-sm text-themed focus:border-[var(--accent)] focus:outline-none';

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-themed">Compare</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className={selectClass}>
          <option value="">Select left piece...</option>
          {pieces.filter((p) => p.mediaType === 'IMAGE').map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <select value={rightId} onChange={(e) => setRightId(e.target.value)} className={selectClass}>
          <option value="">Select right piece...</option>
          {pieces.filter((p) => p.mediaType === 'IMAGE').map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {left && right ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-themed bg-themed-card">
            <ZoomableImage src={left.sourceUrl} alt={left.title} className="aspect-square" />
            <div className="p-4">
              <h3 className="font-semibold text-themed">{left.title}</h3>
              {left.description && <p className="mt-1 text-sm text-themed-secondary">{left.description}</p>}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-themed bg-themed-card">
            <ZoomableImage src={right.sourceUrl} alt={right.title} className="aspect-square" />
            <div className="p-4">
              <h3 className="font-semibold text-themed">{right.title}</h3>
              {right.description && <p className="mt-1 text-sm text-themed-secondary">{right.description}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-themed-muted">
          Select two images to compare side by side
        </div>
      )}
    </div>
  );
}

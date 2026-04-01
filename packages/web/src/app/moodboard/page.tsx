'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';

interface BoardItem {
  id: string;
  title: string;
  sourceUrl: string;
  mediaType: string;
  x: number;
  y: number;
  width: number;
}

const BOARD_KEY = 'artvault_moodboard';

export default function MoodboardPage() {
  const { toast } = useToast();
  const [pieces, setPieces] = useState<any[]>([]);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load pieces and saved board state
  useEffect(() => {
    api.artPieces.list({ limit: '200' }).then((res) => setPieces(res.data));
    const saved = localStorage.getItem(BOARD_KEY);
    if (saved) setBoardItems(JSON.parse(saved));
  }, []);

  const saveBoard = (items: BoardItem[]) => {
    setBoardItems(items);
    localStorage.setItem(BOARD_KEY, JSON.stringify(items));
  };

  const addToBoard = (piece: any) => {
    if (boardItems.find((b) => b.id === piece.id)) {
      toast('Already on board', 'info');
      return;
    }
    const newItem: BoardItem = {
      id: piece.id,
      title: piece.title,
      sourceUrl: piece.sourceUrl,
      mediaType: piece.mediaType,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      width: 250,
    };
    saveBoard([...boardItems, newItem]);
  };

  const removeFromBoard = (id: string) => {
    saveBoard(boardItems.filter((b) => b.id !== id));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const item = boardItems.find((b) => b.id === id);
    if (!item) return;
    setDraggingId(id);
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId) {
      const updated = boardItems.map((b) =>
        b.id === draggingId
          ? { ...b, x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }
          : b,
      );
      setBoardItems(updated);
    }
    if (resizingId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const item = boardItems.find((b) => b.id === resizingId);
      if (!item) return;
      const newWidth = Math.max(100, e.clientX - rect.left - item.x + 10);
      const updated = boardItems.map((b) => (b.id === resizingId ? { ...b, width: newWidth } : b));
      setBoardItems(updated);
    }
  };

  const handleMouseUp = () => {
    if (draggingId || resizingId) {
      saveBoard(boardItems);
      setDraggingId(null);
      setResizingId(null);
    }
  };

  const availablePieces = pieces.filter((p) => p.mediaType === 'IMAGE' && !boardItems.find((b) => b.id === p.id));

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-themed">Mood Board</h1>
        <div className="flex gap-2">
          {boardItems.length > 0 && (
            <button
              onClick={() => { saveBoard([]); toast('Board cleared', 'info'); }}
              className="rounded-lg bg-themed-input px-4 py-2 text-sm text-themed-secondary hover:text-themed"
            >
              Clear Board
            </button>
          )}
        </div>
      </div>

      {/* Piece picker */}
      {availablePieces.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {availablePieces.slice(0, 20).map((p) => (
            <button
              key={p.id}
              onClick={() => addToBoard(p)}
              className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-themed hover:border-[var(--accent)]"
              title={`Add "${p.title}"`}
            >
              <img src={p.sourceUrl} alt={p.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-0 group-hover:opacity-100">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative min-h-[70vh] overflow-hidden rounded-xl border-2 border-dashed border-themed bg-themed-card"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {boardItems.length === 0 && (
          <div className="flex h-[70vh] items-center justify-center">
            <p className="text-themed-muted">Click images above to add them to your mood board</p>
          </div>
        )}

        {boardItems.map((item) => (
          <div
            key={item.id}
            className="absolute cursor-move select-none rounded-lg border-2 border-transparent bg-themed-card shadow-lg transition-shadow hover:border-[var(--accent)] hover:shadow-xl"
            style={{ left: item.x, top: item.y, width: item.width }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <img
              src={item.sourceUrl}
              alt={item.title}
              className="w-full rounded-t-lg object-cover"
              draggable={false}
            />
            <div className="flex items-center justify-between p-2">
              <span className="truncate text-xs text-themed-secondary">{item.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFromBoard(item.id); }}
                className="shrink-0 p-0.5 text-themed-muted hover:text-red-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
              onMouseDown={(e) => { e.stopPropagation(); setResizingId(item.id); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-themed-muted">
                <path d="M15 3l6 6M9 3l12 12M3 3l18 18" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ZoomableImage({ src, alt, className = '' }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(Math.max(s + delta, 0.5), 5));
  }, []);

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    lastPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - lastPos.current.x, y: e.clientY - lastPos.current.y });
  };

  const handleMouseUp = () => setDragging(false);

  // Touch: pinch-to-zoom + drag
  const getTouchDist = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchStartDist.current = getTouchDist(e.touches);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setDragging(true);
      lastPos.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current > 0) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const newScale = pinchStartScale.current * (dist / pinchStartDist.current);
      setScale(Math.min(Math.max(newScale, 0.5), 5));
    } else if (e.touches.length === 1 && dragging) {
      setPosition({ x: e.touches[0].clientX - lastPos.current.x, y: e.touches[0].clientY - lastPos.current.y });
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    pinchStartDist.current = 0;
  };

  // Double tap to toggle zoom
  const lastTap = useRef(0);
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleTouchEndTap = (e: React.TouchEvent) => {
    handleTouchEnd();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleClick();
    }
    lastTap.current = now;
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative" role="img" aria-label={alt}>
      <div
        className={`overflow-hidden ${className}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndTap}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in', touchAction: 'none' }}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[50vh] w-auto max-w-full object-contain transition-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transitionDuration: dragging ? '0ms' : '150ms',
          }}
          draggable={false}
        />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm" role="toolbar" aria-label="Zoom controls">
        <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} aria-label="Zoom out" className="px-1.5 text-white hover:text-[var(--accent)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/></svg>
        </button>
        <button onClick={resetZoom} aria-label="Reset zoom" className="px-1.5 text-xs text-neutral-400 hover:text-white">
          {Math.round(scale * 100)}%
        </button>
        <button onClick={() => setScale((s) => Math.min(s + 0.25, 5))} aria-label="Zoom in" className="px-1.5 text-white hover:text-[var(--accent)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/></svg>
        </button>
      </div>
    </div>
  );
}

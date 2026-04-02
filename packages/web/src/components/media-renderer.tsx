'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface MediaRendererProps {
  mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
  sourceUrl: string;
  title: string;
  className?: string;
  thumbnail?: boolean;
  onColorExtract?: (color: string) => void;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function extractDominantColor(img: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 10, 10);
    const data = ctx.getImageData(0, 0, 10, 10).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    return `rgb(${r},${g},${b})`;
  } catch {
    return null;
  }
}

function ProxiedImage({
  sourceUrl,
  title,
  className,
  thumbnail,
  onColorExtract,
}: Omit<MediaRendererProps, 'mediaType'>) {
  // Always start with original URL — most reliable
  // Use proxy in srcSet as optimization hint (browser picks best)
  const [src, setSrc] = useState(sourceUrl);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      // Original failed — try via proxy
      setSrc(api.proxyUrl(sourceUrl, thumbnail ? { w: 600, q: 75, format: 'webp' } : undefined));
    }
  };

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (!onColorExtract) return;
      const color = extractDominantColor(e.currentTarget);
      if (color) onColorExtract(color);
    },
    [onColorExtract],
  );

  // Responsive srcSet via proxy — browser will use these if proxy is reachable
  // Falls back to src (original URL) if proxy fails
  const srcSet = thumbnail && !failed
    ? `${api.proxyUrl(sourceUrl, { w: 400, q: 70, format: 'webp' })} 400w, ${api.proxyUrl(sourceUrl, { w: 600, q: 75, format: 'webp' })} 600w, ${api.proxyUrl(sourceUrl, { w: 900, q: 80, format: 'webp' })} 900w`
    : undefined;

  const sizes = thumbnail && !failed
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={title}
      className={`w-full rounded-lg object-cover ${className}`}
      loading="lazy"
      decoding="async"
      crossOrigin={onColorExtract ? 'anonymous' : undefined}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}

function LazyIframe({ sourceUrl, title, className }: Omit<MediaRendererProps, 'mediaType'>) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const thumbnail = getYouTubeThumbnail(sourceUrl);

  if (!loaded) {
    return (
      <div
        ref={ref}
        className={`relative flex aspect-video w-full items-center justify-center rounded-lg bg-neutral-800 ${className}`}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="h-full w-full rounded-lg object-cover" loading="lazy" decoding="async" />
        ) : (
          <span className="text-sm text-themed-muted">{title}</span>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/60 p-4 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={sourceUrl}
      title={title}
      className={`aspect-video w-full rounded-lg ${className}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms allow-popups-to-escape-sandbox"
      loading="lazy"
    />
  );
}

export function MediaRenderer({ mediaType, sourceUrl, title, className = '', thumbnail, onColorExtract }: MediaRendererProps) {
  switch (mediaType) {
    case 'IMAGE':
      return (
        <ProxiedImage
          sourceUrl={sourceUrl}
          title={title}
          className={className}
          thumbnail={thumbnail}
          onColorExtract={onColorExtract}
        />
      );
    case 'VIDEO':
      return (
        <video src={sourceUrl} className={`w-full rounded-lg ${className}`} preload="metadata" controls>
          <track kind="captions" />
        </video>
      );
    case 'IFRAME':
      return <LazyIframe sourceUrl={sourceUrl} title={title} className={className} />;
  }
}

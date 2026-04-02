'use client';

import { useState, useRef, useEffect } from 'react';

interface MediaRendererProps {
  mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
  sourceUrl: string;
  title: string;
  className?: string;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function SimpleImage({ sourceUrl, title, className }: MediaRendererProps) {
  return (
    <img
      src={sourceUrl}
      alt={title}
      className={`w-full rounded-lg object-cover ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

function LazyIframe({ sourceUrl, title, className }: MediaRendererProps) {
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

export function MediaRenderer({ mediaType, sourceUrl, title, className = '' }: MediaRendererProps) {
  switch (mediaType) {
    case 'IMAGE':
      return <SimpleImage mediaType={mediaType} sourceUrl={sourceUrl} title={title} className={className} />;
    case 'VIDEO':
      return (
        <video src={sourceUrl} className={`w-full rounded-lg ${className}`} preload="metadata" controls>
          <track kind="captions" />
        </video>
      );
    case 'IFRAME':
      return <LazyIframe mediaType={mediaType} sourceUrl={sourceUrl} title={title} className={className} />;
  }
}

'use client';

interface MediaRendererProps {
  mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
  sourceUrl: string;
  title: string;
  className?: string;
}

export function MediaRenderer({ mediaType, sourceUrl, title, className = '' }: MediaRendererProps) {
  switch (mediaType) {
    case 'IMAGE':
      return (
        <img
          src={sourceUrl}
          alt={title}
          className={`w-full rounded-lg object-cover ${className}`}
          loading="lazy"
        />
      );

    case 'VIDEO':
      return (
        <video
          src={sourceUrl}
          controls
          className={`w-full rounded-lg ${className}`}
          preload="metadata"
        >
          <track kind="captions" />
        </video>
      );

    case 'IFRAME':
      return (
        <iframe
          src={sourceUrl}
          title={title}
          className={`aspect-video w-full rounded-lg ${className}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      );
  }
}

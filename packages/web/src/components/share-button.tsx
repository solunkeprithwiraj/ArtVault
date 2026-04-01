'use client';

import { useToast } from './toast';

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, text, url, className = '' }: ShareButtonProps) {
  const { toast } = useToast();

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, text: text || title, url });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast('Failed to share', 'error');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied', 'success');
      } catch {
        toast('Failed to copy link', 'error');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`p-1 transition-colors ${className}`}
      aria-label={canShare ? `Share ${title}` : `Copy link for ${title}`}
      title={canShare ? 'Share' : 'Copy link'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-themed-muted hover:text-themed">
        {canShare ? (
          <>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </>
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
    </button>
  );
}

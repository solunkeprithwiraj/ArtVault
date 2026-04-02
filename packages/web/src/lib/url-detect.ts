interface DetectedMedia {
  mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
  sourceUrl: string;
  title?: string;
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i;

const EMBED_PATTERNS: Array<{
  pattern: RegExp;
  transform: (match: RegExpMatchArray) => { sourceUrl: string; title?: string };
}> = [
  {
    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/watch?...&v=ID
    pattern: /(?:youtube\.com\/watch\?(?:[^&]*&)*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    transform: (m) => ({
      sourceUrl: `https://www.youtube.com/embed/${m[1]}`,
      title: `YouTube Video (${m[1]})`,
    }),
  },
  {
    // YouTube Shorts
    pattern: /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    transform: (m) => ({
      sourceUrl: `https://www.youtube.com/embed/${m[1]}`,
      title: `YouTube Short (${m[1]})`,
    }),
  },
  {
    // Vimeo: vimeo.com/ID
    pattern: /vimeo\.com\/(\d+)/,
    transform: (m) => ({
      sourceUrl: `https://player.vimeo.com/video/${m[1]}`,
      title: `Vimeo Video (${m[1]})`,
    }),
  },
  {
    // Dailymotion
    pattern: /dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
    transform: (m) => ({
      sourceUrl: `https://www.dailymotion.com/embed/video/${m[1]}`,
      title: `Dailymotion Video (${m[1]})`,
    }),
  },
  {
    // Spotify track/album/playlist
    pattern: /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/,
    transform: (m) => ({
      sourceUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
      title: `Spotify ${m[1]} (${m[2]})`,
    }),
  },
  {
    // SoundCloud
    pattern: /soundcloud\.com\/[\w-]+\/[\w-]+/,
    transform: (m) => ({
      sourceUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(m[0])}&auto_play=false&visual=true`,
      title: 'SoundCloud Track',
    }),
  },
];

export function detectMedia(url: string): DetectedMedia | null {
  if (!url) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  // Check embed patterns first (most specific)
  for (const { pattern, transform } of EMBED_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const result = transform(match);
      return { mediaType: 'IFRAME', ...result };
    }
  }

  // Check file extensions
  if (IMAGE_EXTENSIONS.test(url)) {
    return { mediaType: 'IMAGE', sourceUrl: url };
  }

  if (VIDEO_EXTENSIONS.test(url)) {
    return { mediaType: 'VIDEO', sourceUrl: url };
  }

  // Default: treat as image if it looks like an image host
  const imageHosts = ['imgur.com', 'i.imgur.com', 'unsplash.com', 'images.unsplash.com', 'pbs.twimg.com', 'upload.wikimedia.org'];
  try {
    const hostname = new URL(url).hostname;
    if (imageHosts.some((h) => hostname.includes(h))) {
      return { mediaType: 'IMAGE', sourceUrl: url };
    }
  } catch {}

  return null;
}

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
    // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
    pattern: /vimeo\.com\/(?:video\/)?(\d+)/,
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
  {
    // Twitch clips
    pattern: /clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/,
    transform: (m) => ({
      sourceUrl: `https://clips.twitch.tv/embed?clip=${m[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`,
      title: `Twitch Clip (${m[1]})`,
    }),
  },
  {
    // Twitch channel/video
    pattern: /twitch\.tv\/(?:videos\/(\d+)|([a-zA-Z0-9_]+))/,
    transform: (m) => {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      if (m[1]) {
        return { sourceUrl: `https://player.twitch.tv/?video=${m[1]}&parent=${parent}`, title: `Twitch Video (${m[1]})` };
      }
      return { sourceUrl: `https://player.twitch.tv/?channel=${m[2]}&parent=${parent}`, title: `Twitch Channel (${m[2]})` };
    },
  },
  {
    // Loom
    pattern: /loom\.com\/share\/([a-f0-9]+)/,
    transform: (m) => ({
      sourceUrl: `https://www.loom.com/embed/${m[1]}`,
      title: `Loom Video (${m[1]})`,
    }),
  },
  {
    // Figma
    pattern: /figma\.com\/(file|proto)\/([a-zA-Z0-9]+)/,
    transform: (m) => ({
      sourceUrl: `https://www.figma.com/embed?embed_host=artvault&url=${encodeURIComponent(m[0])}`,
      title: `Figma ${m[1]} (${m[2]})`,
    }),
  },
  {
    // CodePen
    pattern: /codepen\.io\/([^/]+)\/pen\/([a-zA-Z0-9]+)/,
    transform: (m) => ({
      sourceUrl: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`,
      title: `CodePen (${m[1]}/${m[2]})`,
    }),
  },
  {
    // Google Drive (public files/videos)
    pattern: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    transform: (m) => ({
      sourceUrl: `https://drive.google.com/file/d/${m[1]}/preview`,
      title: `Google Drive File (${m[1].slice(0, 8)}...)`,
    }),
  },
];

/**
 * Extract src URL from pasted iframe HTML.
 * e.g., `<iframe src="https://player.vimeo.com/video/123" ...></iframe>` → `https://player.vimeo.com/video/123`
 */
function extractIframeSrc(input: string): string | null {
  const match = input.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export function detectMedia(input: string): DetectedMedia | null {
  if (!input) return null;

  const trimmed = input.trim();

  // 1. Check if input is pasted iframe HTML
  if (trimmed.startsWith('<iframe') || trimmed.startsWith('<IFRAME')) {
    const src = extractIframeSrc(trimmed);
    if (src) {
      // Try to detect the embed provider from the extracted src
      const detected = detectFromUrl(src);
      if (detected) return detected;
      // Otherwise use the raw iframe src as an IFRAME type
      return { mediaType: 'IFRAME', sourceUrl: src, title: 'Embedded content' };
    }
    return null;
  }

  // 2. Check if input is a valid URL
  try {
    new URL(trimmed);
  } catch {
    return null;
  }

  return detectFromUrl(trimmed);
}

function detectFromUrl(url: string): DetectedMedia | null {
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

  // Known embed domains — if the URL is already a player/embed URL, use it directly
  const embedDomains = [
    'player.vimeo.com',
    'www.youtube.com/embed',
    'open.spotify.com/embed',
    'w.soundcloud.com',
    'player.twitch.tv',
    'clips.twitch.tv/embed',
    'www.loom.com/embed',
    'www.figma.com/embed',
    'codepen.io',
    'drive.google.com',
    'docs.google.com',
    'bandcamp.com/EmbeddedPlayer',
    'embed.music.apple.com',
  ];

  try {
    const parsed = new URL(url);
    const fullPath = parsed.hostname + parsed.pathname;
    if (embedDomains.some((d) => fullPath.includes(d))) {
      return { mediaType: 'IFRAME', sourceUrl: url, title: 'Embedded content' };
    }
  } catch {}

  // Known image hosts
  const imageHosts = ['imgur.com', 'i.imgur.com', 'unsplash.com', 'images.unsplash.com', 'pbs.twimg.com', 'upload.wikimedia.org'];
  try {
    const hostname = new URL(url).hostname;
    if (imageHosts.some((h) => hostname.includes(h))) {
      return { mediaType: 'IMAGE', sourceUrl: url };
    }
  } catch {}

  return null;
}

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';

interface ScrapedMedia {
  type: 'IMAGE' | 'IFRAME';
  url: string;
  thumbnail?: string;
  title?: string;
}

interface ScrapeResult {
  pageTitle: string;
  pageDescription: string;
  favicon: string | null;
  media: ScrapedMedia[];
}

// ─── Video platform patterns ────────────────────────────────────────────────

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/g,
];

const VIMEO_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g,
  /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/g,
];

const TIKTOK_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/g,
  /(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/(\w+)/g,
];

const INSTAGRAM_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/g,
];

const TWITTER_PATTERNS = [
  /(?:https?:\/\/)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/g,
];

const REDDIT_VIDEO_PATTERN = /(?:https?:\/\/)?(?:v\.redd\.it|reddit\.com\/[^\s"']+\.mp4)/g;

const DAILYMOTION_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/g,
  /(?:https?:\/\/)?(?:www\.)?dai\.ly\/([a-zA-Z0-9]+)/g,
];

const TWITCH_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/g,
  /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/g,
];

const SPOTIFY_PATTERNS = [
  /(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/g,
];

const SOUNDCLOUD_PATTERN = /(?:https?:\/\/)?soundcloud\.com\/[\w-]+\/[\w-]+/g;

// ─── Image / media file extensions ──────────────────────────────────────────

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|avif|bmp|tiff?)(\?[^"'\s]*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|m3u8)(\?[^"'\s]*)?$/i;

// URLs to always skip
const SKIP_PATTERNS = [
  /google-analytics\.com/i,
  /facebook\.com\/tr/i,
  /doubleclick\.net/i,
  /googletagmanager\.com/i,
  /pixel\./i,
  /beacon\./i,
  /analytics\./i,
  /1x1\./i,
  /spacer\./i,
  /blank\./i,
  /transparent\./i,
];

@Controller('scrape')
export class ScrapeController {
  @Post()
  async scrape(@Body() body: { url: string }): Promise<ScrapeResult> {
    if (!body.url) throw new BadRequestException('url is required');

    try {
      new URL(body.url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    let html: string;
    try {
      const res = await fetch(body.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err: any) {
      throw new BadRequestException(`Failed to fetch page: ${err.message}`);
    }

    const found = new Map<string, ScrapedMedia>();
    const seenNormalized = new Set<string>();

    const addMedia = (key: string, media: ScrapedMedia) => {
      const norm = this.normalizeUrl(media.url);
      if (seenNormalized.has(norm)) return;
      if (this.shouldSkipUrl(media.url)) return;
      seenNormalized.add(norm);
      found.set(key, media);
    };

    // ─── 1. YouTube ─────────────────────────────────────────────────
    for (const pattern of YOUTUBE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        addMedia(`yt:${id}`, {
          type: 'IFRAME',
          url: `https://www.youtube.com/embed/${id}`,
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          title: `YouTube Video (${id})`,
        });
      }
    }

    // ─── 2. Vimeo ───────────────────────────────────────────────────
    for (const pattern of VIMEO_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        addMedia(`vimeo:${id}`, {
          type: 'IFRAME',
          url: `https://player.vimeo.com/video/${id}`,
          title: `Vimeo Video (${id})`,
        });
      }
    }

    // ─── 3. TikTok ──────────────────────────────────────────────────
    for (const pattern of TIKTOK_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        addMedia(`tiktok:${id}`, {
          type: 'IFRAME',
          url: `https://www.tiktok.com/embed/v2/${id}`,
          title: `TikTok Video (${id})`,
        });
      }
    }

    // ─── 4. Instagram ───────────────────────────────────────────────
    for (const pattern of INSTAGRAM_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        addMedia(`ig:${id}`, {
          type: 'IFRAME',
          url: `https://www.instagram.com/p/${id}/embed`,
          title: `Instagram Post (${id})`,
        });
      }
    }

    // ─── 5. Twitter / X ─────────────────────────────────────────────
    for (const pattern of TWITTER_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        addMedia(`tw:${id}`, {
          type: 'IFRAME',
          url: `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
          title: `Tweet (${id})`,
        });
      }
    }

    // ─── 6. Reddit video ────────────────────────────────────────────
    REDDIT_VIDEO_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = REDDIT_VIDEO_PATTERN.exec(html)) !== null) {
      const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
      addMedia(`reddit:${url}`, { type: 'IFRAME', url, title: 'Reddit Video' });
    }

    // ─── 7. Dailymotion ─────────────────────────────────────────────
    for (const pattern of DAILYMOTION_PATTERNS) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        addMedia(`dm:${id}`, {
          type: 'IFRAME',
          url: `https://www.dailymotion.com/embed/video/${id}`,
          title: `Dailymotion Video (${id})`,
        });
      }
    }

    // ─── 8. Twitch ──────────────────────────────────────────────────
    for (const pattern of TWITCH_PATTERNS) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        const isClip = pattern.source.includes('clips');
        addMedia(`twitch:${id}`, {
          type: 'IFRAME',
          url: isClip
            ? `https://clips.twitch.tv/embed?clip=${id}`
            : `https://player.twitch.tv/?video=${id}&parent=localhost`,
          title: isClip ? `Twitch Clip (${id})` : `Twitch Video (${id})`,
        });
      }
    }

    // ─── 9. Spotify ─────────────────────────────────────────────────
    for (const pattern of SPOTIFY_PATTERNS) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(html)) !== null) {
        const type = match[1];
        const id = match[2];
        addMedia(`spotify:${id}`, {
          type: 'IFRAME',
          url: `https://open.spotify.com/embed/${type}/${id}`,
          title: `Spotify ${type} (${id})`,
        });
      }
    }

    // ─── 10. SoundCloud ─────────────────────────────────────────────
    SOUNDCLOUD_PATTERN.lastIndex = 0;
    while ((match = SOUNDCLOUD_PATTERN.exec(html)) !== null) {
      const scUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
      addMedia(`sc:${scUrl}`, {
        type: 'IFRAME',
        url: `https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&auto_play=false&visual=true`,
        title: 'SoundCloud Track',
      });
    }

    // ─── 11. <video> src ────────────────────────────────────────────
    const videoSrcPattern = /<video[^>]*\ssrc=["']([^"']+)["']/gi;
    while ((match = videoSrcPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (url) addMedia(url, { type: 'IFRAME', url, title: 'Video' });
    }

    // ─── 12. <source> in <video> ────────────────────────────────────
    const sourceSrcPattern = /<source[^>]*\ssrc=["']([^"']+)["'][^>]*type=["']video/gi;
    while ((match = sourceSrcPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (url) addMedia(url, { type: 'IFRAME', url, title: 'Video' });
    }

    // ─── 13. <img> src ──────────────────────────────────────────────
    const imgPattern = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*/gi;
    while ((match = imgPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (!url || url.startsWith('data:')) continue;
      if (/\.(ico)(\?|$)/i.test(url)) continue;

      const widthMatch = match[0].match(/width=["']?(\d+)/i);
      const heightMatch = match[0].match(/height=["']?(\d+)/i);
      if (widthMatch && parseInt(widthMatch[1]) < 50) continue;
      if (heightMatch && parseInt(heightMatch[1]) < 50) continue;

      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
      addMedia(url, {
        type: 'IMAGE',
        url,
        thumbnail: url,
        title: altMatch?.[1] || undefined,
      });
    }

    // ─── 14. Lazy-loaded images: data-src, data-lazy-src, data-original ─
    const lazySrcPattern = /<img[^>]*\s(?:data-src|data-lazy-src|data-original|data-full-src)=["']([^"']+)["'][^>]*/gi;
    while ((match = lazySrcPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (!url || url.startsWith('data:')) continue;

      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
      addMedia(`lazy:${url}`, {
        type: 'IMAGE',
        url,
        thumbnail: url,
        title: altMatch?.[1] || undefined,
      });
    }

    // ─── 15. <img> srcset — pick highest resolution ─────────────────
    const srcsetPattern = /<img[^>]*\ssrcset=["']([^"']+)["'][^>]*/gi;
    while ((match = srcsetPattern.exec(html)) !== null) {
      const srcset = match[1];
      const bestUrl = this.pickBestFromSrcset(srcset, body.url);
      if (bestUrl) {
        const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
        addMedia(`srcset:${bestUrl}`, {
          type: 'IMAGE',
          url: bestUrl,
          thumbnail: bestUrl,
          title: altMatch?.[1] || undefined,
        });
      }
    }

    // ─── 16. <picture> <source> srcset ──────────────────────────────
    const pictureSourcePattern = /<source[^>]*\ssrcset=["']([^"']+)["'][^>]*/gi;
    while ((match = pictureSourcePattern.exec(html)) !== null) {
      // Skip video sources (already handled)
      if (/type=["']video/i.test(match[0])) continue;
      const bestUrl = this.pickBestFromSrcset(match[1], body.url);
      if (bestUrl) {
        addMedia(`picsrc:${bestUrl}`, {
          type: 'IMAGE',
          url: bestUrl,
          thumbnail: bestUrl,
        });
      }
    }

    // ─── 17. CSS background-image ───────────────────────────────────
    const bgImagePattern = /background(?:-image)?\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    while ((match = bgImagePattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (!url || url.startsWith('data:')) continue;
      if (IMAGE_EXT.test(url)) {
        addMedia(`bg:${url}`, {
          type: 'IMAGE',
          url,
          thumbnail: url,
          title: 'Background Image',
        });
      }
    }

    // ─── 18. <a> links to media files ───────────────────────────────
    const linkPattern = /<a[^>]*\shref=["']([^"']+)["'][^>]*/gi;
    while ((match = linkPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (!url) continue;

      if (IMAGE_EXT.test(url)) {
        const titleMatch = match[0].match(/title=["']([^"']*)["']/i);
        addMedia(`link:${url}`, {
          type: 'IMAGE',
          url,
          thumbnail: url,
          title: titleMatch?.[1] || 'Linked Image',
        });
      } else if (VIDEO_EXT.test(url)) {
        addMedia(`link:${url}`, {
          type: 'IFRAME',
          url,
          title: 'Linked Video',
        });
      }
    }

    // ─── 19. Open Graph meta tags ───────────────────────────────────
    const ogPattern = /<meta[^>]*(?:property|name)=["']og:(image|video)(?::url)?["'][^>]*content=["']([^"']+)["']/gi;
    while ((match = ogPattern.exec(html)) !== null) {
      const isVideo = match[1] === 'video';
      const url = this.resolveUrl(match[2], body.url);
      if (url) {
        addMedia(`og:${url}`, {
          type: isVideo ? 'IFRAME' : 'IMAGE',
          url,
          thumbnail: isVideo ? undefined : url,
          title: 'Open Graph Media',
        });
      }
    }
    // Reverse attr order
    const ogPatternRev = /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:(image|video)(?::url)?["']/gi;
    while ((match = ogPatternRev.exec(html)) !== null) {
      const isVideo = match[2] === 'video';
      const url = this.resolveUrl(match[1], body.url);
      if (url) {
        addMedia(`og:${url}`, {
          type: isVideo ? 'IFRAME' : 'IMAGE',
          url,
          thumbnail: isVideo ? undefined : url,
          title: 'Open Graph Media',
        });
      }
    }

    // ─── 20. Twitter card meta tags ─────────────────────────────────
    const twitterCardPattern = /<meta[^>]*(?:property|name)=["']twitter:(image|player)(?::url)?["'][^>]*content=["']([^"']+)["']/gi;
    while ((match = twitterCardPattern.exec(html)) !== null) {
      const isPlayer = match[1] === 'player';
      const url = this.resolveUrl(match[2], body.url);
      if (url) {
        addMedia(`twcard:${url}`, {
          type: isPlayer ? 'IFRAME' : 'IMAGE',
          url,
          thumbnail: isPlayer ? undefined : url,
          title: 'Twitter Card Media',
        });
      }
    }

    // ─── 21. JSON-LD structured data ────────────────────────────────
    const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = jsonLdPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        this.extractFromJsonLd(data, body.url, addMedia);
      } catch {
        // invalid JSON-LD, skip
      }
    }

    // ─── Page metadata ──────────────────────────────────────────────
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = this.decodeHtmlEntities(titleMatch?.[1]?.trim() || '');

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const pageDescription = this.decodeHtmlEntities(descMatch?.[1]?.trim() || '');

    const faviconMatch =
      html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    const favicon = faviconMatch ? this.resolveUrl(faviconMatch[1], body.url) : null;

    return {
      pageTitle,
      pageDescription,
      favicon,
      media: Array.from(found.values()),
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private resolveUrl(rawUrl: string, baseUrl: string): string | null {
    try {
      if (!rawUrl || rawUrl.startsWith('javascript:') || rawUrl.startsWith('#')) return null;
      return new URL(rawUrl, baseUrl).href;
    } catch {
      return null;
    }
  }

  /** Normalize URL for deduplication: strip tracking params, protocol, trailing slash */
  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      // Remove common tracking params
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'ref', 'fbclid', 'gclid', 'si', 'feature'].forEach((p) => u.searchParams.delete(p));
      // Normalize
      return `${u.hostname}${u.pathname.replace(/\/$/, '')}${u.search}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /** Check if URL is a tracking pixel / analytics beacon */
  private shouldSkipUrl(url: string): boolean {
    return SKIP_PATTERNS.some((p) => p.test(url));
  }

  /** Pick the highest resolution URL from a srcset string */
  private pickBestFromSrcset(srcset: string, baseUrl: string): string | null {
    const candidates = srcset.split(',').map((s) => {
      const parts = s.trim().split(/\s+/);
      const url = this.resolveUrl(parts[0], baseUrl);
      const descriptor = parts[1] || '1x';
      let size = 1;
      if (descriptor.endsWith('w')) size = parseInt(descriptor) || 1;
      else if (descriptor.endsWith('x')) size = (parseFloat(descriptor) || 1) * 1000;
      return { url, size };
    });

    candidates.sort((a, b) => b.size - a.size);
    return candidates[0]?.url || null;
  }

  /** Recursively extract media from JSON-LD structured data */
  private extractFromJsonLd(
    data: any,
    baseUrl: string,
    addMedia: (key: string, media: ScrapedMedia) => void,
  ) {
    if (!data) return;

    // Handle arrays (multiple JSON-LD objects)
    if (Array.isArray(data)) {
      data.forEach((item) => this.extractFromJsonLd(item, baseUrl, addMedia));
      return;
    }

    // Extract images
    if (data.image) {
      const images = Array.isArray(data.image) ? data.image : [data.image];
      for (const img of images) {
        const url = typeof img === 'string' ? img : img?.url || img?.contentUrl;
        const resolved = url ? this.resolveUrl(url, baseUrl) : null;
        if (resolved) {
          addMedia(`jsonld:${resolved}`, {
            type: 'IMAGE',
            url: resolved,
            thumbnail: resolved,
            title: data.name || data.headline || 'Structured Data Image',
          });
        }
      }
    }

    // Extract thumbnailUrl
    if (data.thumbnailUrl) {
      const url = this.resolveUrl(data.thumbnailUrl, baseUrl);
      if (url) {
        addMedia(`jsonld:thumb:${url}`, {
          type: 'IMAGE',
          url,
          thumbnail: url,
          title: data.name || 'Thumbnail',
        });
      }
    }

    // Extract video
    if (data.video || data.contentUrl || data['@type'] === 'VideoObject') {
      const videoUrl = data.contentUrl || data.embedUrl || (data.video?.contentUrl) || (data.video?.embedUrl);
      if (videoUrl) {
        const url = this.resolveUrl(videoUrl, baseUrl);
        if (url) {
          addMedia(`jsonld:video:${url}`, {
            type: 'IFRAME',
            url,
            thumbnail: data.thumbnailUrl ? this.resolveUrl(data.thumbnailUrl, baseUrl) || undefined : undefined,
            title: data.name || data.headline || 'Video',
          });
        }
      }
    }

    // Recurse into @graph
    if (data['@graph']) {
      this.extractFromJsonLd(data['@graph'], baseUrl, addMedia);
    }

    // Recurse into itemListElement (e.g., carousels)
    if (data.itemListElement && Array.isArray(data.itemListElement)) {
      for (const item of data.itemListElement) {
        this.extractFromJsonLd(item.item || item, baseUrl, addMedia);
      }
    }
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
  }
}

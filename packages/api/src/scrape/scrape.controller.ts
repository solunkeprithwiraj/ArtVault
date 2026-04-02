import { Controller, Post, Body, BadRequestException } from '@nestjs/common';

interface ScrapedMedia {
  type: 'IMAGE' | 'IFRAME';
  url: string;
  thumbnail?: string;
  title?: string;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/g,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/g,
];

// Vimeo patterns
const VIMEO_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g,
  /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/g,
];

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(\?[^"'\s]*)?$/i;

@Controller('scrape')
export class ScrapeController {
  @Post()
  async scrape(@Body() body: { url: string }) {
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
          'User-Agent': 'Mozilla/5.0 (compatible; ArtVault/1.0)',
          Accept: 'text/html,application/xhtml+xml',
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

    // Extract YouTube videos
    for (const pattern of YOUTUBE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const videoId = match[1];
        const key = `yt:${videoId}`;
        if (!found.has(key)) {
          found.set(key, {
            type: 'IFRAME',
            url: `https://www.youtube.com/embed/${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            title: `YouTube Video (${videoId})`,
          });
        }
      }
    }

    // Extract Vimeo videos
    for (const pattern of VIMEO_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const videoId = match[1];
        const key = `vimeo:${videoId}`;
        if (!found.has(key)) {
          found.set(key, {
            type: 'IFRAME',
            url: `https://player.vimeo.com/video/${videoId}`,
            title: `Vimeo Video (${videoId})`,
          });
        }
      }
    }

    // Extract <video> src attributes
    const videoSrcPattern = /<video[^>]*\ssrc=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = videoSrcPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (url && !found.has(url)) {
        found.set(url, { type: 'IFRAME', url, title: 'Video' });
      }
    }

    // Extract <source> inside <video> tags
    const sourceSrcPattern = /<source[^>]*\ssrc=["']([^"']+)["'][^>]*type=["']video/gi;
    while ((match = sourceSrcPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (url && !found.has(url)) {
        found.set(url, { type: 'IFRAME', url, title: 'Video' });
      }
    }

    // Extract images from <img> tags (filter small icons/tracking pixels)
    const imgPattern = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*/gi;
    while ((match = imgPattern.exec(html)) !== null) {
      const url = this.resolveUrl(match[1], body.url);
      if (!url || found.has(url)) continue;

      // Skip data URIs, tiny icons, tracking pixels
      if (url.startsWith('data:')) continue;
      if (/\.(ico|svg)(\?|$)/i.test(url)) continue;

      // Check for size hints — skip small images
      const widthMatch = match[0].match(/width=["']?(\d+)/i);
      const heightMatch = match[0].match(/height=["']?(\d+)/i);
      if (widthMatch && parseInt(widthMatch[1]) < 50) continue;
      if (heightMatch && parseInt(heightMatch[1]) < 50) continue;

      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);

      found.set(url, {
        type: 'IMAGE',
        url,
        thumbnail: url,
        title: altMatch?.[1] || undefined,
      });
    }

    // Extract from og:image / og:video meta tags
    const ogPattern = /<meta[^>]*property=["']og:(image|video)(?::url)?["'][^>]*content=["']([^"']+)["']/gi;
    while ((match = ogPattern.exec(html)) !== null) {
      const type = match[1] === 'video' ? 'IFRAME' : 'IMAGE';
      const url = this.resolveUrl(match[2], body.url);
      if (url && !found.has(`og:${url}`)) {
        found.set(`og:${url}`, {
          type: type as 'IMAGE' | 'IFRAME',
          url,
          thumbnail: type === 'IMAGE' ? url : undefined,
          title: 'Open Graph Media',
        });
      }
    }

    // Also check reverse order: content before property
    const ogPatternReverse = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:(image|video)(?::url)?["']/gi;
    while ((match = ogPatternReverse.exec(html)) !== null) {
      const type = match[2] === 'video' ? 'IFRAME' : 'IMAGE';
      const url = this.resolveUrl(match[1], body.url);
      if (url && !found.has(`og:${url}`)) {
        found.set(`og:${url}`, {
          type: type as 'IMAGE' | 'IFRAME',
          url,
          thumbnail: type === 'IMAGE' ? url : undefined,
          title: 'Open Graph Media',
        });
      }
    }

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch?.[1]?.trim() || '';

    return {
      pageTitle,
      media: Array.from(found.values()),
    };
  }

  private resolveUrl(rawUrl: string, baseUrl: string): string | null {
    try {
      return new URL(rawUrl, baseUrl).href;
    } catch {
      return null;
    }
  }
}

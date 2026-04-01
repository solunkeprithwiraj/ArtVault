import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import sharp from 'sharp';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
];

const RESIZABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('proxy')
export class ProxyController {
  @Get()
  async proxy(
    @Query('url') url: string,
    @Query('w') width?: string,
    @Query('h') height?: string,
    @Query('q') quality?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ) {
    if (!url) throw new BadRequestException('url query parameter is required');
    if (!res) return;

    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    try {
      const upstream = await fetch(url, {
        headers: { 'User-Agent': 'ArtVault/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!upstream.ok) {
        return res.status(upstream.status).send('Upstream error');
      }

      const contentType = upstream.headers.get('content-type') || '';
      if (!ALLOWED_CONTENT_TYPES.some((t) => contentType.startsWith(t))) {
        return res.status(400).send('Not an image');
      }

      const contentLength = upstream.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_SIZE) {
        return res.status(413).send('Image too large');
      }

      let buffer = Buffer.from(await upstream.arrayBuffer());

      const w = width ? parseInt(width) : undefined;
      const h = height ? parseInt(height) : undefined;
      const q = quality ? Math.min(100, Math.max(1, parseInt(quality))) : 80;
      const needsResize = (w || h || quality || format) && RESIZABLE_TYPES.some((t) => contentType.startsWith(t));

      if (needsResize) {
        let pipeline = sharp(buffer);

        if (w || h) {
          pipeline = pipeline.resize(w || undefined, h || undefined, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        const outputFormat = format === 'webp' ? 'webp' : format === 'avif' ? 'avif' : format === 'png' ? 'png' : 'jpeg';

        switch (outputFormat) {
          case 'webp':
            pipeline = pipeline.webp({ quality: q });
            break;
          case 'avif':
            pipeline = pipeline.avif({ quality: q });
            break;
          case 'png':
            pipeline = pipeline.png({ quality: q });
            break;
          default:
            pipeline = pipeline.jpeg({ quality: q });
        }

        buffer = Buffer.from(await pipeline.toBuffer());

        const mimeMap = { webp: 'image/webp', avif: 'image/avif', png: 'image/png', jpeg: 'image/jpeg' };
        res.setHeader('Content-Type', mimeMap[outputFormat]);
      } else {
        res.setHeader('Content-Type', contentType);
      }

      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch {
      return res.status(502).send('Failed to fetch image');
    }
  }
}

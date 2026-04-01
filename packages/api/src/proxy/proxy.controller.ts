import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('proxy')
export class ProxyController {
  @Get()
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) throw new BadRequestException('url query parameter is required');

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

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (err: any) {
      return res.status(502).send('Failed to fetch image');
    }
  }
}

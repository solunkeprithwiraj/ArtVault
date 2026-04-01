import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MediaType } from '../generated/prisma/client';
import { CreateArtPieceDto, UpdateArtPieceDto } from './art-pieces.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  tags?: string[];
  collectionId?: string;
  search?: string;
  mediaType?: MediaType;
  favorite?: boolean;
  sort?: string;
  fuzzy?: boolean;
}

@Injectable()
export class ArtPiecesService {
  constructor(private prisma: PrismaService) {}

  async findAll(opts: FindAllOptions = {}) {
    const { page = 1, limit = 20, tags, collectionId, search, mediaType, favorite, sort = 'custom', fuzzy } = opts;

    // Fuzzy search via pg_trgm
    if (search && fuzzy) {
      const results: any[] = await this.prisma.$queryRaw`
        SELECT ap.*, similarity(ap.title, ${search}) AS sim
        FROM art_pieces ap
        WHERE similarity(ap.title, ${search}) > 0.1
           OR similarity(COALESCE(ap.description, ''), ${search}) > 0.1
        ORDER BY sim DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
      const countResult: any[] = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS total FROM art_pieces ap
        WHERE similarity(ap.title, ${search}) > 0.1
           OR similarity(COALESCE(ap.description, ''), ${search}) > 0.1
      `;
      // Fetch full objects with relations
      const ids = results.map((r) => r.id);
      const data = ids.length
        ? await this.prisma.artPiece.findMany({
            where: { id: { in: ids } },
            include: { collection: true },
          })
        : [];
      // Preserve similarity order
      const ordered = ids.map((id) => data.find((d) => d.id === id)).filter(Boolean);
      return { data: ordered, total: countResult[0]?.total || 0, page, limit };
    }

    const where: Prisma.ArtPieceWhereInput = {};
    if (tags?.length) where.tags = { hasEvery: tags };
    if (collectionId) where.collectionId = collectionId;
    if (mediaType) where.mediaType = mediaType;
    if (favorite !== undefined) where.isFavorite = favorite;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByMap: Record<string, Prisma.ArtPieceOrderByWithRelationInput[]> = {
      newest: [{ createdAt: 'desc' }],
      oldest: [{ createdAt: 'asc' }],
      title: [{ title: 'asc' }],
      title_desc: [{ title: 'desc' }],
      custom: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    };

    return Promise.all([
      this.prisma.artPiece.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderByMap[sort] || orderByMap.custom,
        include: { collection: true },
      }),
      this.prisma.artPiece.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findOne(id: string) {
    return this.prisma.artPiece.findUniqueOrThrow({
      where: { id },
      include: { collection: true, notes: { orderBy: { createdAt: 'desc' } } },
    });
  }

  // Duplicate detection
  async checkDuplicate(sourceUrl: string) {
    const existing = await this.prisma.artPiece.findFirst({
      where: { sourceUrl },
      select: { id: true, title: true, sourceUrl: true },
    });
    return { duplicate: !!existing, existing };
  }

  create(dto: CreateArtPieceDto) {
    return this.prisma.artPiece.create({
      data: { ...dto, tags: dto.tags || [] },
      include: { collection: true },
    });
  }

  update(id: string, dto: UpdateArtPieceDto) {
    return this.prisma.artPiece.update({
      where: { id },
      data: dto,
      include: { collection: true },
    });
  }

  toggleFavorite(id: string) {
    return this.prisma.$queryRaw`
      UPDATE art_pieces SET "isFavorite" = NOT "isFavorite", "updatedAt" = NOW() WHERE id = ${id}
      RETURNING *
    `.then(() => this.findOne(id));
  }

  delete(id: string) {
    return this.prisma.artPiece.delete({ where: { id } });
  }

  async allTags() {
    const rows = await this.prisma.artPiece.findMany({ select: { tags: true } });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      for (const tag of row.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.artPiece.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return { success: true };
  }

  async batchDelete(ids: string[]) {
    const result = await this.prisma.artPiece.deleteMany({ where: { id: { in: ids } } });
    return { deleted: result.count };
  }

  async batchMove(ids: string[], collectionId: string | null) {
    const result = await this.prisma.artPiece.updateMany({
      where: { id: { in: ids } },
      data: { collectionId },
    });
    return { updated: result.count };
  }

  async batchTag(ids: string[], tags: string[], mode: 'add' | 'set') {
    if (mode === 'set') {
      const result = await this.prisma.artPiece.updateMany({
        where: { id: { in: ids } },
        data: { tags },
      });
      return { updated: result.count };
    }
    const pieces = await this.prisma.artPiece.findMany({
      where: { id: { in: ids } },
      select: { id: true, tags: true },
    });
    await this.prisma.$transaction(
      pieces.map((p) =>
        this.prisma.artPiece.update({
          where: { id: p.id },
          data: { tags: [...new Set([...p.tags, ...tags])] },
        }),
      ),
    );
    return { updated: pieces.length };
  }

  // Broken link checker
  async checkLinks() {
    const pieces = await this.prisma.artPiece.findMany({
      select: { id: true, title: true, sourceUrl: true, mediaType: true },
    });

    const results = await Promise.allSettled(
      pieces.map(async (p) => {
        try {
          const res = await fetch(p.sourceUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000),
            headers: { 'User-Agent': 'ArtVault/1.0' },
          });
          return { ...p, status: res.status, ok: res.ok };
        } catch (err: any) {
          return { ...p, status: 0, ok: false, error: err.message };
        }
      }),
    );

    const checked = results.map((r) => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean);
    const broken = checked.filter((c) => !c!.ok);

    return {
      total: pieces.length,
      checked: checked.length,
      broken: broken.length,
      details: broken,
    };
  }

  // Timeline: group by date
  async timeline() {
    const pieces = await this.prisma.artPiece.findMany({
      orderBy: { createdAt: 'desc' },
      include: { collection: true },
    });

    const groups: Record<string, any[]> = {};
    for (const p of pieces) {
      const date = p.createdAt.toISOString().split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(p);
    }

    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }

  async stats() {
    const [total, favorites, byType, byCollection, recent] = await Promise.all([
      this.prisma.artPiece.count(),
      this.prisma.artPiece.count({ where: { isFavorite: true } }),
      this.prisma.artPiece.groupBy({ by: ['mediaType'], _count: true }),
      this.prisma.collection.findMany({
        select: { id: true, name: true, _count: { select: { artPieces: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.artPiece.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, mediaType: true, createdAt: true },
      }),
    ]);

    return {
      total,
      favorites,
      byType: byType.reduce(
        (acc, row) => ({ ...acc, [row.mediaType]: row._count }),
        {} as Record<string, number>,
      ),
      byCollection,
      recent,
    };
  }

  // Random piece
  async random() {
    const count = await this.prisma.artPiece.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const pieces = await this.prisma.artPiece.findMany({
      skip,
      take: 1,
      include: { collection: true },
    });
    return pieces[0] || null;
  }

  // Related pieces by overlapping tags
  async related(id: string, limit = 6) {
    const piece = await this.prisma.artPiece.findUnique({
      where: { id },
      select: { tags: true },
    });
    if (!piece || piece.tags.length === 0) return [];

    return this.prisma.artPiece.findMany({
      where: {
        id: { not: id },
        tags: { hasSome: piece.tags },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { collection: true },
    });
  }

  // Daily highlight — deterministic "random" per day
  async dailyHighlight() {
    const count = await this.prisma.artPiece.count();
    if (count === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    // Simple hash of date string to pick an index
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) % count;
    }
    const pieces = await this.prisma.artPiece.findMany({
      skip: Math.abs(hash),
      take: 1,
      include: { collection: true },
    });
    return pieces[0] || null;
  }

  // Discover — shuffled list
  async discover(limit = 20) {
    const all = await this.prisma.artPiece.findMany({
      select: { id: true },
    });
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const ids = all.slice(0, limit).map((a) => a.id);
    const pieces = await this.prisma.artPiece.findMany({
      where: { id: { in: ids } },
      include: { collection: true },
    });
    // Preserve shuffle order
    return ids.map((id) => pieces.find((p) => p.id === id)).filter(Boolean);
  }

  // Pin/unpin
  togglePin(id: string) {
    return this.prisma.$queryRaw`
      UPDATE art_pieces SET "isPinned" = NOT "isPinned", "updatedAt" = NOW() WHERE id = ${id}
      RETURNING *
    `.then(() => this.findOne(id));
  }
}

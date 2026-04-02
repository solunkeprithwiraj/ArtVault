import { Injectable, ForbiddenException } from '@nestjs/common';
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

interface ReqUser {
  sub: string;
  role: string;
}

@Injectable()
export class ArtPiecesService {
  constructor(private prisma: PrismaService) {}

  private ownerFilter(user: ReqUser) {
    return user.role === 'SUPERADMIN' ? {} : { userId: user.sub };
  }

  private async assertOwner(id: string, user: ReqUser) {
    if (user.role === 'SUPERADMIN') return;
    const piece = await this.prisma.artPiece.findUnique({ where: { id }, select: { userId: true } });
    if (!piece || piece.userId !== user.sub) throw new ForbiddenException();
  }

  async findAll(opts: FindAllOptions = {}, user: ReqUser) {
    const { page = 1, limit = 20, tags, collectionId, search, mediaType, favorite, sort = 'custom', fuzzy } = opts;
    const ownership = this.ownerFilter(user);

    if (search && fuzzy) {
      const userFilter = user.role === 'SUPERADMIN' ? Prisma.sql`` : Prisma.sql`AND ap."userId" = ${user.sub}`;
      const results: any[] = await this.prisma.$queryRaw`
        SELECT ap.*, similarity(ap.title, ${search}) AS sim
        FROM art_pieces ap
        WHERE (similarity(ap.title, ${search}) > 0.1
           OR similarity(COALESCE(ap.description, ''), ${search}) > 0.1)
        ${userFilter}
        ORDER BY sim DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
      const countResult: any[] = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS total FROM art_pieces ap
        WHERE (similarity(ap.title, ${search}) > 0.1
           OR similarity(COALESCE(ap.description, ''), ${search}) > 0.1)
        ${userFilter}
      `;
      const ids = results.map((r) => r.id);
      const data = ids.length
        ? await this.prisma.artPiece.findMany({
            where: { id: { in: ids } },
            include: { collection: true },
          })
        : [];
      const ordered = ids.map((id) => data.find((d) => d.id === id)).filter(Boolean);
      return { data: ordered, total: countResult[0]?.total || 0, page, limit };
    }

    const where: Prisma.ArtPieceWhereInput = { ...ownership };
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

  async findOne(id: string, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.artPiece.findUniqueOrThrow({
      where: { id },
      include: { collection: true, notes: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async checkDuplicate(sourceUrl: string, user: ReqUser) {
    const existing = await this.prisma.artPiece.findFirst({
      where: { sourceUrl, ...this.ownerFilter(user) },
      select: { id: true, title: true, sourceUrl: true },
    });
    return { duplicate: !!existing, existing };
  }

  create(dto: CreateArtPieceDto, userId: string) {
    return this.prisma.artPiece.create({
      data: { ...dto, tags: dto.tags || [], userId },
      include: { collection: true },
    });
  }

  async update(id: string, dto: UpdateArtPieceDto, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.artPiece.update({
      where: { id },
      data: dto,
      include: { collection: true },
    });
  }

  async toggleFavorite(id: string, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.$queryRaw`
      UPDATE art_pieces SET "isFavorite" = NOT "isFavorite", "updatedAt" = NOW() WHERE id = ${id}
      RETURNING *
    `.then(() => this.findOne(id, user));
  }

  async delete(id: string, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.artPiece.delete({ where: { id } });
  }

  async allTags(user: ReqUser) {
    const rows = await this.prisma.artPiece.findMany({
      where: this.ownerFilter(user),
      select: { tags: true },
    });
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

  async reorder(ids: string[], user: ReqUser) {
    // Verify ownership of all pieces
    if (user.role !== 'SUPERADMIN') {
      const count = await this.prisma.artPiece.count({
        where: { id: { in: ids }, userId: user.sub },
      });
      if (count !== ids.length) throw new ForbiddenException();
    }
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

  async batchDelete(ids: string[], user: ReqUser) {
    const result = await this.prisma.artPiece.deleteMany({
      where: { id: { in: ids }, ...this.ownerFilter(user) },
    });
    return { deleted: result.count };
  }

  async batchMove(ids: string[], collectionId: string | null, user: ReqUser) {
    const result = await this.prisma.artPiece.updateMany({
      where: { id: { in: ids }, ...this.ownerFilter(user) },
      data: { collectionId },
    });
    return { updated: result.count };
  }

  async batchTag(ids: string[], tags: string[], mode: 'add' | 'set', user: ReqUser) {
    const ownerWhere = { id: { in: ids }, ...this.ownerFilter(user) };
    if (mode === 'set') {
      const result = await this.prisma.artPiece.updateMany({
        where: ownerWhere,
        data: { tags },
      });
      return { updated: result.count };
    }
    const pieces = await this.prisma.artPiece.findMany({
      where: ownerWhere,
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

  async checkLinks(user: ReqUser) {
    const pieces = await this.prisma.artPiece.findMany({
      where: this.ownerFilter(user),
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

  async timeline(user: ReqUser) {
    const pieces = await this.prisma.artPiece.findMany({
      where: this.ownerFilter(user),
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

  async stats(user: ReqUser) {
    const ownership = this.ownerFilter(user);
    const [total, favorites, byType, byCollection, recent] = await Promise.all([
      this.prisma.artPiece.count({ where: ownership }),
      this.prisma.artPiece.count({ where: { ...ownership, isFavorite: true } }),
      this.prisma.artPiece.groupBy({
        by: ['mediaType'],
        where: ownership,
        _count: true,
      }),
      this.prisma.collection.findMany({
        where: user.role === 'SUPERADMIN' ? {} : { userId: user.sub },
        select: { id: true, name: true, _count: { select: { artPieces: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.artPiece.findMany({
        where: ownership,
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

  async random(user: ReqUser) {
    const ownership = this.ownerFilter(user);
    const count = await this.prisma.artPiece.count({ where: ownership });
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const pieces = await this.prisma.artPiece.findMany({
      where: ownership,
      skip,
      take: 1,
      include: { collection: true },
    });
    return pieces[0] || null;
  }

  async related(id: string, user: ReqUser, limit = 6) {
    const piece = await this.prisma.artPiece.findUnique({
      where: { id },
      select: { tags: true, userId: true },
    });
    if (!piece || piece.tags.length === 0) return [];

    return this.prisma.artPiece.findMany({
      where: {
        id: { not: id },
        tags: { hasSome: piece.tags },
        ...this.ownerFilter(user),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { collection: true },
    });
  }

  async dailyHighlight(user: ReqUser) {
    const ownership = this.ownerFilter(user);
    const count = await this.prisma.artPiece.count({ where: ownership });
    if (count === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) % count;
    }
    const pieces = await this.prisma.artPiece.findMany({
      where: ownership,
      skip: Math.abs(hash),
      take: 1,
      include: { collection: true },
    });
    return pieces[0] || null;
  }

  async discover(user: ReqUser, limit = 20) {
    const ownership = this.ownerFilter(user);
    const all = await this.prisma.artPiece.findMany({
      where: ownership,
      select: { id: true },
    });
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const ids = all.slice(0, limit).map((a) => a.id);
    const pieces = await this.prisma.artPiece.findMany({
      where: { id: { in: ids } },
      include: { collection: true },
    });
    return ids.map((id) => pieces.find((p) => p.id === id)).filter(Boolean);
  }

  async togglePin(id: string, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.$queryRaw`
      UPDATE art_pieces SET "isPinned" = NOT "isPinned", "updatedAt" = NOW() WHERE id = ${id}
      RETURNING *
    `.then(() => this.findOne(id, user));
  }
}

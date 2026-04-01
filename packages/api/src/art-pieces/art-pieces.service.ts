import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MediaType } from '@prisma/client';
import { CreateArtPieceDto, UpdateArtPieceDto } from './art-pieces.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  tags?: string[];
  collectionId?: string;
  search?: string;
  mediaType?: MediaType;
  favorite?: boolean;
  sort?: string; // 'newest' | 'oldest' | 'title' | 'title_desc' | 'custom'
}

@Injectable()
export class ArtPiecesService {
  constructor(private prisma: PrismaService) {}

  findAll(opts: FindAllOptions = {}) {
    const { page = 1, limit = 20, tags, collectionId, search, mediaType, favorite, sort = 'custom' } = opts;

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
      custom: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
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
      include: { collection: true },
    });
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

  allTags() {
    return this.prisma.artPiece
      .findMany({ select: { tags: true } })
      .then((rows) => [...new Set(rows.flatMap((r) => r.tags))].sort());
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
}

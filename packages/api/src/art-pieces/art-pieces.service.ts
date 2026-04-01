import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtPieceDto, UpdateArtPieceDto } from './art-pieces.dto';

@Injectable()
export class ArtPiecesService {
  constructor(private prisma: PrismaService) {}

  findAll(page = 1, limit = 20, tag?: string, collectionId?: string) {
    const where: any = {};
    if (tag) where.tags = { has: tag };
    if (collectionId) where.collectionId = collectionId;

    return Promise.all([
      this.prisma.artPiece.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  delete(id: string) {
    return this.prisma.artPiece.delete({ where: { id } });
  }

  allTags() {
    return this.prisma.artPiece
      .findMany({ select: { tags: true } })
      .then((rows) => [...new Set(rows.flatMap((r) => r.tags))].sort());
  }
}

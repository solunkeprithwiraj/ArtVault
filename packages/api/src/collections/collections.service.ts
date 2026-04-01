import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

const PREVIEW_SELECT = {
  artPieces: {
    take: 4,
    where: { mediaType: 'IMAGE' as const },
    select: { id: true, sourceUrl: true, title: true },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.collection.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { artPieces: true, children: true } },
        parent: { select: { id: true, name: true } },
        ...PREVIEW_SELECT,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: {
        artPieces: true,
        children: {
          include: {
            _count: { select: { artPieces: true } },
            ...PREVIEW_SELECT,
          },
          orderBy: { name: 'asc' },
        },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  tree() {
    return this.prisma.collection.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { artPieces: true } },
        ...PREVIEW_SELECT,
        children: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { artPieces: true } },
            ...PREVIEW_SELECT,
            children: {
              orderBy: { name: 'asc' },
              include: {
                _count: { select: { artPieces: true } },
                ...PREVIEW_SELECT,
              },
            },
          },
        },
      },
    });
  }

  create(dto: CreateCollectionDto) {
    return this.prisma.collection.create({ data: dto });
  }

  update(id: string, dto: UpdateCollectionDto) {
    return this.prisma.collection.update({ where: { id }, data: dto });
  }

  delete(id: string) {
    return this.prisma.collection.delete({ where: { id } });
  }
}

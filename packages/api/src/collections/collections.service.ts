import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.collection.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { artPieces: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: {
        artPieces: true,
        children: {
          include: { _count: { select: { artPieces: true } } },
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
        children: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { artPieces: true } },
            children: {
              orderBy: { name: 'asc' },
              include: { _count: { select: { artPieces: true } } },
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

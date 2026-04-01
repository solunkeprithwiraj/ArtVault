import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.collection.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { artPieces: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: { artPieces: true },
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

import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

interface ReqUser {
  sub: string;
  role: string;
}

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

  private ownerFilter(user: ReqUser) {
    return user.role === 'SUPERADMIN' ? {} : { userId: user.sub };
  }

  private async assertOwner(id: string, user: ReqUser) {
    if (user.role === 'SUPERADMIN') return;
    const col = await this.prisma.collection.findUnique({ where: { id }, select: { userId: true } });
    if (!col || col.userId !== user.sub) throw new ForbiddenException();
  }

  findAll(user: ReqUser) {
    return this.prisma.collection.findMany({
      where: this.ownerFilter(user),
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { artPieces: true, children: true } },
        parent: { select: { id: true, name: true } },
        ...PREVIEW_SELECT,
      },
    });
  }

  async findOne(id: string, user: ReqUser) {
    await this.assertOwner(id, user);
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

  tree(user: ReqUser) {
    return this.prisma.collection.findMany({
      where: { parentId: null, ...this.ownerFilter(user) },
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

  create(dto: CreateCollectionDto, userId: string) {
    return this.prisma.collection.create({ data: { ...dto, userId } });
  }

  async update(id: string, dto: UpdateCollectionDto, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.collection.update({ where: { id }, data: dto });
  }

  async delete(id: string, user: ReqUser) {
    await this.assertOwner(id, user);
    return this.prisma.collection.delete({ where: { id } });
  }
}

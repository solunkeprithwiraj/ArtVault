import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

interface ReqUser {
  sub: string;
  role: string;
}

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  private async assertNoteOwner(id: string, user: ReqUser) {
    if (user.role === 'SUPERADMIN') return;
    const note = await this.prisma.note.findUnique({ where: { id }, select: { userId: true } });
    if (!note || note.userId !== user.sub) throw new ForbiddenException();
  }

  findByArtPiece(artPieceId: string, user: ReqUser) {
    const where: any = { artPieceId };
    if (user.role !== 'SUPERADMIN') where.userId = user.sub;
    return this.prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(artPieceId: string, dto: CreateNoteDto, userId: string) {
    return this.prisma.note.create({
      data: { ...dto, artPieceId, userId },
    });
  }

  async update(id: string, dto: UpdateNoteDto, user: ReqUser) {
    await this.assertNoteOwner(id, user);
    return this.prisma.note.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, user: ReqUser) {
    await this.assertNoteOwner(id, user);
    return this.prisma.note.delete({ where: { id } });
  }
}

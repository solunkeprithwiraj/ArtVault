import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  findByArtPiece(artPieceId: string) {
    return this.prisma.note.findMany({
      where: { artPieceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(artPieceId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: { ...dto, artPieceId },
    });
  }

  update(id: string, dto: UpdateNoteDto) {
    return this.prisma.note.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: string) {
    return this.prisma.note.delete({ where: { id } });
  }
}

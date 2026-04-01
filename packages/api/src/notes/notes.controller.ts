import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

@Controller('art-pieces/:artPieceId/notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get()
  findAll(@Param('artPieceId') artPieceId: string) {
    return this.service.findByArtPiece(artPieceId);
  }

  @Post()
  create(@Param('artPieceId') artPieceId: string, @Body() dto: CreateNoteDto) {
    return this.service.create(artPieceId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

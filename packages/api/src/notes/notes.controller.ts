import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

@Controller('art-pieces/:artPieceId/notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get()
  findAll(@Req() req: any, @Param('artPieceId') artPieceId: string) {
    return this.service.findByArtPiece(artPieceId, req.user);
  }

  @Post()
  create(@Req() req: any, @Param('artPieceId') artPieceId: string, @Body() dto: CreateNoteDto) {
    return this.service.create(artPieceId, dto, req.user.sub);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.user);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ArtPiecesService } from './art-pieces.service';
import { CreateArtPieceDto, UpdateArtPieceDto } from './art-pieces.dto';

@Controller('art-pieces')
export class ArtPiecesController {
  constructor(private readonly service: ArtPiecesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.service.findAll(
      page ? +page : undefined,
      limit ? +limit : undefined,
      tag,
      collectionId,
    );
  }

  @Get('tags')
  allTags() {
    return this.service.allTags();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateArtPieceDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArtPieceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

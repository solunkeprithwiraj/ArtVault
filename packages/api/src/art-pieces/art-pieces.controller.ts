import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { MediaType } from '../generated/prisma/client';
import { ArtPiecesService } from './art-pieces.service';
import { CreateArtPieceDto, UpdateArtPieceDto } from './art-pieces.dto';

@Controller('art-pieces')
export class ArtPiecesController {
  constructor(private readonly service: ArtPiecesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tags') tags?: string,
    @Query('collectionId') collectionId?: string,
    @Query('search') search?: string,
    @Query('mediaType') mediaType?: string,
    @Query('favorite') favorite?: string,
    @Query('sort') sort?: string,
  ) {
    return this.service.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      tags: tags ? tags.split(',') : undefined,
      collectionId,
      search,
      mediaType: mediaType as MediaType | undefined,
      favorite: favorite === 'true' ? true : favorite === 'false' ? false : undefined,
      sort,
    });
  }

  @Get('tags')
  allTags() {
    return this.service.allTags();
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateArtPieceDto) {
    return this.service.create(dto);
  }

  @Post('reorder')
  reorder(@Body() body: { ids: string[] }) {
    return this.service.reorder(body.ids);
  }

  @Patch(':id/favorite')
  toggleFavorite(@Param('id') id: string) {
    return this.service.toggleFavorite(id);
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

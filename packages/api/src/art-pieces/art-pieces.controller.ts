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
  Req,
} from '@nestjs/common';
import { MediaType } from '../generated/prisma/client';
import { ArtPiecesService } from './art-pieces.service';
import { CreateArtPieceDto, UpdateArtPieceDto } from './art-pieces.dto';

@Controller('art-pieces')
export class ArtPiecesController {
  constructor(private readonly service: ArtPiecesService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tags') tags?: string,
    @Query('collectionId') collectionId?: string,
    @Query('search') search?: string,
    @Query('mediaType') mediaType?: string,
    @Query('favorite') favorite?: string,
    @Query('sort') sort?: string,
    @Query('fuzzy') fuzzy?: string,
  ) {
    return this.service.findAll(
      {
        page: page ? +page : undefined,
        limit: limit ? +limit : undefined,
        tags: tags ? tags.split(',') : undefined,
        collectionId,
        search,
        mediaType: mediaType as MediaType | undefined,
        favorite: favorite === 'true' ? true : favorite === 'false' ? false : undefined,
        sort,
        fuzzy: fuzzy === 'true',
      },
      req.user,
    );
  }

  @Get('tags')
  allTags(@Req() req: any) {
    return this.service.allTags(req.user);
  }

  @Get('stats')
  stats(@Req() req: any) {
    return this.service.stats(req.user);
  }

  @Get('check-duplicate')
  checkDuplicate(@Req() req: any, @Query('url') url: string) {
    return this.service.checkDuplicate(url, req.user);
  }

  @Get('check-links')
  checkLinks(@Req() req: any) {
    return this.service.checkLinks(req.user);
  }

  @Get('random')
  random(@Req() req: any) {
    return this.service.random(req.user);
  }

  @Get('daily-highlight')
  dailyHighlight(@Req() req: any) {
    return this.service.dailyHighlight(req.user);
  }

  @Get('discover')
  discover(@Req() req: any, @Query('limit') limit?: string) {
    return this.service.discover(req.user, limit ? +limit : undefined);
  }

  @Get('timeline')
  timeline(@Req() req: any) {
    return this.service.timeline(req.user);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateArtPieceDto) {
    return this.service.create(dto, req.user.sub);
  }

  @Post('reorder')
  reorder(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.service.reorder(body.ids, req.user);
  }

  @Post('batch/delete')
  batchDelete(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.service.batchDelete(body.ids, req.user);
  }

  @Post('batch/move')
  batchMove(@Req() req: any, @Body() body: { ids: string[]; collectionId: string | null }) {
    return this.service.batchMove(body.ids, body.collectionId, req.user);
  }

  @Post('batch/tag')
  batchTag(@Req() req: any, @Body() body: { ids: string[]; tags: string[]; mode: 'add' | 'set' }) {
    return this.service.batchTag(body.ids, body.tags, body.mode, req.user);
  }

  @Get(':id/related')
  related(@Req() req: any, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.service.related(id, req.user, limit ? +limit : undefined);
  }

  @Patch(':id/pin')
  togglePin(@Req() req: any, @Param('id') id: string) {
    return this.service.togglePin(id, req.user);
  }

  @Patch(':id/favorite')
  toggleFavorite(@Req() req: any, @Param('id') id: string) {
    return this.service.toggleFavorite(id, req.user);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateArtPieceDto) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.user);
  }
}

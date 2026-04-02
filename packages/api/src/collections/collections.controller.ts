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
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly service: CollectionsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get('tree')
  tree(@Req() req: any) {
    return this.service.tree(req.user);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCollectionDto) {
    return this.service.create(dto, req.user.sub);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.user);
  }
}

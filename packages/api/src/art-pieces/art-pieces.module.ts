import { Module } from '@nestjs/common';
import { ArtPiecesController } from './art-pieces.controller';
import { ArtPiecesService } from './art-pieces.service';

@Module({
  controllers: [ArtPiecesController],
  providers: [ArtPiecesService],
})
export class ArtPiecesModule {}

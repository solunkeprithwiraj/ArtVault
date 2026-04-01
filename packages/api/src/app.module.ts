import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ArtPiecesModule } from './art-pieces/art-pieces.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [PrismaModule, ArtPiecesModule, CollectionsModule],
})
export class AppModule {}

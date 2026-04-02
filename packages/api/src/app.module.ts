import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ArtPiecesModule } from './art-pieces/art-pieces.module';
import { CollectionsModule } from './collections/collections.module';
import { NotesModule } from './notes/notes.module';
import { ProxyModule } from './proxy/proxy.module';
import { ScrapeModule } from './scrape/scrape.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 20 },
        { name: 'medium', ttl: 60000, limit: 100 },
      ],
    }),
    PrismaModule,
    AuthModule,
    ArtPiecesModule,
    CollectionsModule,
    NotesModule,
    ProxyModule,
    ScrapeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

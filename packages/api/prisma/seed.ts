import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Superadmin User ---
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(password, 10);
  let adminUser = await prisma.user.findUnique({ where: { username } });
  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { username },
      data: { passwordHash, role: 'SUPERADMIN' },
    });
    console.log(`Superadmin "${username}" updated.`);
  } else {
    adminUser = await prisma.user.create({
      data: { username, passwordHash, role: 'SUPERADMIN' },
    });
    console.log(`Superadmin "${username}" created with password "${password}"`);
  }

  const userId = adminUser.id;

  await prisma.note.deleteMany();
  await prisma.artPiece.deleteMany();
  await prisma.collection.deleteMany();
  console.log('Cleared existing data');

  // --- Collections (nested) ---
  const classics = await prisma.collection.create({ data: { userId, name: 'Classic Art', description: 'Masterpieces from art history' } });
  const classicsPaintings = await prisma.collection.create({ data: { userId, name: 'Classic Paintings', description: 'Oil and canvas masterworks', parentId: classics.id } });
  const classicsJapanese = await prisma.collection.create({ data: { userId, name: 'Japanese Art', description: 'Woodblock prints and traditional art', parentId: classics.id } });
  const modernArt = await prisma.collection.create({ data: { userId, name: 'Modern Art', description: 'Contemporary and modern artworks' } });
  const photography = await prisma.collection.create({ data: { userId, name: 'Photography', description: 'Stunning photographs' } });
  const musicVideos = await prisma.collection.create({ data: { userId, name: 'Music & Videos', description: 'Lofi, ambient, and creative video content' } });
  const inspiration = await prisma.collection.create({ data: { userId, name: 'Inspiration Board', description: 'Visual inspiration' } });
  console.log('Collections created');

  const starryNight = await prisma.artPiece.create({
    data: { userId,
      title: 'Starry Night Vibes',
      description: 'A dreamy night sky composition inspired by post-impressionism',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/starry/800/600',
      tags: ['painting', 'classic', 'night', 'post-impressionism'],
      collectionId: classicsPaintings.id,
      isFavorite: true, isPinned: true, sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Renaissance Portrait',
      description: 'A classical portrait study in the style of the old masters',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/portrait/800/1000',
      tags: ['painting', 'classic', 'renaissance', 'portrait'],
      collectionId: classicsPaintings.id,
      isFavorite: true, sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Surreal Dreamscape',
      description: 'A surrealist landscape with melting forms and distorted reality',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/surreal/900/600',
      tags: ['painting', 'surrealism', 'modern', 'dreamscape'],
      collectionId: modernArt.id,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Dutch Golden Age Study',
      description: 'Rich colors and dramatic lighting in the style of Vermeer',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/dutch/700/900',
      tags: ['painting', 'classic', 'portrait', 'dutch', 'baroque'],
      collectionId: classicsPaintings.id,
      sortOrder: 2,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Mythological Scene',
      description: 'A grand composition depicting gods and mortals',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/mythology/1200/700',
      tags: ['painting', 'classic', 'renaissance', 'mythology'],
      collectionId: classicsPaintings.id,
      sortOrder: 3,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Ocean Wave',
      description: 'Powerful waves crashing — inspired by ukiyo-e woodblock prints',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/wave/1000/700',
      tags: ['painting', 'japanese', 'classic', 'woodblock', 'wave', 'ocean'],
      collectionId: classicsJapanese.id,
      isFavorite: true, sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Mountain Serenity',
      description: 'A tranquil mountain landscape in the Japanese tradition',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/fuji/1000/600',
      tags: ['painting', 'japanese', 'classic', 'mountain', 'landscape'],
      collectionId: classicsJapanese.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Abstract Geometry',
      description: 'Bold geometric shapes and primary colors',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/abstract/900/700',
      tags: ['painting', 'abstract', 'modern', 'geometric'],
      collectionId: modernArt.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Pop Art Explosion',
      description: 'Bright, bold, commercial — the essence of pop art',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/popart/800/800',
      tags: ['painting', 'pop-art', 'modern', 'iconic', 'colorful'],
      collectionId: modernArt.id,
      sortOrder: 2,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Earth from Space',
      description: 'Our blue marble floating in the cosmic void',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/earth/1000/1000',
      tags: ['photography', 'space', 'earth', 'iconic'],
      collectionId: photography.id,
      isFavorite: true, sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Nebula Colors',
      description: 'Vibrant gas clouds in deep space',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/nebula/900/900',
      tags: ['photography', 'space', 'nebula', 'colorful'],
      collectionId: photography.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Street Portrait',
      description: 'Raw emotion captured on the streets',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/streetportrait/700/900',
      tags: ['photography', 'portrait', 'street', 'human'],
      collectionId: photography.id,
      sortOrder: 2,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Lofi Girl - beats to relax/study to',
      description: 'The iconic 24/7 lofi hip hop stream',
      mediaType: 'IFRAME',
      sourceUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      tags: ['music', 'lofi', 'chill', 'study'],
      collectionId: musicVideos.id,
      isFavorite: true, sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Studio Ghibli Piano Collection',
      description: 'Beautiful piano arrangements from Studio Ghibli films',
      mediaType: 'IFRAME',
      sourceUrl: 'https://www.youtube.com/embed/3jWRrafhO7M',
      tags: ['music', 'piano', 'ghibli', 'anime', 'relaxing'],
      collectionId: musicVideos.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Satisfying Art Compilation',
      description: 'Mesmerizing abstract art and paint pouring',
      mediaType: 'IFRAME',
      sourceUrl: 'https://www.youtube.com/embed/67oBbpyE9Xg',
      tags: ['video', 'abstract', 'satisfying', 'art-process'],
      collectionId: musicVideos.id,
      sortOrder: 2,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Minimalist Design',
      description: 'Clean lines and purposeful negative space',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/minimalist/800/600',
      tags: ['design', 'minimalist', 'typography', 'modern'],
      collectionId: inspiration.id,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Nature Patterns',
      description: 'Mathematical beauty found in natural forms',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/fibonacci/900/900',
      tags: ['photography', 'nature', 'mathematics', 'pattern'],
      collectionId: inspiration.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Neon City Nights',
      description: 'Electric neon-lit streets in a futuristic cityscape',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/cyberpunk/1200/700',
      tags: ['digital-art', 'cyberpunk', 'city', 'neon', 'futuristic'],
      collectionId: inspiration.id,
      isPinned: true, sortOrder: 2,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Water Garden',
      description: 'Peaceful lily pond with reflections of sky and trees',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/waterlily/1000/700',
      tags: ['painting', 'classic', 'impressionism', 'nature', 'water'],
      isFavorite: true,
    },
  });

  await prisma.artPiece.create({
    data: { userId,
      title: 'Existential Scream',
      description: 'Raw emotional expression — anxiety and dread made visible',
      mediaType: 'IMAGE',
      sourceUrl: 'https://picsum.photos/seed/scream/700/900',
      tags: ['painting', 'expressionism', 'iconic', 'classic', 'emotion'],
    },
  });
  console.log('Art pieces created');

  await prisma.note.createMany({
    data: [
      { artPieceId: starryNight.id, userId, content: 'The swirling patterns create incredible visual movement' },
      { artPieceId: starryNight.id, userId, content: 'Reference this style for the portfolio header animation' },
      { artPieceId: starryNight.id, userId, content: 'Color palette: deep blues, bright yellows, warm whites' },
    ],
  });
  console.log('Notes created');

  const counts = {
    users: await prisma.user.count(),
    collections: await prisma.collection.count(),
    artPieces: await prisma.artPiece.count(),
    notes: await prisma.note.count(),
    favorites: await prisma.artPiece.count({ where: { isFavorite: true } }),
    pinned: await prisma.artPiece.count({ where: { isPinned: true } }),
  };

  console.log('\nSeed complete!');
  console.log(`  ${counts.users} user(s)`);
  console.log(`  ${counts.collections} collections (with nested sub-collections)`);
  console.log(`  ${counts.artPieces} art pieces (images, embeds)`);
  console.log(`  ${counts.notes} notes`);
  console.log(`  ${counts.favorites} favorites`);
  console.log(`  ${counts.pinned} pinned`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());

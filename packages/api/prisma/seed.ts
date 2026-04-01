import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.note.deleteMany();
  await prisma.artPiece.deleteMany();
  await prisma.collection.deleteMany();

  console.log('Cleared existing data');

  // --- Collections (nested) ---
  const classics = await prisma.collection.create({
    data: {
      name: 'Classic Art',
      description: 'Masterpieces from art history',
    },
  });

  const classicsPaintings = await prisma.collection.create({
    data: {
      name: 'Classic Paintings',
      description: 'Oil and canvas masterworks',
      parentId: classics.id,
    },
  });

  const classicsJapanese = await prisma.collection.create({
    data: {
      name: 'Japanese Art',
      description: 'Woodblock prints and traditional Japanese art',
      parentId: classics.id,
    },
  });

  const modernArt = await prisma.collection.create({
    data: {
      name: 'Modern Art',
      description: 'Contemporary and modern artworks',
    },
  });

  const photography = await prisma.collection.create({
    data: {
      name: 'Photography',
      description: 'Stunning photographs from around the world',
    },
  });

  const musicVideos = await prisma.collection.create({
    data: {
      name: 'Music & Videos',
      description: 'Lofi, ambient, and creative video content',
    },
  });

  const inspiration = await prisma.collection.create({
    data: {
      name: 'Inspiration Board',
      description: 'Random bits of visual inspiration',
    },
  });

  console.log('Collections created');

  // --- Art Pieces ---

  // Classic Paintings
  const starryNight = await prisma.artPiece.create({
    data: {
      title: 'The Starry Night - Van Gogh',
      description: 'One of the most recognized paintings in Western art. Painted in June 1889, depicting the view from his asylum room at Saint-Rémy-de-Provence.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
      tags: ['painting', 'classic', 'van-gogh', 'post-impressionism', 'night'],
      collectionId: classicsPaintings.id,
      isFavorite: true,
      isPinned: true,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Mona Lisa - Leonardo da Vinci',
      description: 'The most famous portrait in art history. Painted between 1503 and 1519.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
      tags: ['painting', 'classic', 'da-vinci', 'renaissance', 'portrait'],
      collectionId: classicsPaintings.id,
      isFavorite: true,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'The Persistence of Memory - Salvador Dalí',
      description: 'Surrealist masterpiece with melting clocks. Painted in 1931.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg',
      tags: ['painting', 'surrealism', 'dali', 'modern'],
      collectionId: modernArt.id,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Girl with a Pearl Earring - Vermeer',
      description: 'Often called the "Mona Lisa of the North". Painted circa 1665.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg',
      tags: ['painting', 'classic', 'vermeer', 'portrait', 'dutch'],
      collectionId: classicsPaintings.id,
      sortOrder: 2,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'The Birth of Venus - Botticelli',
      description: 'Depicts the goddess Venus arriving at the shore. Painted mid-1480s.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/1280px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',
      tags: ['painting', 'classic', 'botticelli', 'renaissance', 'mythology'],
      collectionId: classicsPaintings.id,
      sortOrder: 3,
    },
  });

  // Japanese Art
  await prisma.artPiece.create({
    data: {
      title: 'The Great Wave off Kanagawa - Hokusai',
      description: 'Iconic woodblock print from the series Thirty-six Views of Mount Fuji. Created between 1829 and 1833.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg',
      tags: ['painting', 'japanese', 'classic', 'hokusai', 'woodblock', 'wave'],
      collectionId: classicsJapanese.id,
      isFavorite: true,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Red Fuji - Hokusai',
      description: 'Fine Wind, Clear Morning. Part of Thirty-six Views of Mount Fuji.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Red_Fuji_southern_wind_clear_morning.jpg/1280px-Red_Fuji_southern_wind_clear_morning.jpg',
      tags: ['painting', 'japanese', 'classic', 'hokusai', 'woodblock', 'fuji'],
      collectionId: classicsJapanese.id,
      sortOrder: 1,
    },
  });

  // Modern Art
  await prisma.artPiece.create({
    data: {
      title: 'Composition VIII - Kandinsky',
      description: 'Abstract geometric composition. Painted in 1923.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg/1280px-Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg',
      tags: ['painting', 'abstract', 'kandinsky', 'modern', 'geometric'],
      collectionId: modernArt.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Campbell\'s Soup Cans - Andy Warhol',
      description: 'Iconic pop art piece produced in 1962.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/en/9/95/Campbell%27s_Soup_Cans_MOMA_reduced_80%25.jpg',
      tags: ['painting', 'pop-art', 'warhol', 'modern', 'iconic'],
      collectionId: modernArt.id,
      sortOrder: 2,
    },
  });

  // Photography
  await prisma.artPiece.create({
    data: {
      title: 'Earthrise - NASA',
      description: 'Taken by astronaut William Anders during Apollo 8 in 1968. One of the most influential photos ever taken.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/NASA-Apollo8-Dec24-Earthrise.jpg/1280px-NASA-Apollo8-Dec24-Earthrise.jpg',
      tags: ['photography', 'space', 'nasa', 'earth', 'iconic'],
      collectionId: photography.id,
      isFavorite: true,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Pillars of Creation - Hubble',
      description: 'Iconic image of interstellar gas and dust in the Eagle Nebula taken by Hubble Space Telescope.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg/800px-Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg',
      tags: ['photography', 'space', 'nasa', 'nebula', 'hubble'],
      collectionId: photography.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Afghan Girl - Steve McCurry',
      description: 'Sharbat Gula photographed in 1984 at Nasir Bagh refugee camp. Published on National Geographic cover.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Sharbat_Gula.jpg',
      tags: ['photography', 'portrait', 'national-geographic', 'iconic'],
      collectionId: photography.id,
      sortOrder: 2,
    },
  });

  // Music & Videos (embeds)
  await prisma.artPiece.create({
    data: {
      title: 'Lofi Girl - beats to relax/study to',
      description: 'The iconic 24/7 lofi hip hop stream',
      mediaType: 'IFRAME',
      sourceUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      tags: ['music', 'lofi', 'chill', 'study'],
      collectionId: musicVideos.id,
      isFavorite: true,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: {
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
    data: {
      title: 'Abstract Satisfying Art Compilation',
      description: 'Mesmerizing abstract art and paint pouring',
      mediaType: 'IFRAME',
      sourceUrl: 'https://www.youtube.com/embed/67oBbpyE9Xg',
      tags: ['video', 'abstract', 'satisfying', 'art-process'],
      collectionId: musicVideos.id,
      sortOrder: 2,
    },
  });

  // Inspiration (unassigned / loose pieces)
  await prisma.artPiece.create({
    data: {
      title: 'Vintage Bauhaus Poster',
      description: 'Classic Bauhaus design movement poster from 1923',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Bauhaus_logo.svg/800px-Bauhaus_logo.svg.png',
      tags: ['design', 'bauhaus', 'poster', 'typography', 'vintage'],
      collectionId: inspiration.id,
      sortOrder: 0,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Fibonacci Spiral in Nature',
      description: 'The golden ratio appearing in a nautilus shell cross-section',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/NautilusCutawayLogarithmicSpiral.jpg/1024px-NautilusCutawayLogarithmicSpiral.jpg',
      tags: ['photography', 'nature', 'mathematics', 'fibonacci', 'spiral'],
      collectionId: inspiration.id,
      sortOrder: 1,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'Cyberpunk City Concept Art',
      description: 'Futuristic neon-lit cityscape digital art',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Akihabara_at_night.jpg/1280px-Akihabara_at_night.jpg',
      tags: ['digital-art', 'cyberpunk', 'city', 'neon', 'futuristic'],
      collectionId: inspiration.id,
      isPinned: true,
      sortOrder: 2,
    },
  });

  // A piece with no collection (loose)
  await prisma.artPiece.create({
    data: {
      title: 'Water Lilies - Claude Monet',
      description: 'Part of a series of approximately 250 oil paintings. The pinnacle of Impressionism.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Chicago.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Chicago.jpg',
      tags: ['painting', 'classic', 'monet', 'impressionism', 'nature'],
      isFavorite: true,
    },
  });

  await prisma.artPiece.create({
    data: {
      title: 'The Scream - Edvard Munch',
      description: 'Expressionist masterpiece. Created in 1893.',
      mediaType: 'IMAGE',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg',
      tags: ['painting', 'expressionism', 'munch', 'iconic', 'classic'],
    },
  });

  console.log('Art pieces created');

  // --- Notes ---
  await prisma.note.createMany({
    data: [
      {
        artPieceId: starryNight.id,
        content: 'The swirling sky is incredible — notice how the brushstrokes create movement',
      },
      {
        artPieceId: starryNight.id,
        content: 'Van Gogh painted this from memory during daytime. The village is fictional.',
      },
      {
        artPieceId: starryNight.id,
        content: 'Reference this style for the header animation on the portfolio site',
      },
    ],
  });

  console.log('Notes created');

  // Print summary
  const counts = {
    collections: await prisma.collection.count(),
    artPieces: await prisma.artPiece.count(),
    notes: await prisma.note.count(),
    favorites: await prisma.artPiece.count({ where: { isFavorite: true } }),
    pinned: await prisma.artPiece.count({ where: { isPinned: true } }),
  };

  console.log('\nSeed complete!');
  console.log(`  ${counts.collections} collections (with nested sub-collections)`);
  console.log(`  ${counts.artPieces} art pieces (images, embeds, videos)`);
  console.log(`  ${counts.notes} notes`);
  console.log(`  ${counts.favorites} favorites`);
  console.log(`  ${counts.pinned} pinned`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

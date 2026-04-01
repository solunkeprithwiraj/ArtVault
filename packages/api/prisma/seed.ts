import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const collection = await prisma.collection.create({
    data: {
      name: 'Inspiration',
      description: 'A curated collection of inspiring art and media',
    },
  });

  await prisma.artPiece.createMany({
    data: [
      {
        title: 'Starry Night - Van Gogh',
        description: 'One of the most recognized paintings in Western art',
        mediaType: 'IMAGE',
        sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
        tags: ['painting', 'classic', 'van-gogh'],
        collectionId: collection.id,
      },
      {
        title: 'The Great Wave off Kanagawa',
        description: 'Woodblock print by Hokusai',
        mediaType: 'IMAGE',
        sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg',
        tags: ['painting', 'japanese', 'classic'],
        collectionId: collection.id,
      },
      {
        title: 'Lofi Girl - Study Session',
        mediaType: 'IFRAME',
        sourceUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
        tags: ['music', 'lofi', 'video'],
      },
    ],
  });

  console.log('Seed data created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库 seeding...');

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      bio: '网站管理员',
    },
  });
  console.log('创建管理员用户:', admin.email);

  // 创建示例用户
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      username: 'manga_lover',
      password: hashedPassword,
      role: 'USER',
      bio: '漫画爱好者',
    },
  });
  console.log('创建示例用户:', user1.email);

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      username: 'color_master',
      password: hashedPassword,
      role: 'USER',
      bio: '上色大师',
    },
  });
  console.log('创建示例用户:', user2.email);

  // 创建示例作品
  const sampleArtworks = [
    {
      title: '夏日海滩',
      description: '一个阳光明媚的夏日海滩场景',
      coverImage: '/samples/beach_cover.jpg',
      originalImage: '/samples/beach_original.jpg',
      tags: ['海滩', '夏日', '风景'],
      isFeatured: true,
    },
    {
      title: '樱花树下',
      description: '春天樱花盛开的美丽场景',
      coverImage: '/samples/sakura_cover.jpg',
      originalImage: '/samples/sakura_original.jpg',
      tags: ['樱花', '春天', '浪漫'],
      isFeatured: true,
    },
    {
      title: '都市夜景',
      description: '繁华都市的璀璨夜景',
      coverImage: '/samples/city_cover.jpg',
      originalImage: '/samples/city_original.jpg',
      tags: ['城市', '夜景', '现代'],
      isFeatured: false,
    },
    {
      title: '森林小径',
      description: '幽静的森林中的小路',
      coverImage: '/samples/forest_cover.jpg',
      originalImage: '/samples/forest_original.jpg',
      tags: ['森林', '自然', '宁静'],
      isFeatured: false,
    },
    {
      title: '雪国风光',
      description: '白雪皑皑的冬季景色',
      coverImage: '/samples/snow_cover.jpg',
      originalImage: '/samples/snow_original.jpg',
      tags: ['雪景', '冬季', '纯净'],
      isFeatured: true,
    },
    {
      title: '古风建筑',
      description: '传统古风建筑',
      coverImage: '/samples/ancient_cover.jpg',
      originalImage: '/samples/ancient_original.jpg',
      tags: ['古风', '建筑', '传统'],
      isFeatured: false,
    },
  ];

  for (const artwork of sampleArtworks) {
    const created = await prisma.artwork.create({
      data: {
        ...artwork,
        status: 'COMPLETED',
        views: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 500) + 50,
        userId: user1.id,
      },
    });
    console.log('创建示例作品:', created.title);

    // 创建上色结果
    await prisma.colorization.create({
      data: {
        colorizedImage: artwork.coverImage.replace('_cover', '_colorized'),
        version: 1,
        progress: 100,
        status: 'COMPLETED',
        artworkId: created.id,
        userId: user1.id,
        processingTime: Math.floor(Math.random() * 30000) + 10000,
      },
    });
  }

  console.log('Seeding 完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

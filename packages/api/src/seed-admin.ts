import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

async function seedAdmin() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({ where: { username } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, passwordHash, role: 'SUPERADMIN' },
    });
    console.log(`Superadmin "${username}" created.`);
  } else {
    console.log(`Superadmin "${username}" already exists.`);
  }

  await pool.end();
}

seedAdmin().catch((e) => {
  console.error('Failed to seed admin:', e);
  process.exit(1);
});

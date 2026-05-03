import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // 預設管理員 admin / dingli123
  const username = 'admin';
  const defaultPwd = 'dingli123';
  const hash = await bcrypt.hash(defaultPwd, 10);

  const exists = await prisma.admin.findUnique({ where: { username } });
  if (!exists) {
    await prisma.admin.create({
      data: { username, passwordHash: hash, displayName: '系統管理員' },
    });
    console.log(`✓ 已建立預設管理員：${username} / ${defaultPwd}`);
  } else {
    console.log('• 管理員已存在，跳過建立');
  }

  // Hero 預設設定
  const settings = await prisma.heroSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.heroSettings.create({ data: { id: 1, intervalSec: 5 } });
    console.log('✓ 已建立 Hero 預設設定');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

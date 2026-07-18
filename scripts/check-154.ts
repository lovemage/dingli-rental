import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const id = Number(process.argv[2] || 154);
  const p = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      title: true,
      featured: true,
      status: true,
      listingStatus: true,
      createdAt: true,
      updatedAt: true,
      inactiveAt: true,
      relistedAt: true,
    },
  });
  console.log(`#${id}:`, JSON.stringify(p, null, 2));

  if (!p) return;

  const peers = await prisma.property.findMany({
    where: { featured: p.featured, status: 'active' },
    select: {
      id: true,
      code: true,
      title: true,
      featured: true,
      relistedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 12,
  });
  console.log(`\nTop 12 peers (featured=${p.featured}, status=active, by updatedAt desc):`);
  for (const r of peers) {
    const marker = r.id === id ? ` <-- #${id}` : '';
    console.log(
      `  id=${r.id} code=${r.code ?? '-'} relistedAt=${r.relistedAt?.toISOString() ?? 'null'} updatedAt=${r.updatedAt.toISOString()} createdAt=${r.createdAt.toISOString()} title="${r.title}"${marker}`,
    );
  }
}

main().finally(() => prisma.$disconnect());

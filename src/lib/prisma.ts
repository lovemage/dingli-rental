import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is missing. Please set it in your .env file.');
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('DATABASE_URL is invalid. Expected a valid PostgreSQL URL.');
  }

  if (parsed.hostname === 'host') {
    throw new Error(
      'DATABASE_URL is using placeholder hostname "host". Replace it with your actual database host.'
    );
  }

  return raw;
}

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // 屋主姓名／電話只給後台：預設不查出，公開 API 與前台頁面不會外洩。
    // 後台需要時以 `omit: OWNER_FIELDS_INCLUDE` 明確取回。
    omit: { property: { ownerName: true, ownerPhone: true } },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

/** 後台查詢物件時帶回屋主欄位：prisma.property.findUnique({ ..., omit: OWNER_FIELDS_INCLUDE }) */
export const OWNER_FIELDS_INCLUDE = { ownerName: false, ownerPhone: false } as const;

globalForPrisma.prisma = prisma;

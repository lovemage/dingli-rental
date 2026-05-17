import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { routing } from '@/i18n/routing';

// Render at request time so the property list reflects current DB state;
// without this, Vercel builds the sitemap statically and gets an empty list.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com'
).replace(/\/$/, '');

const LOCALES = routing.locales;
const DEFAULT_LOCALE = routing.defaultLocale;

function localePath(locale: string, path: string): string {
  if (locale === DEFAULT_LOCALE) return path === '/' ? '' : path;
  const suffix = path === '/' ? '' : path;
  return `/${locale}${suffix}`;
}

function abs(locale: string, path: string): string {
  return `${SITE_URL}${localePath(locale, path)}`;
}

function alternates(path: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, abs(l, path)]));
}

type StaticEntry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
};

// 權重對應使用者指定：首頁 / 關於(/services) / 物件列表 / 人才招募 為核心頁
const STATIC_PAGES: StaticEntry[] = [
  { path: '/',          priority: 1.0, changeFrequency: 'daily'   },
  { path: '/services',  priority: 0.9, changeFrequency: 'monthly' },
  { path: '/properties',priority: 0.9, changeFrequency: 'daily'   },
  { path: '/careers',   priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact',   priority: 0.6, changeFrequency: 'yearly'  },
  { path: '/privacy',   priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/terms',     priority: 0.3, changeFrequency: 'yearly'  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: abs(locale, entry.path),
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: { languages: alternates(entry.path) },
    })),
  );

  let properties: Array<{ id: number; updatedAt: Date }> = [];
  try {
    properties = await prisma.property.findMany({
      where: { status: 'active' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  } catch {
    properties = [];
  }

  const propertyEntries: MetadataRoute.Sitemap = properties.flatMap((p) =>
    LOCALES.map((locale) => ({
      url: abs(locale, `/properties/${p.id}`),
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: { languages: alternates(`/properties/${p.id}`) },
    })),
  );

  return [...staticEntries, ...propertyEntries];
}

import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import HtmlLangSetter from '@/components/frontend/HtmlLangSetter';
import FloatingCta from '@/components/frontend/FloatingCta';
import AnnouncementBar from '@/components/frontend/AnnouncementBar';
import { prisma } from '@/lib/prisma';
import {
  FLOATING_CTA_DEFAULTS,
  type FloatingCtaContent,
} from '@/data/floating-cta-defaults';
import {
  ANNOUNCEMENT_DEFAULTS,
  type AnnouncementSettings,
} from '@/data/announcement-defaults';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com'
    ),
    title: {
      default: t('defaultTitle'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    openGraph: {
      type: 'website',
      locale:
        locale === 'en' ? 'en_US' : locale === 'ja' ? 'ja_JP' : 'zh_TW',
      siteName: t('siteName'),
    },
  };
}

async function getFloatingCta(): Promise<FloatingCtaContent> {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { section: 'floating_cta' },
    });
    return {
      ...FLOATING_CTA_DEFAULTS,
      ...((row?.data as Partial<FloatingCtaContent>) || {}),
    };
  } catch {
    return FLOATING_CTA_DEFAULTS;
  }
}

async function getAnnouncement(): Promise<AnnouncementSettings> {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { section: 'announcement' },
    });
    return {
      ...ANNOUNCEMENT_DEFAULTS,
      ...((row?.data as Partial<AnnouncementSettings>) || {}),
    };
  } catch {
    return ANNOUNCEMENT_DEFAULTS;
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  const [floatingCta, announcement] = await Promise.all([
    getFloatingCta(),
    getAnnouncement(),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSetter locale={locale} />
      <AnnouncementBar settings={announcement} />
      {children}
      <FloatingCta config={floatingCta} />
    </NextIntlClientProvider>
  );
}

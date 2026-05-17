import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { CONTACT_DEFAULTS, type ContactContent, type ContactSocial } from '@/data/contact-defaults';

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

// 社群連結讀 contact_page section（admin 在聯絡頁面 → 社群連結設定）。
// URL 不需要翻譯，所有 locale 共用同一份。
async function getSocialLinks(): Promise<ContactSocial> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'contact_page' } });
    const data = (row?.data as Partial<ContactContent>) || {};
    return { ...CONTACT_DEFAULTS.social, ...(data.social || {}) };
  } catch {
    return CONTACT_DEFAULTS.social;
  }
}

const SOCIAL_META: Array<{
  key: keyof ContactSocial;
  label: string;
  icon: string;
}> = [
  { key: 'instagram', label: 'Instagram', icon: '/social-icons/Instagram.svg' },
  { key: 'facebook', label: 'Facebook', icon: '/social-icons/Facebook.svg' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '/social-icons/WhatsApp.svg' },
];

// 只放行 http(s) 絕對網址，過濾掉 admin 打錯 (facebook.com/... 沒前綴)、
// 也擋掉 javascript: / data: 等危險 scheme。回傳 null → 該 icon 不渲染。
function safeSocialUrl(raw: string | undefined): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default async function Footer() {
  const t = await getTranslations('footer');
  const locale = await getLocale();
  const lp = (p: string) => localePath(locale, p);
  const social = await getSocialLinks();
  const socialItems = SOCIAL_META
    .map((m) => ({ ...m, url: safeSocialUrl(social[m.key]) }))
    .filter((m): m is typeof m & { url: string } => m.url !== null);

  return (
    <footer className="bg-ink-900 text-white/75 pt-16 pb-8">
      <div className="container-page">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Image
              src="/LOGO_0.png"
              alt="鼎立租售管理"
              width={387}
              height={44}
              unoptimized
              className="w-full max-w-[260px] h-auto object-contain mb-4"
            />
            <p className="text-sm text-white/60 max-w-xs leading-relaxed">{t('tagline')}</p>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-4">{t('categoriesHeading')}</h5>
            <ul className="space-y-2 text-sm text-white/65 list-none p-0 m-0">
              <li>
                <Link href={lp('/properties?type=整層住家')} className="hover:text-brand-orange-300">
                  {t('categoryWholeFloor')}
                </Link>
              </li>
              <li>
                <Link href={lp('/properties?type=套房')} className="hover:text-brand-orange-300">
                  {t('categoryStudio')}
                </Link>
              </li>
              <li>
                <Link href={lp('/properties?type=店面')} className="hover:text-brand-orange-300">
                  {t('categoryShop')}
                </Link>
              </li>
              <li>
                <Link href={lp('/properties')} className="hover:text-brand-orange-300">
                  {t('categoryAll')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-4">{t('aboutHeading')}</h5>
            <ul className="space-y-2 text-sm text-white/65 list-none p-0 m-0">
              <li>
                <Link href={lp('/services')} className="hover:text-brand-orange-300">
                  {t('linkServices')}
                </Link>
              </li>
              <li>
                <Link href={lp('/careers')} className="hover:text-brand-orange-300">
                  {t('linkCareers')}
                </Link>
              </li>
              <li>
                <Link href={lp('/contact')} className="hover:text-brand-orange-300">
                  {t('linkContact')}
                </Link>
              </li>
            </ul>
            {socialItems.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                {socialItems.map(({ key, label, icon, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="inline-flex items-center justify-center hover:scale-110 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon} alt="" className="w-9 h-9" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-4">{t('contactInfoHeading')}</h5>
            <p className="text-sm text-white/65 mb-2">
              {t('addressLabel')}
              <br />
              {t('addressValue')}
            </p>
            <p className="text-sm text-white/65 mb-2">
              {t('emailLabel')}
              <br />
              <a
                href="mailto:service@dingli-rental.com"
                className="hover:text-brand-orange-300"
              >
                service@dingli-rental.com
              </a>
            </p>
            <p className="text-sm text-white/65">
              {t('hoursLabel')}
              <br />
              {t('hoursValue')}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <span>{t('copyright')}</span>
          <span className="flex gap-4">
            <Link href={lp('/privacy')} className="hover:text-brand-orange-300">
              {t('privacy')}
            </Link>
            <Link href={lp('/terms')} className="hover:text-brand-orange-300">
              {t('terms')}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

export default async function Footer() {
  const t = await getTranslations('footer');
  const locale = await getLocale();
  const lp = (p: string) => localePath(locale, p);

  return (
    <footer className="bg-ink-900 text-white/75 pt-16 pb-8">
      <div className="container-page">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Image
              src="/LOGO_0.png"
              alt="鼎立租售管理"
              width={200}
              height={40}
              className="h-12 w-auto mb-4"
              style={{ width: 'auto' }}
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
                <Link href={lp('/properties?type=獨立套房')} className="hover:text-brand-orange-300">
                  {t('categoryStudio')}
                </Link>
              </li>
              <li>
                <Link href={lp('/properties?type=分租套房')} className="hover:text-brand-orange-300">
                  {t('categorySharedSuite')}
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

        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-xs text-white/50">
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

import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale, locale: explicitLocale }) => {
  // getTranslations({ locale }) 明確指定時優先（例：後台 PDF 匯出頁不在 [locale] 路由下）
  const requested = explicitLocale ?? (await requestLocale);
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

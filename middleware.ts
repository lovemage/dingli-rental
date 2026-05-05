import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 排除 api / admin / _next / 靜態資源；其餘走 i18n middleware
  matcher: ['/((?!api|admin|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|images|uploads|.*\\..*).*)'],
};

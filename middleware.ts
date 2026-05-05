import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * 包一層 middleware，修正 Railway / 反向代理 環境下的 redirect Location header。
 *
 * next-intl 內部會用 `new URL(target, req.url)` 產生絕對 redirect URL；當 Next.js
 * 跑在反向代理後（Railway 的 internal port 8080）時，req.url 是 http://localhost:8080，
 * 導致 Location header 變成 https://dingli-rental.com:8080/... 觸發 SSL_PROTOCOL_ERROR。
 *
 * 解法：把 Location 的絕對 URL 拆成相對路徑，瀏覽器會用當前 origin（443/HTTPS）導航。
 */
export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (response) {
    const location = response.headers.get('location');
    if (location && /^https?:\/\//i.test(location)) {
      try {
        const u = new URL(location);
        response.headers.set('location', `${u.pathname}${u.search}${u.hash}`);
      } catch {
        // 解析失敗就保持原樣
      }
    }
  }

  return response;
}

export const config = {
  // 排除 api / admin / _next / 靜態資源；其餘走 i18n middleware
  matcher: ['/((?!api|admin|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|images|uploads|.*\\..*).*)'],
};

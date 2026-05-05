import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth-edge';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 僅保護 /admin 路徑（排除 /admin/login），且 admin 不走 i18n
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await readSessionToken(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // admin 走 auth；其餘公開頁走 i18n
    '/admin/:path*',
    '/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|images|uploads|.*\\..*).*)',
  ],
};

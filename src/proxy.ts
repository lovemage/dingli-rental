import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth-edge';

const intlMiddleware = createIntlMiddleware(routing);

function normalizeRedirectLocation(request: NextRequest, response: NextResponse) {
  const location = response.headers.get('location');
  if (!location || !/^https?:\/\//i.test(location)) return response;

  try {
    const u = new URL(location);
    const isInternalHost =
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.port === '8080';
    if (!isInternalHost) return response;

    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const proto = forwardedProto || 'https';
    const host = forwardedHost || request.headers.get('host') || request.nextUrl.host;
    if (!host) return response;

    const fixed = `${proto}://${host}${u.pathname}${u.search}${u.hash}`;
    response.headers.set('location', fixed);
  } catch {
    // ignore malformed url
  }
  return response;
}

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
      return normalizeRedirectLocation(req, NextResponse.redirect(url));
    }
    return NextResponse.next();
  }

  const response = intlMiddleware(req);
  return response ? normalizeRedirectLocation(req, response) : response;
}

export const config = {
  matcher: [
    // admin 走 auth；其餘公開頁走 i18n
    '/admin/:path*',
    '/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|images|uploads|.*\\..*).*)',
  ],
};

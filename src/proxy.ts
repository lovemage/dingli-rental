import { NextResponse, type NextRequest } from 'next/server';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth-edge';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 僅保護 /admin 路徑（排除 /admin/login）
  if (!pathname.startsWith('/admin')) return NextResponse.next();
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

export const config = {
  matcher: ['/admin/:path*'],
};

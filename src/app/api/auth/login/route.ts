import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: '請輸入帳號與密碼' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }
    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    const token = await createSessionToken({ id: admin.id, username: admin.username });
    const res = NextResponse.json({ ok: true, username: admin.username });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '登入失敗' }, { status: 500 });
  }
}

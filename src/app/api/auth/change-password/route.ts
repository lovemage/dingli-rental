import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: '新密碼至少 6 個字元' }, { status: 400 });
  }
  const admin = await prisma.admin.findUnique({ where: { id: me.id } });
  if (!admin) return NextResponse.json({ error: '帳號不存在' }, { status: 404 });

  const ok = await verifyPassword(currentPassword, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: '目前密碼不正確' }, { status: 401 });

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  return NextResponse.json({ ok: true });
}

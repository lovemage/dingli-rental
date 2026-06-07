import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dingli-rental-fallback-secret-change-me';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const SESSION_COOKIE = 'dingli_admin_session';
const SESSION_TTL_HOURS = 12;
const SESSION_TTL_REMEMBER_DAYS = 30;

function sessionTtlSeconds(remember: boolean): number {
  return remember ? SESSION_TTL_REMEMBER_DAYS * 24 * 3600 : SESSION_TTL_HOURS * 3600;
}

export type AdminPayload = {
  id: number;
  username: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: AdminPayload, remember = false): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + sessionTtlSeconds(remember))
    .sign(secretKey);
}

export async function readSessionToken(token: string | undefined): Promise<AdminPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.id === 'number' && typeof payload.username === 'string') {
      return { id: payload.id, username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return readSessionToken(token);
}

export function buildSessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: sessionTtlSeconds(remember),
  };
}

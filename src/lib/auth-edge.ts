// Edge-runtime 安全的認證工具（給 middleware 使用，不引入 bcryptjs）
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'dingli-rental-fallback-secret-change-me';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const SESSION_COOKIE = 'dingli_admin_session';

export type AdminPayload = {
  id: number;
  username: string;
};

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

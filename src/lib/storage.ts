import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  path.resolve('public', 'uploads');
const PUBLIC_PREFIX = '/uploads';

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * 上傳並轉換為 WebP，回傳公開 URL（如 /uploads/xxx.webp）
 * 在 Railway 部署時，UPLOAD_DIR 會掛載到 Volume 路徑。
 */
export async function saveImageAsWebp(
  buffer: Buffer,
  opts: { quality?: number; maxWidth?: number; subdir?: string } = {}
): Promise<{ url: string; sizeBytes: number; width: number; height: number }> {
  const quality = opts.quality ?? 82;
  const maxWidth = opts.maxWidth ?? 1920;
  const subdir = opts.subdir ?? '';

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
  const targetDir = path.join(UPLOAD_DIR, subdir);
  await ensureDir(targetDir);
  const targetPath = path.join(targetDir, fileName);

  let image = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  if (meta.width && meta.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const outBuf = await image.webp({ quality, effort: 4 }).toBuffer({ resolveWithObject: true });
  await fs.writeFile(targetPath, outBuf.data);

  const publicUrl = subdir
    ? `${PUBLIC_PREFIX}/${subdir}/${fileName}`
    : `${PUBLIC_PREFIX}/${fileName}`;

  return {
    url: publicUrl,
    sizeBytes: outBuf.info.size,
    width: outBuf.info.width,
    height: outBuf.info.height,
  };
}

export async function deleteUpload(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(PUBLIC_PREFIX)) return;
  const relative = publicUrl.slice(PUBLIC_PREFIX.length).replace(/^\/+/, '');
  const target = path.join(UPLOAD_DIR, relative);
  try {
    await fs.unlink(target);
  } catch {
    // ignore missing
  }
}

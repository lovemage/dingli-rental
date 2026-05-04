import sharp from 'sharp';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const S3_ENDPOINT = (process.env.S3_ENDPOINT || '').replace(/\/+$/, '');
const S3_REGION = process.env.S3_REGION || 'auto';
const S3_BUCKET = process.env.S3_BUCKET_NAME || '';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || '';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || '';

let _client: S3Client | null = null;

function requireConfig(): { client: S3Client; bucket: string; baseUrl: string } {
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    const missing = [
      !S3_ENDPOINT && 'S3_ENDPOINT',
      !S3_BUCKET && 'S3_BUCKET_NAME',
      !S3_ACCESS_KEY && 'S3_ACCESS_KEY_ID',
      !S3_SECRET_KEY && 'S3_SECRET_ACCESS_KEY',
    ].filter(Boolean).join(', ');
    throw new Error(`S3 storage misconfigured: missing env vars (${missing})`);
  }
  if (!_client) {
    _client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
    });
  }
  return { client: _client, bucket: S3_BUCKET, baseUrl: `${S3_ENDPOINT}/${S3_BUCKET}` };
}

/**
 * 上傳並轉換為 WebP，回傳 Railway Object Storage 的公開 URL。
 * 物件 key 格式：<subdir>/<timestamp>-<rand>.webp（例如 properties/xxx.webp）
 */
export async function saveImageAsWebp(
  buffer: Buffer,
  opts: { quality?: number; maxWidth?: number; subdir?: string } = {}
): Promise<{ url: string; sizeBytes: number; width: number; height: number }> {
  const quality = opts.quality ?? 82;
  const maxWidth = opts.maxWidth ?? 1920;
  const subdir = (opts.subdir || '').replace(/^\/+|\/+$/g, '');

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
  const key = subdir ? `${subdir}/${fileName}` : fileName;

  let image = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  if (meta.width && meta.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const out = await image.webp({ quality, effort: 4 }).toBuffer({ resolveWithObject: true });

  const { client, bucket, baseUrl } = requireConfig();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: out.data,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    url: `${baseUrl}/${key}`,
    sizeBytes: out.info.size,
    width: out.info.width,
    height: out.info.height,
  };
}

/**
 * 刪除 Object Storage 上的檔案。
 * - 只處理屬於本 bucket 的 URL（避免誤刪外部資源）
 * - 舊的 /uploads/... 本機路徑會被略過，不視為錯誤
 * - 刪除失敗（含 404）一律不 throw，避免擋住關聯紀錄的刪除流程
 */
export async function deleteUpload(publicUrl: string): Promise<void> {
  if (!publicUrl) return;
  if (!S3_ENDPOINT || !S3_BUCKET) return; // 未設定 S3 → 安靜略過
  const baseUrl = `${S3_ENDPOINT}/${S3_BUCKET}/`;
  if (!publicUrl.startsWith(baseUrl)) return;
  const key = publicUrl.slice(baseUrl.length);
  if (!key) return;

  try {
    const { client, bucket } = requireConfig();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (e: any) {
    console.error('[storage] delete failed', publicUrl, e?.message);
  }
}

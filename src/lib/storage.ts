import sharp from 'sharp';
import crypto from 'crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

// Cloudinary SDK 自動讀取 CLOUDINARY_URL 環境變數
// 格式：CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

let _configured = false;
function ensureConfigured(): void {
  if (_configured) return;
  if (!process.env.CLOUDINARY_URL) {
    throw new Error('Cloudinary 未設定：缺少 CLOUDINARY_URL 環境變數');
  }
  // SDK 會自動從 CLOUDINARY_URL 解析；這裡顯式呼叫以強制載入並啟用 https
  cloudinary.config({ secure: true });
  _configured = true;
}

/**
 * 將圖片轉為 WebP 後上傳到 Cloudinary，回傳公開 URL。
 * 物件路徑（folder/public_id）採用 <subdir>/<timestamp>-<rand>，
 * 與舊有 S3 結構一致，方便後續分類管理。
 */
export async function saveImageAsWebp(
  buffer: Buffer,
  opts: { quality?: number; maxWidth?: number; subdir?: string } = {}
): Promise<{ url: string; sizeBytes: number; width: number; height: number }> {
  const quality = opts.quality ?? 82;
  const maxWidth = opts.maxWidth ?? 1920;
  const subdir = (opts.subdir || '').replace(/^\/+|\/+$/g, '');

  // 先用 sharp 處理（旋轉 / 縮圖 / WebP 轉檔）— 控制品質與檔案大小
  let image = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  if (meta.width && meta.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const out = await image.webp({ quality, effort: 4 }).toBuffer({ resolveWithObject: true });

  ensureConfigured();

  const publicId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

  const result: UploadApiResponse = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: subdir || undefined,
        resource_type: 'image',
        format: 'webp',
        overwrite: false,
      },
      (err, res) => {
        if (err) return reject(err);
        if (!res) return reject(new Error('Cloudinary 上傳沒有回傳結果'));
        resolve(res);
      },
    );
    stream.end(out.data);
  });

  return {
    url: result.secure_url,
    sizeBytes: result.bytes,
    width: result.width,
    height: result.height,
  };
}

/**
 * 刪除 Cloudinary 上的圖片。
 * - 只處理 res.cloudinary.com 的 URL（避免誤刪外部 / 舊 S3 / 本機資源）
 * - 失敗（含 not found）一律不 throw，避免擋住關聯紀錄的刪除流程
 */
export async function deleteUpload(publicUrl: string): Promise<void> {
  if (!publicUrl) return;
  if (!process.env.CLOUDINARY_URL) return;
  if (!/res\.cloudinary\.com/.test(publicUrl)) return; // 舊 S3 / 靜態資源直接略過

  // URL 格式：https://res.cloudinary.com/<cloud>/image/upload/[v<num>/]<public_id>.<ext>
  const m = publicUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+(?:\?.*)?$/i);
  if (!m) return;
  const publicId = m[1];

  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (e: any) {
    console.error('[storage] cloudinary destroy failed', publicUrl, e?.message);
  }
}

/**
 * 把 Tigris (Railway Object Storage) bucket 設為 public-read。
 * Tigris 對「公開讀」是 bucket-level 設定，且新版 bucket 預設是私有。
 * 本腳本透過 S3 PutBucketAcl 把 ACL 改為 public-read，讓 <img> 與 vision LLM
 * 能直接抓到照片。
 *
 * 使用：
 *   1. 確認 .env 內有 S3_* 五個變數
 *   2. npx tsx scripts/set-bucket-public.ts
 */
import 'dotenv/config';
import {
  S3Client,
  PutBucketAclCommand,
  GetBucketAclCommand,
} from '@aws-sdk/client-s3';

const endpoint = (process.env.S3_ENDPOINT || '').replace(/\/+$/, '');
const region = process.env.S3_REGION || 'auto';
const bucket = process.env.S3_BUCKET_NAME || '';
const accessKeyId = process.env.S3_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';

function bail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  bail('缺少 S3_* 環境變數，請確認 .env 檔案是否完整。');
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

async function main() {
  console.log(`Bucket : ${bucket}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log('');

  console.log('→ 套用 ACL: public-read ...');
  try {
    await client.send(new PutBucketAclCommand({ Bucket: bucket, ACL: 'public-read' }));
    console.log('✓ PutBucketAcl 成功');
  } catch (e: any) {
    console.error('✗ PutBucketAcl 失敗：', e?.message || e);
    if (e?.$metadata?.httpStatusCode === 403) {
      console.error('');
      console.error('  → 你的 access key 沒有設定 ACL 的權限。請在 Railway / Tigris dashboard');
      console.error('    取得有 admin 權限的 key，或請 Railway support 將 bucket 設為 public-read。');
    }
    process.exit(1);
  }

  console.log('');
  console.log('→ 確認 ACL ...');
  try {
    const acl = await client.send(new GetBucketAclCommand({ Bucket: bucket }));
    const grants = acl.Grants || [];
    const isPublic = grants.some(
      (g) => g.Grantee?.URI === 'http://acs.amazonaws.com/groups/global/AllUsers',
    );
    if (isPublic) {
      console.log('✓ Bucket 現在是 public-read');
      console.log('');
      console.log('測試一張現有照片應該回 200：');
      console.log(`  curl -I ${endpoint}/${bucket}/properties/<filename>.webp`);
    } else {
      console.warn('⚠ ACL 已套用但驗證沒看到 AllUsers grant — 請手動確認');
      console.log('Grants:', JSON.stringify(grants, null, 2));
    }
  } catch (e: any) {
    console.warn('⚠ 無法讀取 ACL（不影響套用結果）：', e?.message || e);
  }
}

main();

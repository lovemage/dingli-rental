import HeroManager from '@/components/admin/HeroManager';

export default function HeroAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">首頁輪播管理</h1>
        <p className="text-ink-500 text-sm">最多 3 張輪播圖、可調整切換秒數，圖片自動轉為 WebP 並儲存</p>
      </div>
      <HeroManager />
    </div>
  );
}

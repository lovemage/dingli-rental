import AnnouncementForm from '@/components/admin/AnnouncementForm';

export const dynamic = 'force-dynamic';

export default function AnnouncementsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">公告管理</h1>
        <p className="text-ink-500 text-sm">
          編輯所有前台頁面頂部顯示的公告。可選擇 6 種顯示效果。
        </p>
      </div>
      <AnnouncementForm />
    </div>
  );
}

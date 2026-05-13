import HeaderNavForm from '@/components/admin/HeaderNavForm';

export default function NavigationAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">頁首導覽</h1>
        <p className="text-ink-500 text-sm">
          編輯頁首四個主導覽連結的顯示文字。修改後 EN / JA 會自動翻譯，連結網址不可變動。
        </p>
      </div>

      <HeaderNavForm />
    </div>
  );
}

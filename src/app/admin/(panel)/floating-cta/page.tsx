import FloatingCtaForm from '@/components/admin/FloatingCtaForm';

export const dynamic = 'force-dynamic';

export default function FloatingCtaAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">浮動聯絡按鈕</h1>
        <p className="text-ink-500 text-sm">
          編輯全站右下角浮動按鈕（除後台頁面外，所有前台頁面顯示）。
        </p>
      </div>
      <FloatingCtaForm />
    </div>
  );
}

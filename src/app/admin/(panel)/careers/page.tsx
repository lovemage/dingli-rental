import CareersForm from '@/components/admin/CareersForm';

export const dynamic = 'force-dynamic';

export default function CareersAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">人才招募管理</h1>
        <p className="text-ink-500 text-sm">
          編輯 <code className="bg-paper-2 px-1.5 py-0.5 rounded text-xs">/careers</code> 頁面：主視覺、福利、職缺、投遞 CTA。圖示使用 Material Symbols Rounded。
        </p>
      </div>
      <CareersForm />
    </div>
  );
}

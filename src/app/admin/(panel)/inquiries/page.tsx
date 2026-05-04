import InquiriesManager from '@/components/admin/InquiriesManager';

export const dynamic = 'force-dynamic';

export default function InquiriesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">客戶詢問</h1>
        <p className="text-ink-500 text-sm">
          來自 <code className="bg-paper-2 px-1.5 py-0.5 rounded text-xs">/contact</code> 表單的詢問都會收進這裡。
          可標記聯絡進度與內部備註。
        </p>
      </div>
      <InquiriesManager />
    </div>
  );
}

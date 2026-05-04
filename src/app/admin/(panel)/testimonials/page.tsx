import TestimonialManager from '@/components/admin/TestimonialManager';

export const dynamic = 'force-dynamic';

export default function TestimonialsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">評論管理</h1>
        <p className="text-ink-500 text-sm">可自行新增、編輯、刪除首頁跑馬燈評論。</p>
      </div>
      <TestimonialManager />
    </div>
  );
}

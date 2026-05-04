import ContactPageForm from '@/components/admin/ContactPageForm';

export const dynamic = 'force-dynamic';

export default function ContactAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">聯絡頁面</h1>
        <p className="text-ink-500 text-sm">
          編輯 <code className="bg-paper-2 px-1.5 py-0.5 rounded text-xs">/contact</code>：
          頁面標題、業務團隊、公司資訊、需求表單文案。
        </p>
      </div>
      <ContactPageForm />
    </div>
  );
}

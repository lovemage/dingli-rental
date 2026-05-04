import AiSettingsForm from '@/components/admin/AiSettingsForm';

export const dynamic = 'force-dynamic';

export default function AiSettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">AI / LLM 設定</h1>
        <p className="text-ink-500 text-sm">
          設定「新增物件 → 拍照辨識預填」使用的模型、API key 與提示詞。所有設定僅限後台讀取，不會洩漏到前台。
        </p>
      </div>
      <AiSettingsForm />
    </div>
  );
}

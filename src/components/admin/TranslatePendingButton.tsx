'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = {
  ok: boolean;
  total: number;
  pending?: number;
  translated?: number;
  failed?: number;
  results?: Array<{ id: number; ok: boolean; error?: string }>;
};

export default function TranslatePendingButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>('');

  async function run() {
    if (running) return;
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/properties/translate-pending', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '翻譯失敗');
      setResult(json);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || '翻譯失敗');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="btn btn-secondary disabled:opacity-60"
        title="檢查所有物件，僅對缺少英文 / 日文翻譯的物件執行翻譯"
      >
        {running ? '翻譯中...' : '🌐 批次翻譯（缺 EN / JA）'}
      </button>

      {running && (
        <div
          className="fixed inset-0 z-[70] bg-ink-900/60 backdrop-blur-sm grid place-items-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full text-center">
            <div className="w-14 h-14 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-brand-green-100" />
              <div className="absolute inset-0 rounded-full border-4 border-brand-green-700 border-t-transparent animate-spin" />
            </div>
            <h3 className="font-extrabold text-lg mb-2">批次翻譯中</h3>
            <p className="text-sm text-red-600 font-bold mb-3">請勿關閉視窗</p>
            <div className="text-sm text-ink-700 space-y-1">
              <p>語言轉換中...</p>
              <p>資料庫導入中...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">⚠ {error}</div>
      )}
      {result && !error && (
        <div className="mt-2 text-sm text-ink-700 space-y-0.5">
          <p>
            {result.pending === 0 ? (
              <span className="text-brand-green-700 font-medium">
                ✓ 所有 {result.total} 筆物件均已具備 EN / JA 翻譯
              </span>
            ) : (
              <span>
                共 {result.total} 筆，需翻譯 {result.pending} 筆，成功 {result.translated} 筆
                {result.failed ? `，失敗 ${result.failed} 筆` : ''}
              </span>
            )}
          </p>
          {result.failed && result.failed > 0 && result.results && (
            <details className="text-xs text-ink-500">
              <summary>失敗詳情</summary>
              <ul className="ml-4 mt-1 list-disc">
                {result.results
                  .filter((r) => !r.ok)
                  .map((r) => (
                    <li key={r.id}>
                      ID {r.id}: {r.error}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

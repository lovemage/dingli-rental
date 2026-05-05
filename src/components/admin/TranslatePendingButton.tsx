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
        className="btn btn-secondary text-sm py-2 px-4 disabled:opacity-60"
        title="檢查所有物件，對缺少英文 / 日文翻譯（或內容已變更）的物件執行翻譯"
      >
        {running ? '翻譯中...' : '🌐 批次翻譯（缺 EN / JA）'}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">⚠ {error}</div>
      )}
      {result && !error && (
        <div className="mt-2 text-sm text-ink-700 space-y-0.5">
          <p>
            {result.pending === 0 ? (
              <span className="text-brand-green-700 font-medium">
                ✓ 所有 {result.total} 筆物件均已翻譯且最新
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

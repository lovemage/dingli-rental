'use client';

import { useRouter } from 'next/navigation';

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
] as const;

/** PDF 預覽頁上方工具列（列印時隱藏）：切換語言、完整地址、列印／存成 PDF */
export default function PdfToolbar({ id, lang, full }: { id: number; lang: string; full: boolean }) {
  const router = useRouter();
  const go = (next: { lang?: string; full?: boolean }) =>
    router.replace(
      `/admin/properties/${id}/pdf?lang=${next.lang ?? lang}&full=${(next.full ?? full) ? 1 : 0}`,
    );

  return (
    <div className="pdf-toolbar sticky top-0 z-10 border-b border-line bg-white">
      <div className="mx-auto flex max-w-[820px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm">
        <span className="hidden font-bold text-ink-700 sm:inline">匯出 PDF</span>
        <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="PDF 語言">
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => go({ lang: l.code })}
                aria-pressed={active}
                className={`px-2.5 py-1.5 font-bold transition sm:px-3 ${
                  active ? 'bg-brand-green-700 text-white' : 'bg-white text-ink-700 hover:bg-paper-2'
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
        <label className="inline-flex items-center gap-2 text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-green-700"
            checked={full}
            onChange={(e) => go({ full: e.target.checked })}
          />
          顯示完整門牌
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-lg bg-brand-green-700 px-4 py-2 font-bold text-white hover:bg-brand-green-900 sm:ml-auto sm:w-auto sm:py-1.5"
        >
          列印／儲存 PDF
        </button>
      </div>
      <p className="mx-auto max-w-[820px] px-4 pb-2 text-xs text-ink-500">
        按「列印／儲存 PDF」後，目的地選「另存為 PDF」。地圖載入完成後再列印，地圖才會出現在 PDF 上。
      </p>
    </div>
  );
}

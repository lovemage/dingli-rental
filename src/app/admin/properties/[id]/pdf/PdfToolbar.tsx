'use client';

import Link from 'next/link';

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
] as const;

/** PDF 預覽頁上方工具列（列印時隱藏）：切換語言、完整地址、列印／存成 PDF */
export default function PdfToolbar({ id, lang, full }: { id: number; lang: string; full: boolean }) {
  const href = (next: { lang?: string; full?: boolean }) =>
    `/admin/properties/${id}/pdf?lang=${next.lang ?? lang}&full=${(next.full ?? full) ? 1 : 0}`;

  return (
    <div className="pdf-toolbar sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[820px] flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
        <span className="font-bold text-ink-700">匯出 PDF</span>
        <div className="flex overflow-hidden rounded-lg border border-line">
          {LANGS.map((l) => (
            <Link
              key={l.code}
              href={href({ lang: l.code })}
              className={`px-3 py-1.5 font-bold transition ${
                l.code === lang ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-paper-2'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href={href({ full: !full })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-ink-700 hover:bg-paper-2"
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-sm border ${full ? 'border-ink-900 bg-ink-900' : 'border-ink-400 bg-white'}`}
            aria-hidden
          />
          顯示完整門牌
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded-lg bg-ink-900 px-4 py-1.5 font-bold text-white hover:bg-ink-700"
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

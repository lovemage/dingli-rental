'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
] as const;

type Photo = { id: number; url: string };

/** PDF 預覽頁上方工具列（列印時隱藏）：切換語言、完整地址、挑選照片、列印／存成 PDF */
export default function PdfToolbar({
  id,
  lang,
  full,
  allPhotos,
  selectedIds,
  customSelection,
  maxPhotos,
  cols,
  maxCols,
  coverSolo,
}: {
  id: number;
  lang: string;
  full: boolean;
  allPhotos: Photo[];
  selectedIds: number[];
  customSelection: boolean;
  maxPhotos: number;
  cols: number;
  maxCols: number;
  coverSolo: boolean;
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<number[]>(selectedIds);

  const go = (next: { lang?: string; full?: boolean; photos?: number[] | null; cols?: number; coverSolo?: boolean }) => {
    const photos = next.photos === undefined ? (customSelection ? selectedIds : null) : next.photos;
    const qs = new URLSearchParams({
      lang: next.lang ?? lang,
      full: (next.full ?? full) ? '1' : '0',
    });
    if (photos && photos.length) qs.set('photos', photos.join(','));
    qs.set('cols', String(next.cols ?? cols));
    if (!(next.coverSolo ?? coverSolo)) qs.set('cover', '0');
    router.replace(`/admin/properties/${id}/pdf?${qs.toString()}`);
  };

  function openPicker() {
    setDraft(selectedIds);
    setPicking(true);
  }

  function toggle(photoId: number) {
    setDraft((cur) => {
      if (cur.includes(photoId)) return cur.filter((x) => x !== photoId);
      if (cur.length >= maxPhotos) return cur;
      return [...cur, photoId];
    });
  }

  function apply() {
    // 依物件原本的照片順序排列；第一張當主圖
    const ordered = allPhotos.map((p) => p.id).filter((pid) => draft.includes(pid));
    go({ photos: ordered.length ? ordered : null });
    setPicking(false);
  }

  const draftCoverId = allPhotos.find((p) => draft.includes(p.id))?.id;

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
        {allPhotos.length > 1 && (
          <div className="inline-flex items-center gap-2 text-ink-700">
            <span>每列</span>
            <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="縮圖每列張數">
              {Array.from({ length: maxCols }, (_, i) => i + 1).map((n) => {
                const active = n === cols;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => go({ cols: n })}
                    aria-pressed={active}
                    aria-label={`每列 ${n} 張`}
                    className={`min-w-8 px-2 py-1.5 font-bold tabular-nums transition ${
                      active ? 'bg-brand-green-700 text-white' : 'bg-white text-ink-700 hover:bg-paper-2'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <span>張</span>
          </div>
        )}
        {allPhotos.length > 1 && (
          <label className="inline-flex items-center gap-2 text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-green-700"
              checked={coverSolo}
              onChange={(e) => go({ coverSolo: e.target.checked })}
            />
            主圖單獨一列
          </label>
        )}
        {allPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => (picking ? setPicking(false) : openPicker())}
            aria-expanded={picking}
            className={`rounded-lg border px-3 py-1.5 font-bold transition ${
              picking ? 'border-brand-green-700 bg-brand-green-50 text-brand-green-900' : 'border-line bg-white text-ink-700 hover:bg-paper-2'
            }`}
          >
            選擇照片（{selectedIds.length}/{Math.min(maxPhotos, allPhotos.length)}）
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-lg bg-brand-green-700 px-4 py-2 font-bold text-white hover:bg-brand-green-900 sm:ml-auto sm:w-auto sm:py-1.5"
        >
          列印／儲存 PDF
        </button>
      </div>

      {picking && (
        <div className="mx-auto max-w-[820px] border-t border-line px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
            <span>
              已選 <strong className="text-ink-900">{draft.length}</strong> / {maxPhotos} 張，依物件照片順序排列{coverSolo ? '，第一張為主圖' : ''}。
            </span>
            <button type="button" onClick={() => setDraft(allPhotos.slice(0, maxPhotos).map((p) => p.id))} className="font-bold text-brand-green-700 hover:underline">
              選前 {Math.min(maxPhotos, allPhotos.length)} 張
            </button>
            <button type="button" onClick={() => setDraft([])} className="font-bold text-ink-500 hover:underline">
              全部取消
            </button>
          </div>
          <div className="grid max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            {allPhotos.map((p) => {
              const on = draft.includes(p.id);
              const blocked = !on && draft.length >= maxPhotos;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={blocked}
                  aria-pressed={on}
                  className={`relative aspect-[4/3] overflow-hidden border-2 transition ${
                    on ? 'border-brand-green-700' : 'border-transparent opacity-50 hover:opacity-80'
                  } disabled:cursor-not-allowed disabled:opacity-25`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  {on && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-green-700 text-[11px] font-black text-white">
                      ✓
                    </span>
                  )}
                  {coverSolo && p.id === draftCoverId && (
                    <span className="absolute bottom-0 left-0 bg-brand-green-700 px-1.5 py-0.5 text-[10px] font-bold text-white">主圖</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setPicking(false)} className="rounded-lg border border-line px-4 py-1.5 font-bold text-ink-700 hover:bg-paper-2">
              取消
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={draft.length === 0}
              className="rounded-lg bg-brand-green-700 px-4 py-1.5 font-bold text-white hover:bg-brand-green-900 disabled:opacity-40"
            >
              套用
            </button>
          </div>
        </div>
      )}

      {!picking && (
        <p className="mx-auto max-w-[820px] px-4 pb-2 text-xs text-ink-500">
          按「列印／儲存 PDF」後，目的地選「另存為 PDF」。地圖載入完成後再列印，地圖才會出現在 PDF 上。
        </p>
      )}
    </div>
  );
}

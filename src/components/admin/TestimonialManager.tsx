'use client';

import { useEffect, useState } from 'react';

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

type Locale = 'zh' | 'en' | 'ja';

type ByLocale = Record<Locale, Testimonial[]>;

type AboutData = Record<string, unknown> & {
  testimonials?: unknown;
  testimonialsByLocale?: unknown;
};

const LOCALES: Locale[] = ['zh', 'en', 'ja'];

const LOCALE_LABEL: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
};

const PLACEHOLDERS: Record<Locale, { name: string; role: string; quote: string }> = {
  zh: { name: '例如：陳小姐', role: '例如：外商行銷經理', quote: '請輸入評論內容' },
  en: { name: 'e.g. Sarah W.', role: 'e.g. International school teacher', quote: 'Enter the testimonial' },
  ja: { name: '例：佐藤さん', role: '例：IT エンジニア', quote: '評価内容を入力してください' },
};

const EMPTY_ROW: Testimonial = { name: '', role: '', quote: '' };

const EMPTY_BY_LOCALE: ByLocale = { zh: [], en: [], ja: [] };

function normalizeArray(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is Testimonial =>
        !!t &&
        typeof t === 'object' &&
        typeof (t as Testimonial).name === 'string' &&
        typeof (t as Testimonial).role === 'string' &&
        typeof (t as Testimonial).quote === 'string',
    )
    .map((t) => ({ name: t.name, role: t.role, quote: t.quote }));
}

function normalizeByLocale(raw: unknown, legacyZh: Testimonial[]): ByLocale {
  const next: ByLocale = { zh: [], en: [], ja: [] };
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    LOCALES.forEach((loc) => {
      next[loc] = normalizeArray(obj[loc]);
    });
  }
  // 如果 byLocale.zh 為空但 legacy testimonials 有資料，把 legacy 升級進 zh tab。
  if (next.zh.length === 0 && legacyZh.length > 0) {
    next.zh = legacyZh;
  }
  return next;
}

export default function TestimonialManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [data, setData] = useState<AboutData>({});
  const [byLocale, setByLocale] = useState<ByLocale>(EMPTY_BY_LOCALE);
  const [activeLocale, setActiveLocale] = useState<Locale>('zh');

  const rows = byLocale[activeLocale];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=about');
        const json = await res.json();
        const about = (json?.data || {}) as AboutData;
        const legacyZh = normalizeArray(about.testimonials);
        const next = normalizeByLocale(about.testimonialsByLocale, legacyZh);
        setData(about);
        setByLocale(next);
      } catch {
        setMsg('載入失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateRow(idx: number, patch: Partial<Testimonial>) {
    setByLocale((s) => ({
      ...s,
      [activeLocale]: s[activeLocale].map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  }

  function addRow() {
    setByLocale((s) => ({ ...s, [activeLocale]: [...s[activeLocale], { ...EMPTY_ROW }] }));
  }

  function removeRow(idx: number) {
    setByLocale((s) => ({ ...s, [activeLocale]: s[activeLocale].filter((_, i) => i !== idx) }));
  }

  function moveRow(idx: number, dir: -1 | 1) {
    const list = byLocale[activeLocale];
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    setByLocale((s) => {
      const next = [...s[activeLocale]];
      [next[idx], next[to]] = [next[to], next[idx]];
      return { ...s, [activeLocale]: next };
    });
  }

  async function save() {
    setSaving(true);
    setMsg('');
    const sanitized: ByLocale = { zh: [], en: [], ja: [] };
    LOCALES.forEach((loc) => {
      sanitized[loc] = byLocale[loc]
        .map((r) => ({
          name: r.name.trim(),
          role: r.role.trim(),
          quote: r.quote.trim(),
        }))
        .filter((r) => r.name && r.role && r.quote);
    });

    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'about',
          data: {
            ...data,
            // 保留 legacy zh-only 鍵（向下相容舊讀取程式碼），但以 byLocale 為主。
            testimonials: sanitized.zh,
            testimonialsByLocale: sanitized,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '儲存失敗');
      setData((prev) => ({
        ...prev,
        testimonials: sanitized.zh,
        testimonialsByLocale: sanitized,
      }));
      setByLocale(sanitized);
      setMsg('已儲存 ✓');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '儲存失敗';
      setMsg(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  const placeholder = PLACEHOLDERS[activeLocale];

  return (
    <div className="space-y-4 pb-20">
      <div className="admin-card !p-4 sm:!p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">首頁評論</h2>
            <p className="text-xs text-ink-500 mt-1">
              依語言分別管理。前台 /{activeLocale} 路由會讀取對應語言的評論。
            </p>
          </div>
          <button type="button" onClick={addRow} className="btn btn-primary text-sm px-4 py-2">
            新增評論
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="語言切換">
          {LOCALES.map((loc) => {
            const count = byLocale[loc].length;
            const active = loc === activeLocale;
            return (
              <button
                key={loc}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveLocale(loc)}
                className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition ${
                  active
                    ? 'bg-brand-green-700 text-white border-brand-green-700'
                    : 'bg-white text-ink-700 border-line hover:border-brand-green-500'
                }`}
              >
                {LOCALE_LABEL[loc]}（{count}）
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-ink-500">
            {LOCALE_LABEL[activeLocale]} 目前沒有評論。點右上角新增，或切換到其他語言。
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div
                key={`${activeLocale}-${idx}`}
                className="border border-line rounded-lg p-3 space-y-2.5"
              >
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="label-base mb-1">姓名</label>
                    <input
                      className="input-base !py-2"
                      value={row.name}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                      placeholder={placeholder.name}
                    />
                  </div>
                  <div>
                    <label className="label-base mb-1">身份 / 職稱</label>
                    <input
                      className="input-base !py-2"
                      value={row.role}
                      onChange={(e) => updateRow(idx, { role: e.target.value })}
                      placeholder={placeholder.role}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-base mb-1">評論內容</label>
                  <textarea
                    className="input-base min-h-[90px]"
                    value={row.quote}
                    onChange={(e) => updateRow(idx, { quote: e.target.value })}
                    placeholder={placeholder.quote}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => moveRow(idx, -1)}
                    disabled={idx === 0}
                    className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(idx, 1)}
                    disabled={idx === rows.length - 1}
                    className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    下移
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="border border-red-200 text-red-700 rounded-full px-3 py-1.5 text-xs hover:bg-red-50"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-2.5 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
          <p className="text-xs">{msg}</p>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn btn-primary text-sm px-4 py-2"
          >
            {saving ? '儲存中...' : '儲存評論'}
          </button>
        </div>
      </div>
    </div>
  );
}

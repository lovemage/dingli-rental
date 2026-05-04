'use client';

import { useEffect, useState } from 'react';
import {
  SERVICES_DEFAULTS,
  SERVICE_ICON_PRESETS,
  type ServiceItem,
  type ServicesContent,
} from '@/data/homepage-defaults';
import MaterialIcon from '@/components/MaterialIcon';

export default function ServicesForm() {
  const [data, setData] = useState<ServicesContent>(SERVICES_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=homepage_services', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({
            ...SERVICES_DEFAULTS,
            ...json.data,
            items: Array.isArray(json.data.items) && json.data.items.length
              ? json.data.items
              : SERVICES_DEFAULTS.items,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof ServicesContent>(key: K, value: ServicesContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function updateItem(i: number, patch: Partial<ServiceItem>) {
    setData((d) => ({
      ...d,
      items: d.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setData((d) => ({
      ...d,
      items: [...d.items, { icon: 'star', title: '新項目', desc: '請填寫描述' }],
    }));
  }

  function removeItem(i: number) {
    setData((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));
  }

  function moveItem(i: number, dir: -1 | 1) {
    const j = i + dir;
    setData((d) => {
      if (j < 0 || j >= d.items.length) return d;
      const arr = [...d.items];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, items: arr };
    });
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'homepage_services', data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '儲存失敗');
      }
      setMsg('已儲存 ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
        <h2 className="font-bold text-lg">服務特色 OUR SERVICES</h2>
        <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="label-base">小標籤</label>
          <input
            className="input-base"
            value={data.eyebrow}
            onChange={(e) => set('eyebrow', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">區塊標題</label>
          <input
            className="input-base"
            value={data.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label-base">區塊副標</label>
          <textarea
            className="input-base min-h-[60px]"
            value={data.sub}
            onChange={(e) => set('sub', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">CTA 按鈕文字</label>
          <input
            className="input-base"
            value={data.ctaText}
            onChange={(e) => set('ctaText', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">CTA 連結</label>
          <input
            className="input-base"
            value={data.ctaLink}
            onChange={(e) => set('ctaLink', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 pt-4 border-t border-line">
        <h3 className="font-bold">服務項目（{data.items.length}）</h3>
        <button onClick={addItem} className="btn btn-secondary text-xs">
          + 新增項目
        </button>
      </div>

      <div className="space-y-3">
        {data.items.map((it, i) => (
          <div
            key={i}
            className="border border-line rounded-xl p-3 grid grid-cols-1 md:grid-cols-[80px_1fr_auto] gap-3 items-start"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerIdx(pickerIdx === i ? null : i)}
                className="w-full aspect-square rounded-lg bg-brand-green-50 grid place-items-center hover:bg-brand-green-50/70 transition border border-line"
                title="點擊更換圖示"
              >
                <MaterialIcon name={it.icon} className="!text-4xl text-brand-green-700" />
              </button>
              <input
                className="input-base mt-1.5 !py-1 !text-xs text-center"
                value={it.icon}
                onChange={(e) => updateItem(i, { icon: e.target.value })}
                placeholder="icon"
              />
              {pickerIdx === i && (
                <div className="absolute z-10 left-0 top-[calc(100%+8px)] w-72 max-h-72 overflow-y-auto bg-white border border-line rounded-xl shadow-lg p-3 grid grid-cols-5 gap-2">
                  {SERVICE_ICON_PRESETS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        updateItem(i, { icon: name });
                        setPickerIdx(null);
                      }}
                      className="aspect-square rounded-lg hover:bg-brand-green-50 grid place-items-center"
                      title={name}
                    >
                      <MaterialIcon name={name} className="!text-2xl text-ink-700" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <input
                className="input-base"
                value={it.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder="標題"
              />
              <textarea
                className="input-base min-h-[60px]"
                value={it.desc}
                onChange={(e) => updateItem(i, { desc: e.target.value })}
                placeholder="描述"
              />
            </div>
            <div className="flex md:flex-col gap-1.5">
              <button
                type="button"
                onClick={() => moveItem(i, -1)}
                disabled={i === 0}
                className="text-sm border border-line rounded-lg px-3 py-1.5 disabled:opacity-30 hover:border-brand-green-500"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(i, 1)}
                disabled={i === data.items.length - 1}
                className="text-sm border border-line rounded-lg px-3 py-1.5 disabled:opacity-30 hover:border-brand-green-500"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-500 mt-3">
        圖示使用 Google Material Symbols（Rounded）。可點擊圖示開啟選單，或直接輸入名稱
        — 完整列表參考 <span className="font-mono">fonts.google.com/icons</span>
      </p>

      {msg && <p className="text-sm text-brand-green-700 mt-3">{msg}</p>}
    </div>
  );
}

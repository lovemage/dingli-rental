'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES_DEFAULTS, type CategoryItem } from '@/data/homepage-defaults';

export default function CategoriesForm() {
  const [items, setItems] = useState<CategoryItem[]>(CATEGORIES_DEFAULTS.items);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=homepage_categories', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data?.items && Array.isArray(json.data.items)) {
          // 補齊到 3 筆
          const merged = [0, 1, 2].map(
            (i) => json.data.items[i] || CATEGORIES_DEFAULTS.items[i],
          );
          setItems(merged);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(i: number, patch: Partial<CategoryItem>) {
    setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  async function uploadImage(i: number, file: File) {
    setUploadingIdx(i);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?subdir=categories', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '上傳失敗');
      const url = data.files?.[0]?.url;
      if (!url) throw new Error('上傳失敗');
      update(i, { imageUrl: url });
    } catch (e: any) {
      setMsg(e?.message || '上傳失敗');
    } finally {
      setUploadingIdx(null);
    }
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'homepage_categories', data: { items } }),
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
        <h2 className="font-bold text-lg">三大入口（住宅 / 辦公 / 店面）</h2>
        <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((it, i) => (
          <div
            key={i}
            className="border border-line rounded-xl p-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4"
          >
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.imageUrl}
                alt={it.title}
                className="w-full aspect-[4/5] object-cover rounded-lg border border-line"
              />
              <label
                className={`mt-2 btn btn-secondary text-xs w-full cursor-pointer ${uploadingIdx === i ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {uploadingIdx === i ? '上傳中...' : '更換圖片'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadImage(i, e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-ink-500">標籤（小字）</label>
                <input
                  className="input-base"
                  value={it.tag}
                  onChange={(e) => update(i, { tag: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-500">標題</label>
                <input
                  className="input-base"
                  value={it.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-500">描述</label>
                <input
                  className="input-base"
                  value={it.desc}
                  onChange={(e) => update(i, { desc: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-500">點擊連結</label>
                <input
                  className="input-base"
                  value={it.href}
                  onChange={(e) => update(i, { href: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm text-brand-green-700 mt-3">{msg}</p>}
    </div>
  );
}

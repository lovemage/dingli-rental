'use client';

import { useEffect, useState } from 'react';
import { HERO_DEFAULTS, type HeroContent } from '@/data/homepage-defaults';

export default function HomepageHeroTextForm() {
  const [data, setData] = useState<HeroContent>(HERO_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=homepage_hero', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({ ...HERO_DEFAULTS, ...json.data });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof HeroContent>(key: K, value: HeroContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'homepage_hero', data }),
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
        <h2 className="font-bold text-lg">主視覺文字</h2>
        <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label-base">小標籤（eyebrow）</label>
          <input
            className="input-base"
            value={data.eyebrow}
            onChange={(e) => set('eyebrow', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">主標題第一行</label>
          <input
            className="input-base"
            value={data.titleLine1}
            onChange={(e) => set('titleLine1', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">主標題第二行（橘色高亮）</label>
          <input
            className="input-base"
            value={data.titleLine2}
            onChange={(e) => set('titleLine2', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label-base">描述文字</label>
          <textarea
            className="input-base min-h-[100px]"
            value={data.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">主按鈕文字</label>
          <input
            className="input-base"
            value={data.primaryCtaText}
            onChange={(e) => set('primaryCtaText', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">主按鈕連結</label>
          <input
            className="input-base"
            value={data.primaryCtaLink}
            onChange={(e) => set('primaryCtaLink', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">次按鈕文字</label>
          <input
            className="input-base"
            value={data.secondaryCtaText}
            onChange={(e) => set('secondaryCtaText', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">次按鈕連結</label>
          <input
            className="input-base"
            value={data.secondaryCtaLink}
            onChange={(e) => set('secondaryCtaLink', e.target.value)}
          />
        </div>
      </div>

      {msg && <p className="text-sm text-brand-green-700 mt-3">{msg}</p>}
    </div>
  );
}

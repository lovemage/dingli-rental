'use client';

import { useEffect, useState } from 'react';
import { HERO_DEFAULTS, type HeroContent } from '@/data/homepage-defaults';
import HeroTitle from '@/components/frontend/HeroTitle';

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
          <textarea
            rows={2}
            className="input-base resize-y"
            value={data.titleLine1}
            onChange={(e) => set('titleLine1', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">主標題第二行（橘色高亮）</label>
          <textarea
            rows={2}
            className="input-base resize-y"
            value={data.titleLine2}
            onChange={(e) => set('titleLine2', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-ink-500 mb-2">
            按 Enter 可強制換行；中文只會在空白或換行處斷行。下方預覽與前台中文版顯示一致。
          </p>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="overflow-hidden rounded-lg bg-ink-900 p-4">
              <p className="text-[11px] font-bold text-paper/70 mb-1">桌機預覽</p>
              {/* 前台桌機標題寬 672px、字級 56px；等比縮小 55% 預覽 */}
              <div className="w-[370px] h-[140px] overflow-hidden">
                <div className="w-[672px] origin-top-left scale-[0.55]">
                  <HeroTitle line1={data.titleLine1} line2={data.titleLine2} locale="zh" size="desktop" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg bg-ink-900 p-4">
              <p className="text-[11px] font-bold text-paper/70 mb-1">手機預覽</p>
              <div className="w-[343px] max-w-full">
                <HeroTitle line1={data.titleLine1} line2={data.titleLine2} locale="zh" size="mobile" />
              </div>
            </div>
          </div>
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

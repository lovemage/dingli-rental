'use client';

import { useEffect, useState } from 'react';
import {
  HEADER_NAV_DEFAULTS,
  type HeaderNavContent,
} from '@/data/header-nav-defaults';

export default function HeaderNavForm() {
  const [data, setData] = useState<HeaderNavContent>(HEADER_NAV_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=header_nav', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({ ...HEADER_NAV_DEFAULTS, ...json.data });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof HeaderNavContent>(key: K, value: HeaderNavContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'header_nav', data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '儲存失敗');
      }
      setMsg('已儲存 ✓ EN/JA 翻譯會在背景自動更新');
      setTimeout(() => setMsg(''), 4000);
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
        <div>
          <h2 className="font-bold text-lg">頁首導覽連結文字</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            修改後台輸入的繁體中文版本；儲存後系統會自動翻譯成 EN / JA。
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label-base">物件分類（/properties）</label>
          <input
            className="input-base"
            value={data.properties}
            onChange={(e) => set('properties', e.target.value)}
            placeholder="物件分類"
          />
        </div>
        <div>
          <label className="label-base">服務特色（/services）</label>
          <input
            className="input-base"
            value={data.services}
            onChange={(e) => set('services', e.target.value)}
            placeholder="服務特色"
          />
        </div>
        <div>
          <label className="label-base">人才招募（/careers）</label>
          <input
            className="input-base"
            value={data.careers}
            onChange={(e) => set('careers', e.target.value)}
            placeholder="人才招募"
          />
        </div>
        <div>
          <label className="label-base">聯絡我們（/contact）</label>
          <input
            className="input-base"
            value={data.contact}
            onChange={(e) => set('contact', e.target.value)}
            placeholder="聯絡我們"
          />
        </div>
      </div>

      {msg && <p className="text-sm text-brand-green-700 mt-3">{msg}</p>}
    </div>
  );
}

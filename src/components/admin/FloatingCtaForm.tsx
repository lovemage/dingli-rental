'use client';

import { useEffect, useState } from 'react';
import { FLOATING_CTA_DEFAULTS, type FloatingCtaContent } from '@/data/floating-cta-defaults';

export default function FloatingCtaForm() {
  const [data, setData] = useState<FloatingCtaContent>(FLOATING_CTA_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=floating_cta', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({ ...FLOATING_CTA_DEFAULTS, ...json.data });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof FloatingCtaContent>(key: K, value: FloatingCtaContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function uploadAvatar(file: File) {
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?subdir=floating-cta', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '上傳失敗');
      const url = json.files?.[0]?.url;
      if (!url) throw new Error('上傳失敗');
      set('avatarUrl', url);
    } catch (e: any) {
      setMsg(e?.message || '上傳失敗');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'floating_cta', data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '儲存失敗');
      }
      setMsg('已儲存 ✓ 重新整理前台即可看到變更');
      setTimeout(() => setMsg(''), 4000);
    } catch (e: any) {
      setMsg(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  const isLine = /\blin(\.|e\.)/.test(data.linkUrl);

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
        <h2 className="font-bold text-lg">浮動聯絡按鈕</h2>
        <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        {/* 預覽 + 上傳 */}
        <div>
          <p className="label-base">頭像</p>
          <div className="bg-paper-2 border border-line rounded-xl p-6 grid place-items-center">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.avatarUrl}
                alt="頭像"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
                style={{ objectPosition: 'center 20%' }}
              />
              <span className="absolute bottom-1 right-1 block w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
            </div>
          </div>
          <label
            className={`mt-2 btn btn-secondary text-xs w-full cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {uploading ? '上傳中...' : '更換頭像'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) uploadAvatar(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
          <input
            className="input-base mt-1.5 !text-xs"
            value={data.avatarUrl}
            onChange={(e) => set('avatarUrl', e.target.value)}
            placeholder="或直接貼上圖片網址"
          />
          <p className="text-xs text-ink-500 mt-2 leading-relaxed">
            建議 1:1 正方形人像，臉部置中略偏上。系統會自動轉為 WebP。
          </p>
        </div>

        {/* 設定欄位 */}
        <div className="space-y-4">
          <div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.enabled}
                onChange={(e) => set('enabled', e.target.checked)}
              />
              <span className="font-bold">啟用浮動按鈕</span>
              <span className="text-xs text-ink-500">（停用後前台所有頁面都不會顯示）</span>
            </label>
          </div>

          <div>
            <label className="label-base">連結網址 *</label>
            <input
              className="input-base"
              value={data.linkUrl}
              onChange={(e) => set('linkUrl', e.target.value)}
              placeholder="https://lin.ee/xxxxxx"
            />
            <p className="text-xs text-ink-500 mt-1">
              {isLine ? '✓ 偵測為 LINE 連結，會顯示 LINE 標誌' : '一般連結，不會顯示 LINE 標誌'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-base">主文字</label>
              <input
                className="input-base"
                value={data.bubbleTitle}
                onChange={(e) => set('bubbleTitle', e.target.value)}
                placeholder="LINE 諮詢"
              />
            </div>
            <div>
              <label className="label-base">副文字</label>
              <input
                className="input-base"
                value={data.bubbleSubtitle}
                onChange={(e) => set('bubbleSubtitle', e.target.value)}
                placeholder="點我聯絡客服"
              />
            </div>
          </div>

          <div>
            <label className="label-base">無障礙標籤（aria-label）</label>
            <input
              className="input-base"
              value={data.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="聯絡客服"
            />
            <p className="text-xs text-ink-500 mt-1">
              給螢幕閱讀器使用，前台不顯示。
            </p>
          </div>

          {/* 預覽（縮小版） */}
          <div className="border-t border-line pt-4">
            <p className="text-xs font-bold text-ink-500 mb-2">前台預覽</p>
            <div className="bg-paper-2 rounded-xl p-4 inline-flex items-center gap-3 border border-line">
              <span className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.avatarUrl}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  style={{ objectPosition: 'center 20%' }}
                />
                <span className="absolute bottom-0.5 right-0.5 block w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
              </span>
              <div className="flex flex-col leading-tight pr-3">
                <span className="flex items-center gap-1.5 font-extrabold text-sm text-ink-900">
                  {isLine && (
                    <span className="inline-grid place-items-center w-5 h-5 rounded bg-[#06C755] text-white text-[10px] font-black leading-none">
                      LINE
                    </span>
                  )}
                  {data.bubbleTitle || '主文字'}
                </span>
                <span className="text-xs text-ink-500">{data.bubbleSubtitle || '副文字'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {msg && <p className="text-sm text-brand-green-700 mt-4">{msg}</p>}
    </div>
  );
}

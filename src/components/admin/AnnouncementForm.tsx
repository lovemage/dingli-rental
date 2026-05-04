'use client';

import { useEffect, useState } from 'react';
import {
  ANNOUNCEMENT_DEFAULTS,
  ANNOUNCEMENT_EFFECT_OPTIONS,
  type AnnouncementEffect,
  type AnnouncementSettings,
} from '@/data/announcement-defaults';

export default function AnnouncementForm() {
  const [data, setData] = useState<AnnouncementSettings>(ANNOUNCEMENT_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=announcement', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({ ...ANNOUNCEMENT_DEFAULTS, ...json.data });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof AnnouncementSettings>(key: K, value: AnnouncementSettings[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'announcement', data }),
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

  function resetText() {
    if (confirm('確定要還原為預設文字？')) set('text', ANNOUNCEMENT_DEFAULTS.text);
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  const isMarquee = data.effect === 'marquee' || data.effect === 'marquee-reverse';
  const previewClass = `ann-${data.effect}`;

  return (
    <div className="space-y-5">
      {/* === 開關 + 文字 === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">公告內容</h2>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={data.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-bold">{data.enabled ? '已啟用' : '停用中'}</span>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-base !mb-0">公告文字</label>
              <button type="button" onClick={resetText} className="text-xs text-ink-500 hover:text-brand-orange-700">
                還原預設
              </button>
            </div>
            <textarea
              className="input-base min-h-[80px] resize-y"
              maxLength={500}
              value={data.text}
              onChange={(e) => set('text', e.target.value)}
              placeholder="輸入要顯示在每個公開頁面頂部的公告..."
            />
            <p className="text-xs text-ink-500 mt-1">
              已輸入 {data.text.length} / 500 字。建議用 ｜ 或｜分隔多則訊息。
            </p>
          </div>
        </div>
      </div>

      {/* === 效果選擇 === */}
      <div className="admin-card">
        <div className="mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">顯示效果</h2>
          <p className="text-xs text-ink-500 mt-0.5">選一種動畫呈現方式。預設為「跑馬燈（左→右）」。</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {ANNOUNCEMENT_EFFECT_OPTIONS.map((opt) => {
            const active = data.effect === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('effect', opt.value as AnnouncementEffect)}
                className={`text-left rounded-xl border-2 px-4 py-3 transition ${active ? 'border-brand-green-700 bg-brand-green-50' : 'border-line bg-white hover:border-brand-green-300'}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-bold text-sm ${active ? 'text-brand-green-900' : 'text-ink-900'}`}>
                    {opt.label}
                  </span>
                  {active && <span className="text-brand-green-700 font-bold text-sm">✓</span>}
                </div>
                <p className="text-xs text-ink-500">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* === 預覽 === */}
      <div className="admin-card">
        <h2 className="font-bold text-lg mb-3 pb-3 border-b border-line">前台預覽</h2>
        <p className="text-xs text-ink-500 mb-3">下方完整重現前台 Header 上方的公告列：</p>

        <div className="bg-brand-orange-700 text-white text-sm font-medium overflow-hidden rounded-lg border border-brand-orange-700/40">
          <div className="px-6 py-2">
            {data.text.trim() ? (
              isMarquee ? (
                <div className={previewClass}>
                  <div className="ann-track">
                    <span className="px-6">{data.text}</span>
                    <span className="px-6" aria-hidden>{data.text}</span>
                  </div>
                </div>
              ) : (
                <div className={`text-center ${previewClass}`}>
                  <span className="ann-text">{data.text}</span>
                </div>
              )
            ) : (
              <p className="text-center text-white/60 italic">（公告文字為空）</p>
            )}
          </div>
        </div>

        {!data.enabled && (
          <p className="text-xs text-ink-500 mt-2">
            ⚠ 公告目前停用中；儲存後仍不會顯示在前台，請開啟「啟用」開關。
          </p>
        )}
      </div>

      {/* === 底部送出列 === */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-3 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          {msg ? <p className="text-sm text-brand-green-700">{msg}</p> : <span />}
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
}

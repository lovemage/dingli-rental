'use client';

import { useEffect, useState } from 'react';

type Slide = { id?: number; imageUrl: string; title?: string; subtitle?: string; ctaText?: string; ctaLink?: string; active?: boolean };

export default function HeroManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [intervalSec, setIntervalSec] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hero');
        const data = await res.json();
        setSlides(data.slides || []);
        setIntervalSec(data.intervalSec || 5);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?subdir=hero', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '上傳失敗');
      const url = data.files?.[0]?.url;
      if (!url) throw new Error('上傳失敗');
      return url as string;
    } finally {
      setUploading(false);
    }
  }

  async function addSlide(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (slides.length >= 3) {
      setMsg('最多 3 張輪播圖');
      return;
    }
    setMsg('');
    try {
      const url = await uploadFile(files[0]);
      setSlides((s) => [...s, { imageUrl: url, active: true }]);
    } catch (e: any) {
      setMsg(e?.message || '上傳失敗');
    }
  }

  function update(i: number, patch: Partial<Slide>) {
    setSlides((s) => s.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }

  function remove(i: number) {
    setSlides((s) => s.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((s) => {
      const arr = [...s];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, intervalSec }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || '儲存失敗');
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
    <div className="space-y-5 pb-24">
      <div className="admin-card">
        <h2 className="font-bold text-lg mb-4 pb-3 border-b border-line">輪播設定</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">輪播切換秒數</label>
          <input type="number" min={2} max={60} className="input-base !w-24" value={intervalSec} onChange={(e) => setIntervalSec(Math.max(2, Math.min(60, Number(e.target.value) || 5)))} />
          <span className="text-sm text-ink-500">秒</span>
        </div>
        <p className="text-xs text-ink-500 mt-2">範圍 2 ~ 60 秒</p>
      </div>

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">輪播圖片（{slides.length} / 3）</h2>
          {slides.length < 3 && (
            <label className={`btn btn-primary cursor-pointer text-sm ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading ? '上傳中...' : '+ 新增圖片'}
              <input type="file" accept="image/*" hidden onChange={(e) => { addSlide(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>

        {slides.length === 0 ? (
          <p className="text-center text-ink-500 py-10">尚未新增輪播圖</p>
        ) : (
          <div className="space-y-4">
            {slides.map((s, i) => (
              <div key={i} className="border border-line rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl} alt="" className="w-full sm:w-40 aspect-[16/10] object-cover rounded-lg border border-line" />
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-ink-500">標題（可選）</label>
                    <input className="input-base" value={s.title || ''} onChange={(e) => update(i, { title: e.target.value })} placeholder="顯示於圖片下方的標題" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-500">副標題（可選）</label>
                    <input className="input-base" value={s.subtitle || ''} onChange={(e) => update(i, { subtitle: e.target.value })} placeholder="副標題說明" />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={s.active ?? true} onChange={(e) => update(i, { active: e.target.checked })} />
                    啟用此圖
                  </label>
                </div>
                <div className="flex sm:flex-col gap-2 justify-end">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-sm border border-line rounded-lg px-3 py-1.5 disabled:opacity-30 hover:border-brand-green-500">↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="text-sm border border-line rounded-lg px-3 py-1.5 disabled:opacity-30 hover:border-brand-green-500">↓</button>
                  <button onClick={() => remove(i)} className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50">刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-3 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
          <p className="text-sm">{msg}</p>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? '儲存中...' : '儲存設定'}</button>
        </div>
      </div>
    </div>
  );
}

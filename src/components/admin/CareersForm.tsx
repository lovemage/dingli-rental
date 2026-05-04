'use client';

import { useEffect, useState } from 'react';
import {
  CAREERS_DEFAULTS,
  CAREERS_BENEFIT_ICON_PRESETS,
  type CareersBenefit,
  type CareersContent,
  type CareersPosition,
} from '@/data/careers-defaults';
import MaterialIcon from '@/components/admin/MaterialIcon';

export default function CareersForm() {
  const [data, setData] = useState<CareersContent>(CAREERS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=careers', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({
            ...CAREERS_DEFAULTS,
            ...json.data,
            benefits: Array.isArray(json.data.benefits) && json.data.benefits.length
              ? json.data.benefits
              : CAREERS_DEFAULTS.benefits,
            positions: Array.isArray(json.data.positions) && json.data.positions.length
              ? json.data.positions
              : CAREERS_DEFAULTS.positions,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof CareersContent>(key: K, value: CareersContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  // ===== Benefits =====
  function updateBenefit(i: number, patch: Partial<CareersBenefit>) {
    setData((d) => ({
      ...d,
      benefits: d.benefits.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  }
  function addBenefit() {
    setData((d) => ({
      ...d,
      benefits: [...d.benefits, { icon: 'star', title: '新福利', desc: '請填寫描述' }],
    }));
  }
  function removeBenefit(i: number) {
    setData((d) => ({ ...d, benefits: d.benefits.filter((_, idx) => idx !== i) }));
  }
  function moveBenefit(i: number, dir: -1 | 1) {
    const j = i + dir;
    setData((d) => {
      if (j < 0 || j >= d.benefits.length) return d;
      const arr = [...d.benefits];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, benefits: arr };
    });
  }

  // ===== Positions =====
  function updatePosition(i: number, patch: Partial<CareersPosition>) {
    setData((d) => ({
      ...d,
      positions: d.positions.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }
  function updateRequirements(i: number, text: string) {
    const requirements = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    updatePosition(i, { requirements });
  }
  function addPosition() {
    setData((d) => ({
      ...d,
      positions: [
        ...d.positions,
        {
          title: '新職缺',
          type: '全職',
          region: '台北',
          salary: 'NT$ 0K - 0K',
          desc: '',
          requirements: [],
        },
      ],
    }));
  }
  function removePosition(i: number) {
    if (!confirm('確定要刪除這個職缺？')) return;
    setData((d) => ({ ...d, positions: d.positions.filter((_, idx) => idx !== i) }));
  }
  function movePosition(i: number, dir: -1 | 1) {
    const j = i + dir;
    setData((d) => {
      if (j < 0 || j >= d.positions.length) return d;
      const arr = [...d.positions];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, positions: arr };
    });
  }

  // ===== Hero image upload =====
  async function uploadHero(file: File) {
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?subdir=careers', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '上傳失敗');
      const url = json.files?.[0]?.url;
      if (!url) throw new Error('上傳失敗');
      set('heroImageUrl', url);
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
        body: JSON.stringify({ section: 'careers', data }),
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
    <div className="space-y-5">
      {/* === Hero === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">主視覺與標題</h2>
          <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
            {saving ? '儲存中...' : '儲存全部'}
          </button>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-5">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.heroImageUrl}
              alt="careers hero"
              className="w-full aspect-[16/9] object-cover rounded-lg border border-line bg-paper-2"
            />
            <label
              className={`mt-2 btn btn-secondary text-xs w-full cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {uploading ? '上傳中...' : '更換主圖'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) uploadHero(e.target.files[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <input
              className="input-base mt-1.5 !text-xs"
              value={data.heroImageUrl}
              onChange={(e) => set('heroImageUrl', e.target.value)}
              placeholder="或直接貼上圖片網址"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="label-base">小標籤</label>
              <input
                className="input-base"
                value={data.eyebrow}
                onChange={(e) => set('eyebrow', e.target.value)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">主標題（第一行）</label>
                <input
                  className="input-base"
                  value={data.titleLine1}
                  onChange={(e) => set('titleLine1', e.target.value)}
                />
              </div>
              <div>
                <label className="label-base">主標題（第二行）</label>
                <input
                  className="input-base"
                  value={data.titleLine2}
                  onChange={(e) => set('titleLine2', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label-base">副標描述</label>
              <textarea
                className="input-base min-h-[80px]"
                value={data.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* === Benefits === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">員工福利</h2>
            <p className="text-xs text-ink-500 mt-0.5">圖示可從預設挑選或自行輸入 Material Symbols 名稱</p>
          </div>
          <button onClick={addBenefit} className="btn btn-secondary text-xs">+ 新增福利</button>
        </div>

        <div className="mb-4">
          <label className="label-base">區塊標題</label>
          <input
            className="input-base"
            value={data.benefitsTitle}
            onChange={(e) => set('benefitsTitle', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {data.benefits.map((b, i) => (
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
                  <MaterialIcon name={b.icon} className="!text-4xl text-brand-green-700" />
                </button>
                <input
                  className="input-base mt-1.5 !py-1 !text-xs text-center"
                  value={b.icon}
                  onChange={(e) => updateBenefit(i, { icon: e.target.value })}
                  placeholder="icon"
                />
                {pickerIdx === i && (
                  <div className="absolute z-10 left-0 top-[calc(100%+8px)] w-72 max-h-72 overflow-y-auto bg-white border border-line rounded-xl shadow-lg p-3 grid grid-cols-5 gap-2">
                    {CAREERS_BENEFIT_ICON_PRESETS.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          updateBenefit(i, { icon: name });
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
                  value={b.title}
                  onChange={(e) => updateBenefit(i, { title: e.target.value })}
                  placeholder="標題"
                />
                <textarea
                  className="input-base min-h-[60px]"
                  value={b.desc}
                  onChange={(e) => updateBenefit(i, { desc: e.target.value })}
                  placeholder="描述"
                />
              </div>
              <div className="flex md:flex-col gap-1.5">
                <button type="button" onClick={() => moveBenefit(i, -1)} disabled={i === 0}
                  className="text-sm border border-line rounded-lg px-3 py-1.5 disabled:opacity-30 hover:border-brand-green-500">↑</button>
                <button type="button" onClick={() => moveBenefit(i, 1)} disabled={i === data.benefits.length - 1}
                  className="text-sm border border-line rounded-lg px-3 py-1.5 disabled:opacity-30 hover:border-brand-green-500">↓</button>
                <button type="button" onClick={() => removeBenefit(i)}
                  className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50">刪除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === Positions === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">職缺</h2>
          <button onClick={addPosition} className="btn btn-secondary text-xs">+ 新增職缺</button>
        </div>

        <div className="mb-4">
          <label className="label-base">區塊標題</label>
          <input
            className="input-base"
            value={data.positionsTitle}
            onChange={(e) => set('positionsTitle', e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {data.positions.map((p, i) => (
            <div key={i} className="border border-line rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-ink-500">職缺 #{i + 1}</h3>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => movePosition(i, -1)} disabled={i === 0}
                    className="text-xs border border-line rounded-lg px-2.5 py-1 disabled:opacity-30 hover:border-brand-green-500">↑</button>
                  <button type="button" onClick={() => movePosition(i, 1)} disabled={i === data.positions.length - 1}
                    className="text-xs border border-line rounded-lg px-2.5 py-1 disabled:opacity-30 hover:border-brand-green-500">↓</button>
                  <button type="button" onClick={() => removePosition(i)}
                    className="text-xs border border-red-200 text-red-600 rounded-lg px-2.5 py-1 hover:bg-red-50">刪除</button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="label-base">職缺名稱</label>
                  <input
                    className="input-base"
                    value={p.title}
                    onChange={(e) => updatePosition(i, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-base">類型</label>
                  <input
                    className="input-base"
                    value={p.type}
                    onChange={(e) => updatePosition(i, { type: e.target.value })}
                    placeholder="全職／兼職"
                  />
                </div>
                <div>
                  <label className="label-base">工作地點</label>
                  <input
                    className="input-base"
                    value={p.region}
                    onChange={(e) => updatePosition(i, { region: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-base">薪資範圍</label>
                  <input
                    className="input-base"
                    value={p.salary}
                    onChange={(e) => updatePosition(i, { salary: e.target.value })}
                    placeholder="NT$ 35K - 80K（含獎金）"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-base">職缺描述</label>
                  <textarea
                    className="input-base min-h-[60px]"
                    value={p.desc}
                    onChange={(e) => updatePosition(i, { desc: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-base">應徵條件（每行一條）</label>
                  <textarea
                    className="input-base min-h-[100px]"
                    value={p.requirements.join('\n')}
                    onChange={(e) => updateRequirements(i, e.target.value)}
                    placeholder={'具良好溝通能力\n熱愛與人互動\n有業務經驗者佳'}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === CTA === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">投遞履歷區塊</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-base">標題</label>
            <input className="input-base" value={data.ctaTitle} onChange={(e) => set('ctaTitle', e.target.value)} />
          </div>
          <div>
            <label className="label-base">收件信箱</label>
            <input className="input-base" value={data.ctaEmail} onChange={(e) => set('ctaEmail', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">說明文字（顯示在標題下方）</label>
            <textarea
              className="input-base min-h-[60px]"
              value={data.ctaDesc}
              onChange={(e) => set('ctaDesc', e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">輔助按鈕文字</label>
            <input
              className="input-base"
              value={data.contactCtaText}
              onChange={(e) => set('contactCtaText', e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">輔助按鈕連結</label>
            <input
              className="input-base"
              value={data.contactCtaLink}
              onChange={(e) => set('contactCtaLink', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* === 底部固定送出列 === */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-3 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          {msg ? <p className="text-sm text-brand-green-700">{msg}</p> : <span />}
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? '儲存中...' : '儲存全部變更'}
          </button>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  CAREERS_DEFAULTS,
  CAREERS_BENEFIT_ICON_PRESETS,
  type CareersContent,
  type CareersIncomeStat,
  type CareersTier1Category,
  type CareersTrainingPoint,
  type CareersValuePillar,
  type CareersWLBHighlight,
} from '@/data/careers-defaults';
import MaterialIcon from '@/components/admin/MaterialIcon';

type ImageFieldKey = 'heroImageUrl' | 'trainingImageUrl' | 'tier1ImageUrl';

export default function CareersForm() {
  const [data, setData] = useState<CareersContent>(CAREERS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ImageFieldKey | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=careers', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData((prev) => ({
            ...CAREERS_DEFAULTS,
            ...json.data,
            valuePillars: Array.isArray(json.data.valuePillars) && json.data.valuePillars.length
              ? json.data.valuePillars
              : CAREERS_DEFAULTS.valuePillars,
            trainingPoints: Array.isArray(json.data.trainingPoints) && json.data.trainingPoints.length
              ? json.data.trainingPoints
              : CAREERS_DEFAULTS.trainingPoints,
            incomeStats: Array.isArray(json.data.incomeStats) && json.data.incomeStats.length
              ? json.data.incomeStats
              : CAREERS_DEFAULTS.incomeStats,
            tier1Categories: Array.isArray(json.data.tier1Categories) && json.data.tier1Categories.length
              ? json.data.tier1Categories
              : CAREERS_DEFAULTS.tier1Categories,
            wlbHighlights: Array.isArray(json.data.wlbHighlights) && json.data.wlbHighlights.length
              ? json.data.wlbHighlights
              : CAREERS_DEFAULTS.wlbHighlights,
          }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof CareersContent>(key: K, value: CareersContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function updateArray<T>(
    key: keyof CareersContent,
    i: number,
    patch: Partial<T>
  ) {
    setData((d) => {
      const arr = (d[key] as unknown as T[]).map((it, idx) =>
        idx === i ? { ...it, ...patch } : it
      );
      return { ...d, [key]: arr } as CareersContent;
    });
  }

  function addToArray<T>(key: keyof CareersContent, item: T) {
    setData((d) => {
      const arr = [...(d[key] as unknown as T[]), item];
      return { ...d, [key]: arr } as CareersContent;
    });
  }

  function removeFromArray(key: keyof CareersContent, i: number) {
    setData((d) => {
      const arr = (d[key] as unknown as unknown[]).filter((_, idx) => idx !== i);
      return { ...d, [key]: arr } as CareersContent;
    });
  }

  function moveInArray(key: keyof CareersContent, i: number, dir: -1 | 1) {
    const j = i + dir;
    setData((d) => {
      const arr = [...(d[key] as unknown as unknown[])];
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, [key]: arr } as CareersContent;
    });
  }

  async function uploadImage(field: ImageFieldKey, file: File) {
    setUploading(field); setMsg('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?subdir=careers', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '上傳失敗');
      const url = json.files?.[0]?.url;
      if (!url) throw new Error('上傳失敗');
      set(field, url);
    } catch (e: any) {
      setMsg(e?.message || '上傳失敗');
    } finally {
      setUploading(null);
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
      setMsg('已儲存 ✓ 英文／日文翻譯將於背景自動更新（約 30 秒）');
      setTimeout(() => setMsg(''), 6000);
    } catch (e: any) {
      setMsg(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand-green-700/30 bg-brand-green-50 p-4 text-sm text-brand-green-900">
        <p className="font-bold mb-1">🌐 多語自動翻譯</p>
        <p>
          儲存中文版後，系統會自動於背景翻譯成英文 / 日文版本（約 30 秒內完成）。
          翻譯期間，外語訪客會看到上一版翻譯或中文 fallback，不會破版。
        </p>
      </div>

      {/* === Hero === */}
      <SectionCard
        title="主視覺（Hero）"
        hint="頁面最上方的大圖橫幅。"
        onSave={save}
        saving={saving}
      >
        <div className="grid md:grid-cols-[260px_1fr] gap-5">
          <ImageUploader
            url={data.heroImageUrl}
            uploading={uploading === 'heroImageUrl'}
            onPick={(file) => uploadImage('heroImageUrl', file)}
            onUrlChange={(url) => set('heroImageUrl', url)}
            ratioClass="aspect-[16/9]"
          />
          <div className="space-y-3">
            <Field label="小標籤 (eyebrow)">
              <input className="input-base" value={data.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="主標題（第一行）">
                <input className="input-base" value={data.titleLine1} onChange={(e) => set('titleLine1', e.target.value)} />
              </Field>
              <Field label="主標題（第二行・橘色高亮）">
                <input className="input-base" value={data.titleLine2} onChange={(e) => set('titleLine2', e.target.value)} />
              </Field>
            </div>
            <Field label="副標描述">
              <textarea className="input-base min-h-[80px]" value={data.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* === Section 1 — 企業理念 === */}
      <SectionCard title="① 企業理念" hint="願景／使命兩張卡片 + 核心價值四項。">
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Field label="小標籤（英文 eyebrow）">
            <input className="input-base" value={data.philosophyEyebrow} onChange={(e) => set('philosophyEyebrow', e.target.value)} />
          </Field>
          <Field label="標題（前段品牌）">
            <input className="input-base" value={data.philosophyTitleBrand} onChange={(e) => set('philosophyTitleBrand', e.target.value)} />
          </Field>
          <Field label="標題（後段・綠色高亮）">
            <input className="input-base" value={data.philosophyTitleSuffix} onChange={(e) => set('philosophyTitleSuffix', e.target.value)} />
          </Field>
        </div>
        <Field label="段落引言">
          <textarea className="input-base min-h-[70px]" value={data.philosophyIntro} onChange={(e) => set('philosophyIntro', e.target.value)} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-bold text-brand-green-700 mb-2">願景卡片</p>
            <Field label="標題">
              <input className="input-base" value={data.visionTitle} onChange={(e) => set('visionTitle', e.target.value)} />
            </Field>
            <Field label="內文">
              <textarea className="input-base min-h-[80px]" value={data.visionDesc} onChange={(e) => set('visionDesc', e.target.value)} />
            </Field>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-bold text-brand-orange-700 mb-2">使命卡片</p>
            <Field label="標題">
              <input className="input-base" value={data.missionTitle} onChange={(e) => set('missionTitle', e.target.value)} />
            </Field>
            <Field label="內文">
              <textarea className="input-base min-h-[80px]" value={data.missionDesc} onChange={(e) => set('missionDesc', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <Field label="核心價值小標">
            <input className="input-base" value={data.coreValuesEyebrow} onChange={(e) => set('coreValuesEyebrow', e.target.value)} />
          </Field>
          <Field label="核心價值大標">
            <input className="input-base" value={data.coreValuesTitle} onChange={(e) => set('coreValuesTitle', e.target.value)} />
          </Field>
        </div>

        <Repeater
          label="核心價值清單（建議 3–4 項）"
          items={data.valuePillars}
          onAdd={() => addToArray<CareersValuePillar>('valuePillars', { icon: 'star', label: '新價值' })}
          onRemove={(i) => removeFromArray('valuePillars', i)}
          onMove={(i, dir) => moveInArray('valuePillars', i, dir)}
          render={(it, i) => (
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <IconBox
                icon={it.icon}
                onChange={(icon) => updateArray<CareersValuePillar>('valuePillars', i, { icon })}
              />
              <Field label="標籤文字">
                <input className="input-base" value={it.label} onChange={(e) => updateArray<CareersValuePillar>('valuePillars', i, { label: e.target.value })} />
              </Field>
            </div>
          )}
        />
      </SectionCard>

      {/* === Section 2 — 專業培訓 === */}
      <SectionCard title="② 專業培訓" hint="左文 + 右圖。圖片建議 3:4 直幅。">
        <div className="grid md:grid-cols-[260px_1fr] gap-5">
          <div>
            <ImageUploader
              url={data.trainingImageUrl}
              uploading={uploading === 'trainingImageUrl'}
              onPick={(file) => uploadImage('trainingImageUrl', file)}
              onUrlChange={(url) => set('trainingImageUrl', url)}
              ratioClass="aspect-[3/4]"
            />
            <Field label="圖片替代文字 (alt)">
              <input className="input-base !text-xs" value={data.trainingImageAlt} onChange={(e) => set('trainingImageAlt', e.target.value)} />
            </Field>
          </div>

          <div className="space-y-3">
            <Field label="小標籤">
              <input className="input-base" value={data.trainingEyebrow} onChange={(e) => set('trainingEyebrow', e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="標題（第一行）">
                <input className="input-base" value={data.trainingTitleLine1} onChange={(e) => set('trainingTitleLine1', e.target.value)} />
              </Field>
              <Field label="標題（第二行・綠色高亮）">
                <input className="input-base" value={data.trainingTitleLine2} onChange={(e) => set('trainingTitleLine2', e.target.value)} />
              </Field>
            </div>
            <Field label="段落內文">
              <textarea className="input-base min-h-[100px]" value={data.trainingDesc} onChange={(e) => set('trainingDesc', e.target.value)} />
            </Field>
            <Repeater
              label="條列重點"
              items={data.trainingPoints}
              onAdd={() => addToArray<CareersTrainingPoint>('trainingPoints', { text: '' })}
              onRemove={(i) => removeFromArray('trainingPoints', i)}
              onMove={(i, dir) => moveInArray('trainingPoints', i, dir)}
              render={(it, i) => (
                <Field label={`第 ${i + 1} 點`}>
                  <input className="input-base" value={it.text} onChange={(e) => updateArray<CareersTrainingPoint>('trainingPoints', i, { text: e.target.value })} />
                </Field>
              )}
            />
          </div>
        </div>
      </SectionCard>

      {/* === Section 3 — 科技平台高薪 === */}
      <SectionCard title="③ 科技平台 × 高薪" hint="兩張收入數字卡（左綠右橘）。">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <Field label="小標籤">
            <input className="input-base" value={data.incomeEyebrow} onChange={(e) => set('incomeEyebrow', e.target.value)} />
          </Field>
          <Field label="標題（前段）">
            <input className="input-base" value={data.incomeTitleLine} onChange={(e) => set('incomeTitleLine', e.target.value)} />
          </Field>
          <Field label="標題（橘色高亮）">
            <input className="input-base" value={data.incomeTitleHighlight} onChange={(e) => set('incomeTitleHighlight', e.target.value)} />
          </Field>
        </div>
        <Field label="段落引言">
          <textarea className="input-base min-h-[80px]" value={data.incomeIntro} onChange={(e) => set('incomeIntro', e.target.value)} />
        </Field>

        <Repeater
          label="收入數字卡（建議 2 張，第二張為橘色亮卡）"
          items={data.incomeStats}
          onAdd={() => addToArray<CareersIncomeStat>('incomeStats', { label: '', number: '0', suffix: '萬+', note: '' })}
          onRemove={(i) => removeFromArray('incomeStats', i)}
          onMove={(i, dir) => moveInArray('incomeStats', i, dir)}
          render={(it, i) => (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Field label="標籤">
                <input className="input-base" value={it.label} onChange={(e) => updateArray<CareersIncomeStat>('incomeStats', i, { label: e.target.value })} />
              </Field>
              <Field label="數字">
                <input className="input-base" value={it.number} onChange={(e) => updateArray<CareersIncomeStat>('incomeStats', i, { number: e.target.value })} />
              </Field>
              <Field label="單位">
                <input className="input-base" value={it.suffix} onChange={(e) => updateArray<CareersIncomeStat>('incomeStats', i, { suffix: e.target.value })} />
              </Field>
              <Field label="說明">
                <input className="input-base" value={it.note} onChange={(e) => updateArray<CareersIncomeStat>('incomeStats', i, { note: e.target.value })} />
              </Field>
            </div>
          )}
        />

        <Field label="底部引言（可留空）">
          <input className="input-base" value={data.incomeQuote} onChange={(e) => set('incomeQuote', e.target.value)} />
        </Field>
      </SectionCard>

      {/* === Section 4 — Tier 1 === */}
      <SectionCard title="④ Tier 1 高端外商" hint="左圖 + 右文。圖片建議 4:3 橫幅。">
        <div className="grid md:grid-cols-[260px_1fr] gap-5">
          <div>
            <ImageUploader
              url={data.tier1ImageUrl}
              uploading={uploading === 'tier1ImageUrl'}
              onPick={(file) => uploadImage('tier1ImageUrl', file)}
              onUrlChange={(url) => set('tier1ImageUrl', url)}
              ratioClass="aspect-[4/3]"
            />
            <Field label="圖片替代文字 (alt)">
              <input className="input-base !text-xs" value={data.tier1ImageAlt} onChange={(e) => set('tier1ImageAlt', e.target.value)} />
            </Field>
            <Field label="圖片左上徽章文字">
              <input className="input-base !text-xs" value={data.tier1Badge} onChange={(e) => set('tier1Badge', e.target.value)} />
            </Field>
          </div>

          <div className="space-y-3">
            <Field label="小標籤">
              <input className="input-base" value={data.tier1Eyebrow} onChange={(e) => set('tier1Eyebrow', e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="標題（第一行）">
                <input className="input-base" value={data.tier1TitleLine1} onChange={(e) => set('tier1TitleLine1', e.target.value)} />
              </Field>
              <Field label="標題（第二行・綠色高亮）">
                <input className="input-base" value={data.tier1TitleLine2} onChange={(e) => set('tier1TitleLine2', e.target.value)} />
              </Field>
            </div>
            <Field label="段落內文">
              <textarea className="input-base min-h-[100px]" value={data.tier1Desc} onChange={(e) => set('tier1Desc', e.target.value)} />
            </Field>
            <Repeater
              label="物件類別小卡（建議 3 項）"
              items={data.tier1Categories}
              onAdd={() => addToArray<CareersTier1Category>('tier1Categories', { icon: 'apartment', label: '' })}
              onRemove={(i) => removeFromArray('tier1Categories', i)}
              onMove={(i, dir) => moveInArray('tier1Categories', i, dir)}
              render={(it, i) => (
                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <IconBox
                    icon={it.icon}
                    onChange={(icon) => updateArray<CareersTier1Category>('tier1Categories', i, { icon })}
                  />
                  <Field label="名稱">
                    <input className="input-base" value={it.label} onChange={(e) => updateArray<CareersTier1Category>('tier1Categories', i, { label: e.target.value })} />
                  </Field>
                </div>
              )}
            />
          </div>
        </div>
      </SectionCard>

      {/* === Section 5 — Work Life Balance === */}
      <SectionCard title="⑤ Work Life Balance" hint="三張特色卡（建議 3 項）。">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <Field label="小標籤">
            <input className="input-base" value={data.wlbEyebrow} onChange={(e) => set('wlbEyebrow', e.target.value)} />
          </Field>
          <Field label="標題（前段）">
            <input className="input-base" value={data.wlbTitleLine} onChange={(e) => set('wlbTitleLine', e.target.value)} />
          </Field>
          <Field label="標題（橘色高亮）">
            <input className="input-base" value={data.wlbTitleHighlight} onChange={(e) => set('wlbTitleHighlight', e.target.value)} />
          </Field>
        </div>
        <Field label="段落引言">
          <textarea className="input-base min-h-[70px]" value={data.wlbIntro} onChange={(e) => set('wlbIntro', e.target.value)} />
        </Field>

        <Repeater
          label="特色卡片"
          items={data.wlbHighlights}
          onAdd={() => addToArray<CareersWLBHighlight>('wlbHighlights', { icon: 'star', title: '', desc: '' })}
          onRemove={(i) => removeFromArray('wlbHighlights', i)}
          onMove={(i, dir) => moveInArray('wlbHighlights', i, dir)}
          render={(it, i) => (
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <IconBox
                icon={it.icon}
                onChange={(icon) => updateArray<CareersWLBHighlight>('wlbHighlights', i, { icon })}
              />
              <div className="space-y-2">
                <Field label="標題">
                  <input className="input-base" value={it.title} onChange={(e) => updateArray<CareersWLBHighlight>('wlbHighlights', i, { title: e.target.value })} />
                </Field>
                <Field label="描述">
                  <textarea className="input-base min-h-[60px]" value={it.desc} onChange={(e) => updateArray<CareersWLBHighlight>('wlbHighlights', i, { desc: e.target.value })} />
                </Field>
              </div>
            </div>
          )}
        />
      </SectionCard>

      {/* === CTA === */}
      <SectionCard title="⑥ 投履歷 CTA" hint="頁面最下方綠色大卡片 + 行動按鈕。">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="小標籤">
            <input className="input-base" value={data.ctaEyebrow} onChange={(e) => set('ctaEyebrow', e.target.value)} />
          </Field>
          <Field label="標題">
            <input className="input-base" value={data.ctaTitle} onChange={(e) => set('ctaTitle', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="說明">
              <textarea className="input-base min-h-[60px]" value={data.ctaDesc} onChange={(e) => set('ctaDesc', e.target.value)} />
            </Field>
          </div>
          <Field label="按鈕文字">
            <input className="input-base" value={data.ctaButtonText} onChange={(e) => set('ctaButtonText', e.target.value)} />
          </Field>
          <Field label="按鈕連結（含 https://）">
            <input className="input-base" value={data.ctaButtonUrl} onChange={(e) => set('ctaButtonUrl', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* === Sticky save bar === */}
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

// ===== UI primitives =====

function SectionCard({
  title,
  hint,
  onSave,
  saving,
  children,
}: {
  title: string;
  hint?: string;
  onSave?: () => void;
  saving?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-line gap-3">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          {hint && <p className="text-xs text-ink-500 mt-0.5">{hint}</p>}
        </div>
        {onSave && (
          <button onClick={onSave} disabled={saving} className="btn btn-primary text-sm shrink-0">
            {saving ? '儲存中...' : '儲存全部'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
    </div>
  );
}

function ImageUploader({
  url,
  uploading,
  onPick,
  onUrlChange,
  ratioClass = 'aspect-[16/9]',
}: {
  url: string;
  uploading: boolean;
  onPick: (file: File) => void;
  onUrlChange: (url: string) => void;
  ratioClass?: string;
}) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className={`w-full ${ratioClass} object-cover rounded-lg border border-line bg-paper-2`}
      />
      <label
        className={`mt-2 btn btn-secondary text-xs w-full cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {uploading ? '上傳中...' : '更換圖片'}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) onPick(e.target.files[0]);
            e.target.value = '';
          }}
        />
      </label>
      <input
        className="input-base mt-1.5 !text-xs"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="或直接貼上圖片網址"
      />
    </div>
  );
}

function IconBox({ icon, onChange }: { icon: string; onChange: (icon: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full aspect-square rounded-lg bg-brand-green-50 grid place-items-center hover:bg-brand-green-50/70 transition border border-line"
        title="點擊更換圖示"
      >
        <MaterialIcon name={icon} className="!text-3xl text-brand-green-700" />
      </button>
      <input
        className="input-base mt-1.5 !py-1 !text-xs text-center"
        value={icon}
        onChange={(e) => onChange(e.target.value)}
        placeholder="icon"
      />
      {open && (
        <div className="absolute z-10 left-0 top-[calc(100%+8px)] w-72 max-h-72 overflow-y-auto bg-white border border-line rounded-xl shadow-lg p-3 grid grid-cols-5 gap-2">
          {CAREERS_BENEFIT_ICON_PRESETS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => { onChange(name); setOpen(false); }}
              className="aspect-square rounded-lg hover:bg-brand-green-50 grid place-items-center"
              title={name}
            >
              <MaterialIcon name={name} className="!text-2xl text-ink-700" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Repeater<T>({
  label,
  items,
  onAdd,
  onRemove,
  onMove,
  render,
}: {
  label: string;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-sm text-ink-700">{label}</p>
        <button type="button" onClick={onAdd} className="btn btn-secondary text-xs">+ 新增一項</button>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="border border-line rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-ink-500 font-bold">#{i + 1}</span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0}
                  className="text-xs border border-line rounded-lg px-2.5 py-1 disabled:opacity-30 hover:border-brand-green-500">↑</button>
                <button type="button" onClick={() => onMove(i, 1)} disabled={i === items.length - 1}
                  className="text-xs border border-line rounded-lg px-2.5 py-1 disabled:opacity-30 hover:border-brand-green-500">↓</button>
                <button type="button" onClick={() => { if (confirm('確定要刪除？')) onRemove(i); }}
                  className="text-xs border border-red-200 text-red-600 rounded-lg px-2.5 py-1 hover:bg-red-50">刪除</button>
              </div>
            </div>
            {render(it, i)}
          </div>
        ))}
      </div>
    </div>
  );
}

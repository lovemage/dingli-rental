'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  REGIONS,
  PROPERTY_TYPES,
  BUILDING_TYPES,
  CITY_DISTRICTS,
  EQUIPMENT_OPTIONS,
  FEATURE_TAGS,
} from '@/data/taiwan-addresses';
import type { Taxonomies } from '@/lib/taxonomies';

const RENT_PRESETS: { label: string; min?: string; max?: string }[] = [
  { label: '不限' },
  { label: '1 萬以下', max: '10000' },
  { label: '1 - 1.5 萬', min: '10000', max: '15000' },
  { label: '1.5 - 2 萬', min: '15000', max: '20000' },
  { label: '2 - 3 萬', min: '20000', max: '30000' },
  { label: '3 - 5 萬', min: '30000', max: '50000' },
  { label: '5 萬以上', min: '50000' },
];

const AREA_PRESETS: { label: string; min?: string; max?: string }[] = [
  { label: '不限' },
  { label: '10 坪以下', max: '10' },
  { label: '10 - 20 坪', min: '10', max: '20' },
  { label: '20 - 30 坪', min: '20', max: '30' },
  { label: '30 - 50 坪', min: '30', max: '50' },
  { label: '50 坪以上', min: '50' },
];

const ROOMS_PRESETS = [
  { label: '不限', value: '' },
  { label: '1 房', value: '1' },
  { label: '2 房', value: '2' },
  { label: '3 房', value: '3' },
  { label: '4 房以上', value: '4' },
];

const AGE_PRESETS = [
  { label: '不限', value: '' },
  { label: '3 年內', value: '3' },
  { label: '10 年內', value: '10' },
  { label: '20 年內', value: '20' },
];

const SORT_OPTIONS = [
  { label: '預設（精選優先）', value: '' },
  { label: '最新刊登', value: 'newest' },
  { label: '租金低 → 高', value: 'rent_asc' },
  { label: '租金高 → 低', value: 'rent_desc' },
  { label: '坪數大 → 小', value: 'area_desc' },
  { label: '屋齡新 → 舊', value: 'age_asc' },
];

export type PropertyFiltersValue = {
  region: string;
  district: string;
  type: string;
  building: string;
  minRent: string;
  maxRent: string;
  minArea: string;
  maxArea: string;
  rooms: string;
  ageMax: string;
  elevator: string;
  pets: string;
  cooking: string;
  tags: string;
  equipment: string;
  q: string;
  sort: string;
};

export const EMPTY_FILTERS: PropertyFiltersValue = {
  region: '', district: '', type: '', building: '',
  minRent: '', maxRent: '', minArea: '', maxArea: '',
  rooms: '', ageMax: '',
  elevator: '', pets: '', cooking: '',
  tags: '', equipment: '',
  q: '', sort: '',
};

function rentPresetIndex(min: string, max: string): number {
  return RENT_PRESETS.findIndex((p) => (p.min || '') === min && (p.max || '') === max);
}

function areaPresetIndex(min: string, max: string): number {
  return AREA_PRESETS.findIndex((p) => (p.min || '') === min && (p.max || '') === max);
}

type FiltersProps = {
  total: number;
  taxonomies?: Partial<Taxonomies>;
};

export default function PropertyFilters({ total, taxonomies }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const TYPES = taxonomies?.propertyTypes?.length ? taxonomies.propertyTypes : (PROPERTY_TYPES as readonly string[]);
  const BLDS  = taxonomies?.buildingTypes?.length ? taxonomies.buildingTypes : (BUILDING_TYPES as readonly string[]);
  const EQUIP = taxonomies?.equipment?.length ? taxonomies.equipment : (EQUIPMENT_OPTIONS as readonly string[]);
  const POLICY = taxonomies?.policyTags?.length ? taxonomies.policyTags : (FEATURE_TAGS as readonly string[]);

  const v = useMemo<PropertyFiltersValue>(() => ({
    region: searchParams.get('region') || '',
    district: searchParams.get('district') || '',
    type: searchParams.get('type') || '',
    building: searchParams.get('building') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    rooms: searchParams.get('rooms') || '',
    ageMax: searchParams.get('ageMax') || '',
    elevator: searchParams.get('elevator') || '',
    pets: searchParams.get('pets') || '',
    cooking: searchParams.get('cooking') || '',
    tags: searchParams.get('tags') || '',
    equipment: searchParams.get('equipment') || '',
    q: searchParams.get('q') || '',
    sort: searchParams.get('sort') || '',
  }), [searchParams]);

  useEffect(() => { setKeyword(v.q); }, [v.q]);

  const districts = v.region ? CITY_DISTRICTS[v.region] || [] : [];

  function pushFilters(next: Partial<PropertyFiltersValue>, opts?: { resetPage?: boolean }) {
    const merged = { ...v, ...next };
    const params = new URLSearchParams();
    (Object.keys(merged) as (keyof PropertyFiltersValue)[]).forEach((k) => {
      if (merged[k]) params.set(k, merged[k]);
    });
    if (!opts || opts.resetPage !== false) {
      params.delete('page');
    }
    router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function reset() {
    router.push('/properties');
  }

  const activeCount = useMemo(() => {
    let n = 0;
    if (v.region) n++;
    if (v.district) n++;
    if (v.type) n++;
    if (v.building) n++;
    if (v.minRent || v.maxRent) n++;
    if (v.minArea || v.maxArea) n++;
    if (v.rooms) n++;
    if (v.ageMax) n++;
    if (v.elevator) n++;
    if (v.pets) n++;
    if (v.cooking) n++;
    if (v.tags) n++;
    if (v.equipment) n++;
    if (v.q) n++;
    return n;
  }, [v]);

  const tagsArr = v.tags ? v.tags.split(',').filter(Boolean) : [];
  const eqArr = v.equipment ? v.equipment.split(',').filter(Boolean) : [];

  function toggleInList(current: string[], item: string): string {
    const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
    return next.join(',');
  }

  return (
    <div className="sticky top-16 z-20 bg-paper/85 backdrop-blur-md border-b border-line py-4 -mt-4 -mx-6 px-6 sm:rounded-none">
      {/* 第一列：關鍵字 + chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <form
          className="flex-1 min-w-[200px] max-w-md"
          onSubmit={(e) => { e.preventDefault(); pushFilters({ q: keyword.trim() }); }}
        >
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋路名、社區、物件名"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-line bg-white focus:outline-none focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">🔍</span>
          </div>
        </form>

        <ChipSelect
          label="縣市"
          value={v.region}
          options={[{ label: '不限', value: '' }, ...REGIONS.map((r) => ({ label: r, value: r }))]}
          onChange={(val) => pushFilters({ region: val, district: '' })}
        />

        {v.region && districts.length > 0 && (
          <ChipSelect
            label="區域"
            value={v.district}
            options={[{ label: '不限', value: '' }, ...districts.map((d) => ({ label: d, value: d }))]}
            onChange={(val) => pushFilters({ district: val })}
          />
        )}

        <ChipSelect
          label="類型"
          value={v.type}
          options={[{ label: '不限', value: '' }, ...PROPERTY_TYPES.map((t) => ({ label: t, value: t }))]}
          onChange={(val) => pushFilters({ type: val })}
        />

        <ChipPreset
          label="租金"
          presets={RENT_PRESETS}
          activeIdx={rentPresetIndex(v.minRent, v.maxRent)}
          onPick={(p) => pushFilters({ minRent: p.min || '', maxRent: p.max || '' })}
          formatActive={(idx) => idx > 0 ? RENT_PRESETS[idx].label : ''}
        />

        <ChipSelect
          label="房型"
          value={v.rooms}
          options={ROOMS_PRESETS}
          onChange={(val) => pushFilters({ rooms: val })}
          formatActive={(opt) => opt.label}
        />

        <ChipPreset
          label="坪數"
          presets={AREA_PRESETS}
          activeIdx={areaPresetIndex(v.minArea, v.maxArea)}
          onPick={(p) => pushFilters({ minArea: p.min || '', maxArea: p.max || '' })}
          formatActive={(idx) => idx > 0 ? AREA_PRESETS[idx].label : ''}
        />

        <button
          type="button"
          onClick={() => setAdvancedOpen((s) => !s)}
          className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition ${advancedOpen ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
        >
          更多篩選 {advancedOpen ? '▴' : '▾'}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-sm text-ink-500 hover:text-brand-green-700 underline ml-1"
          >
            清除（{activeCount}）
          </button>
        )}
      </div>

      {/* 第二列：結果數 + 排序 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <p className="text-sm text-ink-500">
          共 <span className="font-bold text-ink-900">{total}</span> 筆物件
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-500">排序</span>
          <select
            className="bg-white border border-line rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-brand-green-500"
            value={v.sort}
            onChange={(e) => pushFilters({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* 進階篩選抽屜 */}
      {advancedOpen && (
        <div className="mt-4 bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FilterGroup title="建物">
              <Pills
                options={[{ label: '不限', value: '' }, ...BUILDING_TYPES.map((b) => ({ label: b, value: b }))]}
                value={v.building}
                onChange={(val) => pushFilters({ building: val })}
              />
            </FilterGroup>

            <FilterGroup title="屋齡">
              <Pills
                options={AGE_PRESETS}
                value={v.ageMax}
                onChange={(val) => pushFilters({ ageMax: val })}
              />
            </FilterGroup>

            <FilterGroup title="必備條件">
              <div className="flex flex-wrap gap-2">
                <ToggleChip label="電梯" active={v.elevator === '1'} onClick={() => pushFilters({ elevator: v.elevator === '1' ? '' : '1' })} />
                <ToggleChip label="寵物友善" active={v.pets === '1'} onClick={() => pushFilters({ pets: v.pets === '1' ? '' : '1' })} />
                <ToggleChip label="可開伙" active={v.cooking === '1'} onClick={() => pushFilters({ cooking: v.cooking === '1' ? '' : '1' })} />
              </div>
            </FilterGroup>

            <FilterGroup title="設備（任一）">
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt}
                    label={opt}
                    active={eqArr.includes(opt)}
                    onClick={() => pushFilters({ equipment: toggleInList(eqArr, opt) })}
                  />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="特色標籤" colSpan={2}>
              <div className="flex flex-wrap gap-2">
                {FEATURE_TAGS.map((opt) => (
                  <ToggleChip
                    key={opt}
                    label={opt}
                    active={tagsArr.includes(opt)}
                    onClick={() => pushFilters({ tags: toggleInList(tagsArr, opt) })}
                  />
                ))}
              </div>
            </FilterGroup>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 子元件 ─────────────────────────────────────────────────────────

type Option = { label: string; value: string };

function ChipSelect({
  label,
  value,
  options,
  onChange,
  formatActive,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  formatActive?: (opt: Option) => string;
}) {
  const active = !!value;
  const current = options.find((o) => o.value === value);
  const display = active && current
    ? (formatActive ? formatActive(current) : current.label)
    : label;

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3.5 pr-7 py-1.5 text-sm font-medium rounded-full border cursor-pointer transition ${active ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
      >
        <option value="" hidden>{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${active ? 'text-white' : 'text-ink-500'}`}>▾</span>
      {active && (
        <span className="pointer-events-none absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center px-3 text-sm font-medium text-white">
          {display}
        </span>
      )}
    </div>
  );
}

function ChipPreset({
  label,
  presets,
  activeIdx,
  onPick,
  formatActive,
}: {
  label: string;
  presets: { label: string; min?: string; max?: string }[];
  activeIdx: number;
  onPick: (p: { min?: string; max?: string }) => void;
  formatActive: (idx: number) => string;
}) {
  const active = activeIdx > 0;
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-full border transition ${active ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
      >
        {active ? formatActive(activeIdx) : label}
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-line rounded-xl shadow-lg p-1.5 z-50 min-w-[160px]">
          {presets.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { onPick(p); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg ${i === activeIdx ? 'bg-brand-green-50 text-brand-green-900 font-medium' : 'hover:bg-paper-2'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children, colSpan = 1 }: { title: string; children: React.ReactNode; colSpan?: 1 | 2 }) {
  return (
    <div className={colSpan === 2 ? 'sm:col-span-2' : ''}>
      <h4 className="text-xs font-bold text-ink-500 mb-2 tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`text-sm font-medium px-3 py-1.5 rounded-full border transition ${value === o.value ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-medium px-3 py-1.5 rounded-full border transition ${active ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
    >
      {label}
    </button>
  );
}

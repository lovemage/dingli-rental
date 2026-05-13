'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  REGION_OPTIONS,
  PROPERTY_TYPES,
  BUILDING_TYPES,
  CITY_DISTRICTS,
  EQUIPMENT_OPTIONS,
  FEATURE_TAGS,
} from '@/data/taiwan-addresses';
import type { Taxonomies } from '@/lib/taxonomies-shared';
import AiChatWidget from '@/components/frontend/AiChatWidget';

const RENT_PRESETS: { labelKey: string; min?: string; max?: string }[] = [
  { labelKey: 'noLimit' },
  { labelKey: 'rent_le_10k', max: '10000' },
  { labelKey: 'rent_10_15k', min: '10000', max: '15000' },
  { labelKey: 'rent_15_20k', min: '15000', max: '20000' },
  { labelKey: 'rent_20_30k', min: '20000', max: '30000' },
  { labelKey: 'rent_30_50k', min: '30000', max: '50000' },
  { labelKey: 'rent_ge_50k', min: '50000' },
];

const AREA_PRESETS: { labelKey: string; min?: string; max?: string }[] = [
  { labelKey: 'noLimit' },
  { labelKey: 'area_le_10', max: '10' },
  { labelKey: 'area_10_20', min: '10', max: '20' },
  { labelKey: 'area_20_30', min: '20', max: '30' },
  { labelKey: 'area_30_50', min: '30', max: '50' },
  { labelKey: 'area_ge_50', min: '50' },
];

const ROOMS_PRESETS = [
  { labelKey: 'noLimit', value: '' },
  { labelKey: 'rooms_1', value: '1' },
  { labelKey: 'rooms_2', value: '2' },
  { labelKey: 'rooms_3', value: '3' },
  { labelKey: 'rooms_4plus', value: '4' },
];

// 屋齡：max-only 區間（min 維持 0），custom 模式由 minAge/maxAge 兩個欄位精確控制
const AGE_PRESETS: { labelKey: string; min?: string; max?: string }[] = [
  { labelKey: 'noLimit' },
  { labelKey: 'age_le_3', max: '3' },
  { labelKey: 'age_le_10', max: '10' },
  { labelKey: 'age_le_20', max: '20' },
];

const SORT_OPTIONS = [
  { labelKey: 'sortDefault', value: '' },
  { labelKey: 'sortNewest', value: 'newest' },
  { labelKey: 'sortRentAsc', value: 'rent_asc' },
  { labelKey: 'sortRentDesc', value: 'rent_desc' },
  { labelKey: 'sortAreaDesc', value: 'area_desc' },
  { labelKey: 'sortAgeAsc', value: 'age_asc' },
];

export type PropertyFiltersValue = {
  region: string;
  district: string;
  type: string;          // 改為支援多選：以逗號分隔
  building: string;
  minRent: string;
  maxRent: string;
  minArea: string;
  maxArea: string;
  rooms: string;
  minAge: string;        // 新增：屋齡下限
  ageMax: string;        // 屋齡上限
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
  rooms: '', minAge: '', ageMax: '',
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

function agePresetIndex(min: string, max: string): number {
  if (min) return -1; // 自訂下限就不算 preset
  return AGE_PRESETS.findIndex((p) => (p.max || '') === max);
}

type FiltersProps = {
  total: number;
  taxonomies?: Partial<Taxonomies>;
};

export default function PropertyFilters({ total, taxonomies }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('propertyFilters');
  const tRegions = useTranslations('regions');
  const locale = useLocale();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // RSC navigation 標記為 transition，讓 chip 點擊立即視覺更新，路由切換在背景
  const [, startTransition] = useTransition();

  const TYPES = taxonomies?.propertyTypes?.length ? taxonomies.propertyTypes : (PROPERTY_TYPES as readonly string[]);
  const BLDS = taxonomies?.buildingTypes?.length ? taxonomies.buildingTypes : (BUILDING_TYPES as readonly string[]);
  const EQUIP = taxonomies?.equipment?.length ? taxonomies.equipment : (EQUIPMENT_OPTIONS as readonly string[]);
  const POLICY = taxonomies?.policyTags?.length ? taxonomies.policyTags : (FEATURE_TAGS as readonly string[]);

  // URL state（route 真正生效的值）
  const urlValue = useMemo<PropertyFiltersValue>(() => ({
    region: searchParams.get('region') || '',
    district: searchParams.get('district') || '',
    type: searchParams.get('type') || '',
    building: searchParams.get('building') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    rooms: searchParams.get('rooms') || '',
    minAge: searchParams.get('minAge') || '',
    ageMax: searchParams.get('ageMax') || '',
    elevator: searchParams.get('elevator') || '',
    pets: searchParams.get('pets') || '',
    cooking: searchParams.get('cooking') || '',
    tags: searchParams.get('tags') || '',
    equipment: searchParams.get('equipment') || '',
    q: searchParams.get('q') || '',
    sort: searchParams.get('sort') || '',
  }), [searchParams]);

  // 本地 draft：吸收快速連點，避免「stale closure → 第二次點擊用舊 URL 算出錯誤 next」
  // 連續操作（例如複選 type）一律以 draft 為基準合併，再批次 replace URL。
  const [draft, setDraft] = useState<PropertyFiltersValue>(urlValue);
  // URL 變動時（例如外部 router、上一頁、reset）同步 draft，避免顯示與 URL 不一致
  useEffect(() => {
    setDraft(urlValue);
  }, [urlValue]);

  // display 用的 v 一律走 draft（chip 點擊立刻變色，URL 變動慢一點也不影響使用者）
  const v = draft;

  const districts = v.region ? CITY_DISTRICTS[v.region] || [] : [];

  const propertiesPath = locale === 'zh' ? '/properties' : `/${locale}/properties`;

  function pushFilters(next: Partial<PropertyFiltersValue>, opts?: { resetPage?: boolean }) {
    // 用 functional setState 確保以「最新 draft」為基準合併，吸收快速連點
    setDraft((prev) => {
      const merged = { ...prev, ...next };
      const params = new URLSearchParams();
      (Object.keys(merged) as (keyof PropertyFiltersValue)[]).forEach((k) => {
        if (merged[k]) params.set(k, merged[k]);
      });
      if (!opts || opts.resetPage !== false) {
        params.delete('page');
      }
      // replace + transition：avoid history 堆積，並讓 UI 維持互動順暢
      startTransition(() => {
        router.replace(`${propertiesPath}${params.toString() ? `?${params.toString()}` : ''}`);
      });
      return merged;
    });
  }

  function reset() {
    setDraft(EMPTY_FILTERS);
    startTransition(() => {
      router.replace(propertiesPath);
    });
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
    if (v.minAge || v.ageMax) n++;
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
  const typeArr = v.type ? v.type.split(',').filter(Boolean) : [];

  function toggleInList(current: string[], item: string): string {
    const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
    return next.join(',');
  }

  return (
    <div className="sticky top-16 z-20 bg-paper border-b border-line py-4 -mt-4 -mx-6 px-6 sm:rounded-none shadow-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <form
          className="flex-1 min-w-[200px] max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const q = String(form.get('q') || '').trim();
            pushFilters({ q });
          }}
        >
          <div className="relative">
            <input
              name="q"
              type="text"
              defaultValue={v.q}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-line bg-white focus:outline-none focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">🔍</span>
          </div>
        </form>

        <ChipSelect
          label={t('regionLabel')}
          value={v.region}
          options={[
            { label: t('noLimit'), value: '' },
            ...REGION_OPTIONS.map((r) => ({ label: tRegions(r.labelKey), value: r.value })),
          ]}
          onChange={(val) => pushFilters({ region: val, district: '' })}
        />

        {v.region && districts.length > 0 && (
          <ChipSelect
            label={t('districtLabel')}
            value={v.district}
            options={[{ label: t('noLimit'), value: '' }, ...districts.map((d) => ({ label: d, value: d }))]}
            onChange={(val) => pushFilters({ district: val })}
          />
        )}

        <ChipMultiSelect
          label={t('typeLabel')}
          options={TYPES.map((tp) => ({ label: tp, value: tp }))}
          selected={typeArr}
          onChange={(arr) => pushFilters({ type: arr.join(',') })}
          allLabel={t('noLimit')}
        />

        <ChipPreset
          label={t('rentLabel')}
          presets={RENT_PRESETS.map((p) => ({ ...p, label: t(p.labelKey) }))}
          activeIdx={rentPresetIndex(v.minRent, v.maxRent)}
          currentMin={v.minRent}
          currentMax={v.maxRent}
          onPick={(p) => pushFilters({ minRent: p.min || '', maxRent: p.max || '' })}
          customLabel={t('customRange')}
          unitLabel={t('rentUnit')}
        />

        <ChipSelect
          label={t('roomsLabel')}
          value={v.rooms}
          options={ROOMS_PRESETS.map((p) => ({ label: t(p.labelKey), value: p.value }))}
          onChange={(val) => pushFilters({ rooms: val })}
          formatActive={(opt) => opt.label}
        />

        <ChipPreset
          label={t('areaLabel')}
          presets={AREA_PRESETS.map((p) => ({ ...p, label: t(p.labelKey) }))}
          activeIdx={areaPresetIndex(v.minArea, v.maxArea)}
          currentMin={v.minArea}
          currentMax={v.maxArea}
          onPick={(p) => pushFilters({ minArea: p.min || '', maxArea: p.max || '' })}
          customLabel={t('customRange')}
          unitLabel={t('areaUnit')}
        />

        <button
          type="button"
          onClick={() => setAdvancedOpen((s) => !s)}
          className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition ${advancedOpen ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
        >
          {t('filterTitle')} {advancedOpen ? '▴' : '▾'}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-sm text-ink-500 hover:text-brand-green-700 underline ml-1"
          >
            {t('resetFilters')}（{activeCount}）
          </button>
        )}

        <div className="ml-auto">
          <AiChatWidget
            triggerLabel={t('aiButton')}
            triggerClassName="ai-glow-btn text-sm font-extrabold px-3.5 py-1.5 rounded-full bg-brand-green-700 text-white hover:bg-brand-green-900 transition shadow-sm whitespace-nowrap"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <p className="text-sm text-ink-500">
          {t('totalCount', { count: total })}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-500">{t('sortLabel')}</span>
          <select
            className="bg-white border border-line rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-brand-green-500"
            value={v.sort}
            onChange={(e) => pushFilters({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
            ))}
          </select>
        </label>
      </div>

      {advancedOpen && (
        <div className="mt-4 bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FilterGroup title={t('buildingLabel')}>
              <Pills
                options={[{ label: t('noLimit'), value: '' }, ...BLDS.map((b) => ({ label: b, value: b }))]}
                value={v.building}
                onChange={(val) => pushFilters({ building: val })}
              />
            </FilterGroup>

            <FilterGroup title={t('ageLabel')}>
              <RangePresetGroup
                presets={AGE_PRESETS.map((p) => ({ ...p, label: t(p.labelKey) }))}
                activeIdx={agePresetIndex(v.minAge, v.ageMax)}
                currentMin={v.minAge}
                currentMax={v.ageMax}
                onPick={(p) => pushFilters({ minAge: p.min || '', ageMax: p.max || '' })}
                customLabel={t('customRange')}
                unitLabel={t('ageUnit')}
              />
            </FilterGroup>

            <FilterGroup title={t('amenitiesLabel')}>
              <div className="flex flex-wrap gap-2">
                <ToggleChip label={t('elevatorLabel')} active={v.elevator === '1'} onClick={() => pushFilters({ elevator: v.elevator === '1' ? '' : '1' })} />
                <ToggleChip label={t('petsLabel')} active={v.pets === '1'} onClick={() => pushFilters({ pets: v.pets === '1' ? '' : '1' })} />
                <ToggleChip label={t('cookingLabel')} active={v.cooking === '1'} onClick={() => pushFilters({ cooking: v.cooking === '1' ? '' : '1' })} />
              </div>
            </FilterGroup>

            <FilterGroup title={t('equipmentLabel')}>
              <div className="flex flex-wrap gap-2">
                {EQUIP.map((opt) => (
                  <ToggleChip
                    key={opt}
                    label={opt}
                    active={eqArr.includes(opt)}
                    onClick={() => pushFilters({ equipment: toggleInList(eqArr, opt) })}
                  />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title={t('tagsLabel')} colSpan={2}>
              <div className="flex flex-wrap gap-2">
                {POLICY.map((opt) => (
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
  currentMin,
  currentMax,
  onPick,
  customLabel,
  unitLabel,
}: {
  label: string;
  presets: { label: string; min?: string; max?: string }[];
  activeIdx: number;
  currentMin?: string;
  currentMax?: string;
  onPick: (p: { min?: string; max?: string }) => void;
  customLabel?: string;
  unitLabel?: string;
}) {
  // -1 (preset 找不到對應，代表自訂值) 或 > 0 (非「不限」)
  const isCustom = activeIdx < 0 && (!!currentMin || !!currentMax);
  const active = activeIdx > 0 || isCustom;
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

  const displayLabel = isCustom
    ? `${currentMin || '0'}–${currentMax || '∞'}`
    : active
      ? presets[activeIdx].label
      : label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-full border transition ${active ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
      >
        {displayLabel}
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-line rounded-xl shadow-lg p-1.5 z-50 min-w-[180px]">
          {presets.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { onPick(p); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg ${i === activeIdx && !isCustom ? 'bg-brand-green-50 text-brand-green-900 font-medium' : 'hover:bg-paper-2'}`}
            >
              {p.label}
            </button>
          ))}
          {customLabel && (
            <CustomRangeInput
              label={customLabel}
              unit={unitLabel}
              initialMin={currentMin}
              initialMax={currentMax}
              isActive={isCustom}
              onApply={(min, max) => { onPick({ min, max }); setOpen(false); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CustomRangeInput({
  label,
  unit,
  initialMin,
  initialMax,
  isActive,
  onApply,
}: {
  label: string;
  unit?: string;
  initialMin?: string;
  initialMax?: string;
  isActive: boolean;
  onApply: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(initialMin || '');
  const [max, setMax] = useState(initialMax || '');

  function apply() {
    let lo = min.trim();
    let hi = max.trim();
    // 若兩端都有值且 lo > hi 自動 swap，避免使用者送出後變成 0 筆結果而不知為何
    if (lo && hi) {
      const ln = Number(lo);
      const hn = Number(hi);
      if (Number.isFinite(ln) && Number.isFinite(hn) && ln > hn) {
        [lo, hi] = [hi, lo];
        setMin(lo);
        setMax(hi);
      }
    }
    onApply(lo, hi);
  }

  return (
    <div className={`mt-1 px-3 py-2 border-t border-line ${isActive ? 'bg-brand-green-50/40' : ''}`}>
      <p className="text-[11px] font-bold text-ink-500 mb-1.5">{label}{unit ? `（${unit}）` : ''}</p>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min"
          className="w-20 px-2 py-1 text-sm rounded border border-line focus:outline-none focus:border-brand-green-500"
        />
        <span className="text-ink-400 text-sm">–</span>
        <input
          type="number"
          min="0"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          className="w-20 px-2 py-1 text-sm rounded border border-line focus:outline-none focus:border-brand-green-500"
        />
        <button
          type="button"
          onClick={apply}
          className="ml-1 text-xs font-bold px-2.5 py-1 rounded bg-brand-green-700 text-white hover:bg-brand-green-900"
        >
          ✓
        </button>
      </div>
    </div>
  );
}

function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
  allLabel,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  allLabel: string;
}) {
  const active = selected.length > 0;
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

  const display = active
    ? selected.length === 1
      ? selected[0]
      : `${selected[0]} +${selected.length - 1}`
    : label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-full border transition ${active ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
      >
        {display}
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-line rounded-xl shadow-lg p-1.5 z-50 min-w-[160px]">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg ${!active ? 'bg-brand-green-50 text-brand-green-900 font-medium' : 'hover:bg-paper-2'}`}
          >
            {allLabel}
          </button>
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(checked ? selected.filter((x) => x !== o.value) : [...selected, o.value])}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-sm rounded-lg ${checked ? 'bg-brand-green-50 text-brand-green-900 font-medium' : 'hover:bg-paper-2'}`}
              >
                <span>{o.label}</span>
                {checked && <span className="text-brand-green-700">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 進階區塊用：用 Pills 一字排開 + 一個「自訂」chip 觸發 popover
function RangePresetGroup({
  presets,
  activeIdx,
  currentMin,
  currentMax,
  onPick,
  customLabel,
  unitLabel,
}: {
  presets: { label: string; min?: string; max?: string }[];
  activeIdx: number;
  currentMin: string;
  currentMax: string;
  onPick: (p: { min?: string; max?: string }) => void;
  customLabel: string;
  unitLabel?: string;
}) {
  const isCustom = activeIdx < 0 && (!!currentMin || !!currentMax);
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map((p, i) => (
        <button
          key={p.label}
          type="button"
          onClick={() => { onPick(p); setShowCustom(false); }}
          className={`text-sm font-medium px-3 py-1.5 rounded-full border transition ${i === activeIdx && !isCustom ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setShowCustom((s) => !s)}
        className={`text-sm font-medium px-3 py-1.5 rounded-full border transition ${isCustom ? 'bg-brand-green-700 text-white border-brand-green-700' : 'bg-white text-ink-700 border-line hover:border-brand-green-500'}`}
      >
        {isCustom ? `${currentMin || '0'}–${currentMax || '∞'}` : customLabel}
      </button>
      {showCustom && (
        <div className="w-full">
          <CustomRangeInput
            label={customLabel}
            unit={unitLabel}
            initialMin={currentMin}
            initialMax={currentMax}
            isActive={isCustom}
            onApply={(min, max) => { onPick({ min, max }); setShowCustom(false); }}
          />
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

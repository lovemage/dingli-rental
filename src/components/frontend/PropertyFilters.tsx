'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  REGIONS,
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

const AGE_PRESETS = [
  { labelKey: 'noLimit', value: '' },
  { labelKey: 'age_le_3', value: '3' },
  { labelKey: 'age_le_10', value: '10' },
  { labelKey: 'age_le_20', value: '20' },
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('propertyFilters');
  const locale = useLocale();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const TYPES = taxonomies?.propertyTypes?.length ? taxonomies.propertyTypes : (PROPERTY_TYPES as readonly string[]);
  const BLDS = taxonomies?.buildingTypes?.length ? taxonomies.buildingTypes : (BUILDING_TYPES as readonly string[]);
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

  const propertiesPath = locale === 'zh' ? '/properties' : `/${locale}/properties`;

  function pushFilters(next: Partial<PropertyFiltersValue>, opts?: { resetPage?: boolean }) {
    const merged = { ...v, ...next };
    const params = new URLSearchParams();
    (Object.keys(merged) as (keyof PropertyFiltersValue)[]).forEach((k) => {
      if (merged[k]) params.set(k, merged[k]);
    });
    if (!opts || opts.resetPage !== false) {
      params.delete('page');
    }
    router.push(`${propertiesPath}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function reset() {
    router.push(propertiesPath);
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
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-line bg-white focus:outline-none focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">🔍</span>
          </div>
        </form>

        <ChipSelect
          label={t('regionLabel')}
          value={v.region}
          options={[{ label: t('noLimit'), value: '' }, ...REGIONS.map((r) => ({ label: r, value: r }))]}
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

        <ChipSelect
          label={t('typeLabel')}
          value={v.type}
          options={[{ label: t('noLimit'), value: '' }, ...TYPES.map((tp) => ({ label: tp, value: tp }))]}
          onChange={(val) => pushFilters({ type: val })}
        />

        <ChipPreset
          label={t('rentLabel')}
          presets={RENT_PRESETS.map((p) => ({ ...p, label: t(p.labelKey) }))}
          activeIdx={rentPresetIndex(v.minRent, v.maxRent)}
          onPick={(p) => pushFilters({ minRent: p.min || '', maxRent: p.max || '' })}
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
          onPick={(p) => pushFilters({ minArea: p.min || '', maxArea: p.max || '' })}
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

            <FilterGroup title={t('ageMaxLabel')}>
              <Pills
                options={AGE_PRESETS.map((p) => ({ label: t(p.labelKey), value: p.value }))}
                value={v.ageMax}
                onChange={(val) => pushFilters({ ageMax: val })}
              />
            </FilterGroup>

            <FilterGroup title={t('filterRequired') || t('elevatorLabel')}>
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
  onPick,
}: {
  label: string;
  presets: { label: string; min?: string; max?: string }[];
  activeIdx: number;
  onPick: (p: { min?: string; max?: string }) => void;
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
        {active ? presets[activeIdx].label : label}
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

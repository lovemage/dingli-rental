'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import AiChatWidget from '@/components/frontend/AiChatWidget';
import MaterialIcon from '@/components/MaterialIcon';
import { REGION_OPTIONS } from '@/data/taiwan-addresses';

const DEFAULT_TYPE_OPTIONS = ['套房', '整層住家', '別墅', '店面', '辦公室', '其他'];

type Props = {
  propertyTypes?: string[];
};

const BUDGET_OPTIONS: { labelKey: string; min?: string; max?: string }[] = [
  { labelKey: 'budget_any' },
  { labelKey: 'budget_le_10k', max: '10000' },
  { labelKey: 'budget_10_30k', min: '10000', max: '30000' },
  { labelKey: 'budget_30_50k', min: '30000', max: '50000' },
  { labelKey: 'budget_ge_50k', min: '50000' },
];

export default function HeroSearch({ propertyTypes }: Props = {}) {
  const router = useRouter();
  const t = useTranslations('heroSearch');
  const tRegions = useTranslations('regions');
  const locale = useLocale();
  const [region, setRegion] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [typesOpen, setTypesOpen] = useState(false);
  const [budgetIdx, setBudgetIdx] = useState(0);
  const TYPE_OPTIONS = propertyTypes && propertyTypes.length ? propertyTypes : DEFAULT_TYPE_OPTIONS;
  const typesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typesOpen) return;
    function onClick(e: MouseEvent) {
      if (typesRef.current && !typesRef.current.contains(e.target as Node)) setTypesOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [typesOpen]);

  const propertiesPath = locale === 'zh' ? '/properties' : `/${locale}/properties`;

  function toggleType(tp: string) {
    setTypes((arr) => (arr.includes(tp) ? arr.filter((x) => x !== tp) : [...arr, tp]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (types.length) params.set('type', types.join(','));
    const budget = BUDGET_OPTIONS[budgetIdx];
    if (budget?.min) params.set('minRent', budget.min);
    if (budget?.max) params.set('maxRent', budget.max);
    const qs = params.toString();
    router.push(qs ? `${propertiesPath}?${qs}` : propertiesPath);
  }

  const typesDisplay = types.length === 0
    ? t('typeAll')
    : types.length === 1
      ? types[0]
      : `${types[0]} +${types.length - 1}`;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl shadow-md border border-line p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label-base">{t('regionLabel')}</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-base">
            <option value="">{t('regionAll')}</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {tRegions(r.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div ref={typesRef} className="relative">
          <label className="label-base">{t('typeLabel')}</label>
          <button
            type="button"
            onClick={() => setTypesOpen((s) => !s)}
            className="input-base text-left flex items-center justify-between"
          >
            <span className={types.length ? 'text-ink-900' : 'text-ink-400'}>{typesDisplay}</span>
            <span className="text-xs text-ink-500">▾</span>
          </button>
          {typesOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setTypes([]); setTypesOpen(false); }}
                className={`block w-full text-left px-3 py-2 text-sm ${types.length === 0 ? 'bg-brand-green-50 text-brand-green-900 font-medium' : 'hover:bg-paper-2'}`}
              >
                {t('typeAll')}
              </button>
              {TYPE_OPTIONS.map((tp) => {
                const checked = types.includes(tp);
                return (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => toggleType(tp)}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm ${checked ? 'bg-brand-green-50 text-brand-green-900 font-medium' : 'hover:bg-paper-2'}`}
                  >
                    <span>{tp}</span>
                    {checked && <span className="text-brand-green-700">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <label className="label-base">{t('budgetLabel')}</label>
          <select
            value={budgetIdx}
            onChange={(e) => setBudgetIdx(Number(e.target.value))}
            className="input-base"
          >
            {BUDGET_OPTIONS.map((b, i) => (
              <option key={b.labelKey} value={i}>
                {t(b.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-brand-orange-500 hover:bg-brand-orange-700 text-white rounded-lg w-11 h-[42px] flex-shrink-0 grid place-items-center transition shadow-sm"
            aria-label={t('searchAria')}
          >
            <MaterialIcon name="search" className="!text-xl" />
          </button>
          <AiChatWidget
            triggerLabel={t('aiButton')}
            triggerClassName="ai-glow-btn bg-brand-green-700 hover:bg-brand-green-900 text-white rounded-lg h-[42px] px-4 flex-1 inline-flex items-center justify-center font-extrabold text-sm whitespace-nowrap transition shadow-sm"
          />
        </div>
      </div>
    </form>
  );
}

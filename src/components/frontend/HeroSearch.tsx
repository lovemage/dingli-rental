'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import AiChatWidget from '@/components/frontend/AiChatWidget';
import MaterialIcon from '@/components/MaterialIcon';
import { REGION_OPTIONS } from '@/data/taiwan-addresses';

const DEFAULT_TYPE_OPTIONS = ['整層住家', '獨立套房', '分租套房', '雅房', '其他'];

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
  const [type, setType] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const TYPE_OPTIONS = propertyTypes && propertyTypes.length ? propertyTypes : DEFAULT_TYPE_OPTIONS;

  const propertiesPath = locale === 'zh' ? '/properties' : `/${locale}/properties`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (type) params.set('type', type);
    const budget = BUDGET_OPTIONS[budgetIdx];
    if (budget?.min) params.set('minRent', budget.min);
    if (budget?.max) params.set('maxRent', budget.max);
    const qs = params.toString();
    router.push(qs ? `${propertiesPath}?${qs}` : propertiesPath);
  }

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
        <div>
          <label className="label-base">{t('typeLabel')}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input-base">
            <option value="">{t('typeAll')}</option>
            {TYPE_OPTIONS.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
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

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const REGION_OPTIONS = ['台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣'];
const DEFAULT_TYPE_OPTIONS = ['整層住家', '獨立套房', '分租套房', '雅房', '其他'];

type Props = {
  propertyTypes?: string[];
};

const BUDGET_OPTIONS: { label: string; min?: string; max?: string }[] = [
  { label: '不限' },
  { label: 'NT$1萬以下', max: '10000' },
  { label: 'NT$1-3萬', min: '10000', max: '30000' },
  { label: 'NT$3-5萬', min: '30000', max: '50000' },
  { label: 'NT$5萬以上', min: '50000' },
];

export default function HeroSearch({ propertyTypes }: Props = {}) {
  const router = useRouter();
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const TYPE_OPTIONS = propertyTypes && propertyTypes.length ? propertyTypes : DEFAULT_TYPE_OPTIONS;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (type) params.set('type', type);
    const budget = BUDGET_OPTIONS[budgetIdx];
    if (budget?.min) params.set('minRent', budget.min);
    if (budget?.max) params.set('maxRent', budget.max);
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : '/properties');
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl shadow-md border border-line p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label-base">縣市</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="input-base"
          >
            <option value="">全部</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base">物件類型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-base"
          >
            <option value="">全部</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base">預算範圍</label>
          <select
            value={budgetIdx}
            onChange={(e) => setBudgetIdx(Number(e.target.value))}
            className="input-base"
          >
            {BUDGET_OPTIONS.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-orange w-full sm:w-auto justify-self-stretch">
          🔍 搜尋物件
        </button>
      </div>
    </form>
  );
}

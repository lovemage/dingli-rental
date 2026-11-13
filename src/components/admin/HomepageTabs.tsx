'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MaterialIcon from '@/components/admin/MaterialIcon';

export type HomepageTab = {
  key: string;
  label: string;
  icon: string;
  content: React.ReactNode;
};

/**
 * 首頁管理分頁：每個設定區塊各自一頁。
 * 所有分頁保持掛載（只切換顯示），切換分頁不會遺失尚未儲存的編輯；目前分頁記在網址 ?tab=。
 */
export default function HomepageTabs({ tabs }: { tabs: HomepageTab[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = tabs.some((t) => t.key === searchParams?.get('tab')) ? searchParams!.get('tab')! : tabs[0].key;
  const [active, setActive] = useState(initial);

  useEffect(() => {
    const fromUrl = searchParams?.get('tab');
    if (fromUrl && tabs.some((t) => t.key === fromUrl)) setActive(fromUrl);
  }, [searchParams, tabs]);

  function select(key: string) {
    setActive(key);
    router.replace(`${pathname}?tab=${key}`, { scroll: false });
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-line rounded-xl p-1 flex gap-1 overflow-x-auto" role="tablist">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(t.key)}
              className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isActive ? 'bg-brand-green-700 text-white shadow-sm' : 'text-ink-700 hover:bg-paper-2'
              }`}
            >
              <MaterialIcon name={t.icon} className="!text-base" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={t.key !== active} className="space-y-5">
          {t.content}
        </div>
      ))}
    </div>
  );
}

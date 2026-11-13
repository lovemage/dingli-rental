import { Suspense } from 'react';
import HeroManager from '@/components/admin/HeroManager';
import HomepageHeroTextForm from '@/components/admin/HomepageHeroTextForm';
import CategoriesForm from '@/components/admin/CategoriesForm';
import ServicesForm from '@/components/admin/ServicesForm';
import HomepageTabs from '@/components/admin/HomepageTabs';

export default function HomepageAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">首頁管理</h1>
        <p className="text-ink-500 text-sm">
          管理首頁主視覺、輪播圖、三大入口分類與服務特色。
        </p>
      </div>

      <Suspense fallback={<p className="text-ink-500">載入中...</p>}>
        <HomepageTabs
          tabs={[
            { key: 'hero-text', label: '主視覺文字', icon: 'title', content: <HomepageHeroTextForm /> },
            { key: 'slides', label: '輪播圖', icon: 'view_carousel', content: <HeroManager /> },
            { key: 'categories', label: '三大入口', icon: 'grid_view', content: <CategoriesForm /> },
            { key: 'services', label: '服務特色', icon: 'room_service', content: <ServicesForm /> },
          ]}
        />
      </Suspense>
    </div>
  );
}

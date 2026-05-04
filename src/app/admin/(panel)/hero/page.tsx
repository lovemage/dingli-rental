import HeroManager from '@/components/admin/HeroManager';
import HomepageHeroTextForm from '@/components/admin/HomepageHeroTextForm';
import CategoriesForm from '@/components/admin/CategoriesForm';
import ServicesForm from '@/components/admin/ServicesForm';

export default function HomepageAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">首頁管理</h1>
        <p className="text-ink-500 text-sm">
          管理首頁主視覺、輪播圖、三大入口分類與服務特色。
        </p>
      </div>

      <HomepageHeroTextForm />
      <HeroManager />
      <CategoriesForm />
      <ServicesForm />
    </div>
  );
}

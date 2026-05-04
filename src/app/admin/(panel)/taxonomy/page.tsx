import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function TaxonomyAdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">標籤與分類</h1>
        <p className="text-ink-500 text-sm">
          自訂物件分類選項與行銷標籤。改動後立即套用到前台篩選器與後台新增物件表單。
        </p>
      </div>
      <TaxonomyManager />
    </div>
  );
}

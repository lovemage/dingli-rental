import PropertyForm from '@/components/admin/PropertyForm';
import { getTaxonomies } from '@/lib/taxonomies';

export const dynamic = 'force-dynamic';

export default async function NewPropertyPage() {
  const taxonomies = await getTaxonomies();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">新增物件</h1>
        <p className="text-ink-500 text-sm">填寫物件資料並上傳照片</p>
      </div>
      <PropertyForm taxonomies={taxonomies} />
    </div>
  );
}

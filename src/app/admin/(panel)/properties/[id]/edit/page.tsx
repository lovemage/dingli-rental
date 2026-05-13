import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PropertyForm from '@/components/admin/PropertyForm';
import { getTaxonomies } from '@/lib/taxonomies';

export const dynamic = 'force-dynamic';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) notFound();

  const [property, taxonomies] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    }).catch(() => null),
    getTaxonomies(),
  ]);

  if (!property) notFound();

  const initial: any = {
    ...property,
    images: property.images.map((i) => i.url),
    moveInDate: property.moveInDate ? property.moveInDate.toISOString().slice(0, 10) : '',
    equipment: (property.equipment as string[]) || [],
    furniture: (property.furniture as string[]) || [],
    tenantTypes: (property.tenantTypes as string[]) || [],
    rentIncludes: (property.rentIncludes as string[]) || [],
    featureTags: (property.featureTags as string[]) || [],
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">編輯物件</h1>
          <p className="text-ink-500 text-sm">
            物件 ID: {id}
            {property.code && (
              <>
                {' '}· 編號: <span className="font-mono font-bold text-ink-700">#{property.code}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/en/properties/${id}`}
            target="_blank"
            className="btn btn-secondary text-sm"
          >
            EN
          </Link>
          <Link
            href={`/ja/properties/${id}`}
            target="_blank"
            className="btn btn-secondary text-sm"
          >
            JA
          </Link>
        </div>
      </div>
      <PropertyForm initial={initial} propertyId={id} taxonomies={taxonomies} />
    </div>
  );
}

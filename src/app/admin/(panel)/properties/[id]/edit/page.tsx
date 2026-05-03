import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PropertyForm from '@/components/admin/PropertyForm';

export const dynamic = 'force-dynamic';

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) notFound();

  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  }).catch(() => null);

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">編輯物件</h1>
        <p className="text-ink-500 text-sm">物件 ID: {id}</p>
      </div>
      <PropertyForm initial={initial} propertyId={id} />
    </div>
  );
}

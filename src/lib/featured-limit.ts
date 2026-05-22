import { prisma } from '@/lib/prisma';

export const MAX_ACTIVE_FEATURED = 6;

export async function validateActiveFeaturedLimit({
  propertyId,
  nextFeatured,
  nextStatus,
}: {
  propertyId: number;
  nextFeatured: boolean;
  nextStatus?: string;
}): Promise<string | null> {
  if (!nextFeatured) return null;

  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, featured: true, status: true },
  });
  if (!existing) return 'not found';

  const effectiveStatus = nextStatus ?? existing.status;
  if (effectiveStatus !== 'active') return null;

  if (existing.featured && existing.status === 'active') return null;

  const activeFeaturedCount = await prisma.property.count({
    where: { status: 'active', featured: true },
  });
  if (activeFeaturedCount >= MAX_ACTIVE_FEATURED) {
    return `精選上限為 ${MAX_ACTIVE_FEATURED} 筆，請先取消其他精選物件。`;
  }

  return null;
}

import { NextResponse } from 'next/server';
import { getTaxonomies } from '@/lib/taxonomies';

export const dynamic = 'force-dynamic';

export async function GET() {
  const taxonomies = await getTaxonomies();
  return NextResponse.json(taxonomies);
}

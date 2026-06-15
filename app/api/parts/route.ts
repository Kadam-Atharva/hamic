import { NextResponse } from 'next/server';
import { searchSpareParts } from '@/lib/mossParts';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';

    const start = performance.now();
    const limit = query ? 5 : 20;
    const parts = await searchSpareParts(query, category, limit);
    const latency = performance.now() - start;

    console.log(`🛠️ Spare Parts search for "${query}" completed in ${latency.toFixed(2)}ms`);

    return NextResponse.json({
      success: true,
      parts,
      latencyMs: latency
    });
  } catch (error: any) {
    if (error.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Spare parts search API error:', error);
    return NextResponse.json({ error: 'Failed to search spare parts' }, { status: 500 });
  }
}

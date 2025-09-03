// app/api/creator/analytics/heatmap/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

type ContentType = 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other';

function parseRangeToDays(raw: string | null): number {
  const r = (raw ?? '90').toLowerCase().trim();
  if (r === 'all' || r === 'gesamt' || r === '*') return 3650;
  const n = Number(r);
  return Number.isFinite(n) && n > 0 ? n : 90;
}

function normalizeType(typeRaw: string | null): ContentType | null {
  const t = (typeRaw ?? 'all').toLowerCase().trim();
  const allowed: ContentType[] = ['video', 'image', 'guide', 'blog', 'story', 'other'];
  return allowed.includes(t as ContentType) ? (t as ContentType) : null;
}

export async function GET(req: Request) {
  try {
    const supabase = createServerComponentClient();
    const { searchParams } = new URL(req.url);
    const days = parseRangeToDays(searchParams.get('range'));
    const contentType = normalizeType(searchParams.get('type'));

    const { data, error } = await supabase.rpc('creator_posting_heatmap' as any, {
      _days: days,
      _content_type: contentType,
    });

    if (error) {
      console.error('[heatmap] RPC error:', error);
      return new NextResponse(`RPC error: ${error.message}`, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error('[heatmap] route error:', e);
    return new NextResponse('Unexpected error', { status: 500 });
  }
}

// app/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name) => undefined,
      set: () => {},
      remove: () => {},
    },
  });
  await supabase.auth.getUser(); // triggert Cookie-Refresh
  return NextResponse.json({ ok: true });
}

// app/api/admin/infomaniak/dns/fix/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { applyDnsFixes, buildEmailFixPlan, evaluateDns, type FixApplyFlags } from '@/lib/infomaniak';

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: { domain?: string; apply?: FixApplyFlags } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  const domain = body.domain;
  const applyFlags: FixApplyFlags = {
    spf: true,
    dmarc: true,
    mx: true,
    apexA: false,
    wwwCname: false,
    ...(body.apply || {}),
  };

  if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 });

  try {
    const before = await evaluateDns(domain);
    const tasks = buildEmailFixPlan(before, applyFlags);
    const results = await applyDnsFixes(domain, applyFlags);
    const after = await evaluateDns(domain);

    return NextResponse.json({
      ok: true,
      tasks,
      results,
      before,
      after,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

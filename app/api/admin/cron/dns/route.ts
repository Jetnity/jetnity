// app/api/admin/cron/dns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { evaluateDns, maintainDomain, type FixApplyFlags } from '@/lib/infomaniak'
import type { TablesInsert } from '@/types/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // kein Cache

function isAuthorizedCron(req: NextRequest) {
  const fromVercel = !!req.headers.get('x-vercel-cron')
  const secret = process.env.CRON_SECRET || ''
  const headerSecret = req.headers.get('x-cron-secret') || req.headers.get('x-cron-key') || ''
  return fromVercel || (!!secret && headerSecret === secret)
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized (cron)' }, { status: 401 })
  }

  const url = new URL(req.url)

  // Domains: ?domains=jetnity.ch,example.com hat Vorrang vor ENV
  const domains = (url.searchParams.get('domains') ?? process.env.DNS_CRON_DOMAINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (domains.length === 0) {
    return NextResponse.json({ ok: false, error: 'No domains configured (DNS_CRON_DOMAINS)' }, { status: 400 })
  }

  const mode = ((url.searchParams.get('mode') ?? process.env.DNS_CRON_MODE ?? 'check').toLowerCase()) as
    | 'check'
    | 'check+fix'
  const fixWeb = (url.searchParams.get('fixWeb') ?? process.env.DNS_CRON_FIX_WEB ?? '0') === '1'

  const flags: FixApplyFlags = { spf: true, dmarc: true, mx: true, apexA: fixWeb, wwwCname: fixWeb }

  const supa = getAdminClient()
  const results: Array<{ domain: string; ok: boolean; error?: string; tasks?: any[] }> = []

  for (const domain of domains) {
    try {
      let payload:
        | { before: unknown; results: unknown; after: unknown; tasks?: any[] }
        | undefined

      if (mode === 'check') {
        const before = await evaluateDns(domain)
        payload = { before, results: null, after: before, tasks: [] }
      } else {
        payload = await maintainDomain(domain, flags)
      }

      const rowOk: TablesInsert<'dns_audit_events'> = {
        domain,
        actor: 'cron',
        mode,
        apply_flags: flags as any,
        before: payload.before as any,
        results: payload.results as any,
        after: payload.after as any,
        success: true,
        error: null,
      }
      const { error: logErr } = await supa.from('dns_audit_events').insert(rowOk)
      if (logErr) {
        results.push({ domain, ok: false, error: `audit_log_failed: ${logErr.message}` })
        continue
      }

      results.push({ domain, ok: true, tasks: payload.tasks ?? [] })
    } catch (e: any) {
      const rowFail: TablesInsert<'dns_audit_events'> = {
        domain,
        actor: 'cron',
        mode,
        apply_flags: flags as any,
        before: null,
        results: null,
        after: null,
        success: false,
        error: e?.message ?? String(e),
      }
      // Fehler beim Loggen hier bewusst nicht erneut geworfen
      await supa.from('dns_audit_events').insert(rowFail)
      results.push({ domain, ok: false, error: e?.message ?? String(e) })
    }
  }

  return NextResponse.json({ ok: true, mode, results })
}

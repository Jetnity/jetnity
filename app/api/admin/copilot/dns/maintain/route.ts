// app/api/admin/copilot/dns/maintain/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { evaluateDns, maintainDomain, type FixApplyFlags } from '@/lib/infomaniak'
import type { TablesInsert } from '@/types/supabase'

// optionaler Fallback: Admin-Session prüfen (wenn du lib/supabase/server hast)
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Mode = 'check' | 'check+fix'
type Body = {
  domains?: string[]            // Pflicht (mind. 1)
  mode?: Mode                   // 'check' | 'check+fix' (default 'check')
  apply?: Partial<FixApplyFlags>// Flags überschreiben (default: SPF/DMARC/MX=true, Web=false)
}

async function isAuthorized(req: NextRequest) {
  // 1) Interner Token (für CoPilot, Automationen)
  const headerToken = req.headers.get('x-copilot-internal-token') || ''
  const okToken = !!process.env.COPILOT_INTERNAL_TOKEN && headerToken === process.env.COPILOT_INTERNAL_TOKEN
  if (okToken) return true

  // 2) (Fallback) Admin-Session via Supabase
  try {
    const supa = createServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return false
    // benutze deine Helper-Funktion/SQL-Funktion is_admin(uid)
    const { data, error } = await supa.rpc('is_admin', { uid: user.id })
    return !error && !!data
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const domains = (body.domains ?? []).map(s => s.trim().toLowerCase()).filter(Boolean)
  if (domains.length === 0) {
    return NextResponse.json({ ok: false, error: 'domains[] required' }, { status: 400 })
  }

  const mode: Mode = (body.mode === 'check+fix' ? 'check+fix' : 'check')
  const defaultFlags: FixApplyFlags = { spf: true, dmarc: true, mx: true, apexA: false, wwwCname: false }
  const flags: FixApplyFlags = { ...defaultFlags, ...(body.apply ?? {}) }

  const supa = getAdminClient()
  const results: Array<{ domain: string; ok: boolean; error?: string; tasks?: any[] }> = []

  for (const domain of Array.from(new Set(domains))) {
    try {
      let payload:
        | { before: unknown; results: unknown; after: unknown; tasks?: any[] }

      if (mode === 'check') {
        const before = await evaluateDns(domain)
        payload = { before, results: null, after: before, tasks: [] }
      } else {
        payload = await maintainDomain(domain, flags)
      }

      const rowOk: TablesInsert<'dns_audit_events'> = {
        domain,
        actor: 'copilot',     // Herkunft markieren
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
        actor: 'copilot',
        mode,
        apply_flags: flags as any,
        before: null,
        results: null,
        after: null,
        success: false,
        error: e?.message ?? String(e),
      }
      await supa.from('dns_audit_events').insert(rowFail)
      results.push({ domain, ok: false, error: e?.message ?? String(e) })
    }
  }

  return NextResponse.json({ ok: true, mode, apply: flags, results })
}

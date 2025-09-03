// app/api/copilot/auto/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import 'server-only'
import { NextResponse } from 'next/server'
import { maybeGenerateCopilotUpload } from '@/lib/intelligence/copilot-pro.server'
import { copilotCreators } from '@/lib/intelligence/copilot-creators'
import { createServerComponentClient } from '@/lib/supabase/server'

type Options = {
  sinceDays?: number
  maxPerRegion?: number
  virtualOnly?: boolean
  dryRun?: boolean
}

const CRON_SECRET = process.env.CRON_SECRET

function parseBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
  return fallback
}
function parseNum(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : fallback
}

async function fetchRecentRegions(limit = 50): Promise<string[]> {
  // holt die zuletzt genutzten Regionen aus der DB (distinct-ish)
  const supabase = createServerComponentClient()
  const { data } = await supabase
    .from('creator_uploads')
    .select('region, created_at')
    .not('region', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  const seen = new Set<string>()
  const out: string[] = []
  for (const row of data ?? []) {
    const r = String(row.region).trim()
    if (!r || seen.has(r)) continue
    seen.add(r)
    out.push(r)
    if (out.length >= limit) break
  }
  return out
}

function regionsFromCreators(limit = 50): string[] {
  const arr = copilotCreators.map((c) => c.region.trim()).filter(Boolean)
  // einfache Dedupe
  return Array.from(new Set(arr)).slice(0, limit)
}

async function getRegions(req: Request): Promise<string[]> {
  const url = new URL(req.url)
  const qp = url.searchParams.get('regions')
  if (qp) {
    return qp
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  // POST-Body mit { regions: string[] }?
  try {
    if (req.method === 'POST') {
      const body = await req.json().catch(() => null) as { regions?: string[] } | null
      if (body?.regions?.length) {
        return body.regions.map((s) => String(s).trim()).filter(Boolean)
      }
    }
  } catch {
    // ignore body parse errors
  }

  // Fallback: erst DB, dann Creators
  const recent = await fetchRecentRegions(24)
  if (recent.length) return recent
  return regionsFromCreators(24)
}

function getOptions(req: Request): Options {
  const url = new URL(req.url)
  return {
    sinceDays: parseNum(url.searchParams.get('sinceDays'), 14),
    maxPerRegion: parseNum(url.searchParams.get('maxPerRegion'), 1),
    virtualOnly: parseBool(url.searchParams.get('virtualOnly'), true),
    dryRun: parseBool(url.searchParams.get('dryRun'), false),
  }
}

function checkSecret(req: Request): boolean {
  if (!CRON_SECRET) return true // wenn kein Secret gesetzt ist, nicht blocken (Dev)
  const url = new URL(req.url)
  const q = url.searchParams.get('secret')
  const h = req.headers.get('x-cron-secret')
  return q === CRON_SECRET || h === CRON_SECRET
}

export async function GET(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()
  const options = getOptions(req)
  const regions = await getRegions(req)

  const results = []
  for (const region of regions) {
    // bewusst sequenziell – vermeidet Rate-Limits/Quoten
    // (bei Bedarf: Promise.all mit kleiner Concurrency bauen)
    const r = await maybeGenerateCopilotUpload(region, options)
    results.push(r)
  }

  const summary = {
    ok: true,
    count: results.length,
    generated: results.filter((r) => r.action === 'generated').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
    errors: results.filter((r) => r.action === 'error').length,
    durationMs: Date.now() - t0,
    options,
    regions,
  }

  return NextResponse.json({ ...summary, results })
}

export async function POST(req: Request) {
  // POST verhält sich wie GET, erlaubt aber JSON-Body mit regions/Optionen
  if (!checkSecret(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Body-Optionen überschreiben Query-Optionen
  const url = new URL(req.url)
  const qOpts = getOptions(req)
  let bodyOpts: Partial<Options> = {}
  let bodyRegions: string[] | undefined
  try {
    const body = await req.json()
    if (body && typeof body === 'object') {
      const b = body as any
      if (Array.isArray(b.regions)) {
        bodyRegions = b.regions.map((s: any) => String(s).trim()).filter(Boolean)
      }
      bodyOpts = {
        sinceDays: typeof b.sinceDays !== 'undefined' ? parseNum(b.sinceDays, qOpts.sinceDays ?? 14) : undefined,
        maxPerRegion: typeof b.maxPerRegion !== 'undefined' ? parseNum(b.maxPerRegion, qOpts.maxPerRegion ?? 1) : undefined,
        virtualOnly: typeof b.virtualOnly !== 'undefined' ? parseBool(b.virtualOnly, qOpts.virtualOnly ?? true) : undefined,
        dryRun: typeof b.dryRun !== 'undefined' ? parseBool(b.dryRun, qOpts.dryRun ?? false) : undefined,
      }
    }
  } catch {
    // no-op
  }

  const options: Options = {
    sinceDays: bodyOpts.sinceDays ?? qOpts.sinceDays,
    maxPerRegion: bodyOpts.maxPerRegion ?? qOpts.maxPerRegion,
    virtualOnly: bodyOpts.virtualOnly ?? qOpts.virtualOnly,
    dryRun: bodyOpts.dryRun ?? qOpts.dryRun,
  }

  const regions = bodyRegions?.length ? bodyRegions : await getRegions(req)

  const t0 = Date.now()
  const results = []
  for (const region of regions) {
    const r = await maybeGenerateCopilotUpload(region, options)
    results.push(r)
  }

  const summary = {
    ok: true,
    count: results.length,
    generated: results.filter((r) => r.action === 'generated').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
    errors: results.filter((r) => r.action === 'error').length,
    durationMs: Date.now() - t0,
    options,
    regions,
  }

  return NextResponse.json({ ...summary, results })
}

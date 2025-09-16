import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// Simple DoH via Google. Typen: A=1, CNAME=5, MX=15, TXT=16
async function doh(name: string, type: number) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`DNS error ${r.status}`)
  return r.json() as Promise<{ Answer?: { data: string }[] }>
}

export async function POST(req: Request) {
  await requireAdmin() // gate
  const { domain, selectors = ['default', 'mail', 'k'] } = await req.json()

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'domain required' }, { status: 400 })
  }

  // A
  const A = await doh(domain, 1).catch(() => ({ Answer: undefined }))
  const aFound = (A.Answer || []).map(a => a.data).filter(Boolean)

  // CNAME www
  const CWWW = await doh(`www.${domain}`, 5).catch(() => ({ Answer: undefined }))
  const cnameFound = (CWWW.Answer || []).map(a => a.data).filter(Boolean)

  // MX
  const MX = await doh(domain, 15).catch(() => ({ Answer: undefined }))
  const mxFound = (MX.Answer || []).map(a => a.data).filter(Boolean)

  // SPF (TXT @)
  const TXT = await doh(domain, 16).catch(() => ({ Answer: undefined }))
  const txtAll = (TXT.Answer || []).map(a => a.data.replace(/^"|"$/g, ''))
  const spf = txtAll.filter(t => t.toLowerCase().startsWith('v=spf1'))

  // DMARC
  const DMARC = await doh(`_dmarc.${domain}`, 16).catch(() => ({ Answer: undefined }))
  const dmarcTxt = (DMARC.Answer || []).map(a => a.data.replace(/^"|"$/g, ''))

  // DKIM (mehrere mögliche Selector)
  const dkim: Record<string, { ok: boolean; txt?: string[] }> = {}
  for (const sel of Array.isArray(selectors) ? selectors : []) {
    const DK = await doh(`${sel}._domainkey.${domain}`, 16).catch(() => ({ Answer: undefined }))
    const txt = (DK.Answer || []).map(a => a.data.replace(/^"|"$/g, ''))
    dkim[sel] = { ok: txt.length > 0 && txt.some(t => /v=DKIM1/i.test(t)), txt }
  }

  const body = {
    domain,
    records: {
      a: { ok: aFound.length > 0, found: aFound },
      cname_www: { ok: cnameFound.length > 0, found: cnameFound },
      mx: { ok: mxFound.length > 0, found: mxFound },
      spf: { ok: spf.length > 0, txt: spf },
      dkim: { ok: Object.values(dkim).some(v => v.ok), selectors: dkim },
      dmarc: { ok: dmarcTxt.length > 0 && dmarcTxt.some(t => /v=dmarc1/i.test(t)), txt: dmarcTxt },
    },
  }

  return NextResponse.json(body, { status: 200 })
}

// supabase/functions/account-delete-v1/index.ts
//
// Schmale privilegierte Kontolöschung. Die Zielperson kommt nur aus dem
// verifizierten JWT. Storage geht über die Storage-API, bevor der Auth-Nutzer
// hart gelöscht wird. Protokollzeilen tragen nur Klasse und Schritt.

import { createClient } from 'npm:@supabase/supabase-js@2.50.2'

import { kontoLoeschungAusfuehren } from '../../../lib/account/kontoloeschung-ausfuehrung.ts'
import { eigeneSpeicherObjekteLoeschen, type SpeicherEintrag } from '../../../lib/account/kontoloeschung-speicher.ts'
import { loeschProtokollZeile, type LoeschKlasse } from '../../../lib/account/kontoloeschung-vertrag.ts'

type Admin = ReturnType<typeof createClient>

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (name: string) => string | undefined }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: kopf() })
  if (req.method !== 'POST') return json('anfrage_ungueltig', 405, 'anfrage')

  const laenge = req.headers.get('content-length')
  if (laenge && Number(laenge) > 512) return json('anfrage_ungueltig', 400, 'anfrage')

  const jwt = bearer(req.headers.get('Authorization'))
  const text = await req.text()
  if (text.length > 512) return json('anfrage_ungueltig', 400, 'anfrage')

  let koerper: unknown = null
  if (text.length > 0) {
    try {
      koerper = JSON.parse(text)
    } catch {
      return json('anfrage_ungueltig', 400, 'anfrage')
    }
  }

  const url = Deno.env.get('SUPABASE_URL') ?? null
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? null
  if (!url || !service) return json('nicht_verfuegbar', 503, 'umgebung')

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const ergebnis = await kontoLoeschungAusfuehren({
    jwt,
    koerper,
    supabaseUrl: url,
    deps: {
      jetztSekunden: () => Math.floor(Date.now() / 1000),
      nutzer: (token) => nutzerLesen(admin, token),
      faktoren: (userId) => faktorZahl(admin, userId),
      speicherLoeschen: (userId) => eigeneSpeicherObjekteLoeschen(speicherVon(admin), userId),
      ereignisseLoeschen: (userId) => ereignisseLoeschen(admin, userId),
      nutzerLoeschen: (userId) => nutzerHartLoeschen(admin, userId),
    },
  })
  return json(ergebnis.klasse, ergebnis.status, ergebnis.schritt)
})

function json(klasse: LoeschKlasse, status: number, schritt: string): Response {
  console.log(loeschProtokollZeile(klasse, schritt))
  return new Response(JSON.stringify({ klasse }), { status, headers: kopf() })
}

function kopf(): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function bearer(header: string | null): string | null {
  if (!header) return null
  const treffer = /^Bearer\s+(\S+)$/i.exec(header)
  if (!treffer) return null
  const token = treffer[1]
  if (!token || token.length < 20 || token.length > 8192) return null
  return token
}

async function nutzerLesen(admin: Admin, jwt: string) {
  const { data, error } = await admin.auth.getUser(jwt)
  if (data.user?.id) {
    const identities = data.user.identities
    if (!Array.isArray(identities)) return { art: 'ok' as const, id: data.user.id, providers: null }
    const providers = identities
      .map((identity) => identity.provider)
      .filter((provider): provider is string => typeof provider === 'string')
    return { art: 'ok' as const, id: data.user.id, providers }
  }
  const status = error?.status ?? 0
  const code = typeof error?.code === 'string' ? error.code : ''
  if (status === 404 || code === 'user_not_found') return { art: 'nicht_gefunden' as const }
  if (status >= 500) return { art: 'nicht_verfuegbar' as const }
  return { art: 'nicht_angemeldet' as const }
}

async function faktorZahl(admin: Admin, userId: string): Promise<number | null> {
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId })
  if (error || !data?.factors) return null
  return data.factors.filter((faktor) => faktor.status === 'verified').length
}

async function ereignisseLoeschen(admin: Admin, userId: string): Promise<'ok' | 'fehler'> {
  const { error } = await admin.from('security_events').delete().eq('user_id', userId)
  return error ? 'fehler' : 'ok'
}

async function nutzerHartLoeschen(
  admin: Admin,
  userId: string,
): Promise<'ok' | 'nicht_gefunden' | 'fehler'> {
  const { error } = await admin.auth.admin.deleteUser(userId, false)
  if (!error) return 'ok'
  if (error.status === 404 || error.code === 'user_not_found') return 'nicht_gefunden'
  return 'fehler'
}

function speicherVon(admin: Admin) {
  return {
    async buckets() {
      const { data, error } = await admin.storage.listBuckets()
      if (error || !data) return { fehler: true as const }
      return { ids: data.map((bucket) => bucket.id).filter((id) => typeof id === 'string' && id.length > 0) }
    },
    async list(bucket: string, prefix: string, offset: number, limit: number) {
      const { data, error } = await admin.storage.from(bucket).list(prefix, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error || !data) return { fehler: true as const }
      return {
        eintraege: data.map((row) => eintragVon(row)),
      }
    },
    async remove(bucket: string, pfade: string[]) {
      const { error } = await admin.storage.from(bucket).remove(pfade)
      return error ? ('fehler' as const) : ('ok' as const)
    },
  }
}

function eintragVon(row: {
  name: string
  id?: string | null
  owner?: string | null
  owner_id?: string | null
}): SpeicherEintrag {
  const extra = row as { owner?: string | null; owner_id?: string | null; id?: string | null }
  return {
    name: row.name,
    id: typeof extra.id === 'string' && extra.id.length > 0 ? extra.id : null,
    owner: typeof extra.owner === 'string' ? extra.owner : null,
    ownerId: typeof extra.owner_id === 'string' ? extra.owner_id : null,
  }
}

// supabase/functions/account-delete-v1/index.ts
//
// Schmale privilegierte Kontolöschung. Die Zielperson kommt nur aus dem
// verifizierten JWT. Besitz an Storage-Objekten wird nur lesend über
// SUPABASE_DB_URL gelesen. Gelöscht wird ausschließlich über die Storage-API,
// bevor der Auth-Nutzer hart gelöscht wird. Protokollzeilen tragen nur Klasse
// und Schritt, nie die Datenbank-URL, eine Nutzer-ID oder einen Pfad.

import { createClient } from 'npm:@supabase/supabase-js@2.50.2'
import postgres from 'npm:postgres@3.4.5'

import { kontoLoeschungAusfuehren } from '../../../lib/account/kontoloeschung-ausfuehrung.ts'
import {
  besitzAbfrage,
  eigeneSpeicherObjekteLoeschen,
  type BesitzZeile,
} from '../../../lib/account/kontoloeschung-speicher.ts'
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
      speicherLoeschen: (userId) => speicherLeeren(admin, userId),
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

function speicherLeeren(admin: Admin, userId: string) {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')
  if (!dbUrl) return Promise.resolve('fehler' as const)
  return eigeneSpeicherObjekteLoeschen(
    {
      lesen: (id) => besitzLesen(dbUrl, id),
      remove: async (bucket, pfade) => {
        const { error } = await admin.storage.from(bucket).remove(pfade)
        return error ? ('fehler' as const) : ('ok' as const)
      },
    },
    userId,
  )
}

async function besitzLesen(
  dbUrl: string,
  userId: string,
): Promise<{ zeilen: BesitzZeile[] } | { fehler: true }> {
  const abfrage = besitzAbfrage(userId)
  if (!abfrage) return { fehler: true }
  const sql = postgres(dbUrl, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 5,
    prepare: false,
    onnotice: () => undefined,
  })
  try {
    const rows = await sql.unsafe(abfrage.text, [...abfrage.werte])
    const zeilen: BesitzZeile[] = []
    for (const row of rows) {
      if (!row || typeof row !== 'object') return { fehler: true }
      const bucketId = (row as { bucket_id?: unknown }).bucket_id
      const name = (row as { name?: unknown }).name
      if (typeof bucketId !== 'string' || typeof name !== 'string') return { fehler: true }
      zeilen.push({ bucketId, name })
    }
    return { zeilen }
  } catch {
    return { fehler: true }
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined)
  }
}

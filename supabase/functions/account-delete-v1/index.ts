// supabase/functions/account-delete-v1/index.ts
//
// Schmale V1-Löschgrenze. Identität nur aus der Bearer-Sitzung.
// Kein Aufrufer-user_id. Kein allgemeiner Admin-Client. Kein SQL auf Storage.
// Cursor deployed diese Funktion nicht. Production ist nicht freigegeben.
//
// verify_jwt steht in supabase/config.toml auf true.

import { createClient } from 'npm:@supabase/supabase-js@2'

import { kontoLoeschungAusfuehren } from '../../../lib/account/kontoloeschung-ausfuehren.ts'
import {
  anbieterAusBenutzer,
  authLoeschFehlerEinordnen,
  verifizierteTotpAnzahl,
} from '../../../lib/account/kontoloeschung.ts'

type JsonClient = {
  auth: {
    getUser: () => Promise<{ data: { user: Benutzer | null }; error: { message?: string } | null }>
    signInWithPassword: (args: { email: string; password: string }) => Promise<{
      data: { user: { id?: string } | null }
      error: { message?: string; status?: number; name?: string } | null
    }>
    signOut: (args: { scope: 'local' }) => Promise<{ error: unknown }>
    mfa: {
      listFactors: () => Promise<{ data: unknown; error: { message?: string } | null }>
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: { currentLevel?: string | null } | null
        error: { message?: string } | null
      }>
    }
    admin: {
      deleteUser: (id: string, shouldSoftDelete: boolean) => Promise<{
        error: { message?: string; code?: string; status?: number } | null
      }>
    }
  }
  from: (tabelle: string) => {
    delete: () => { eq: (spalte: string, wert: string) => Promise<{ error: { message?: string } | null }> }
  }
  storage: {
    from: (bucket: string) => {
      list: (prefix: string) => Promise<{ data: SpeicherObjekt[] | null; error: { message?: string } | null }>
      remove: (pfade: string[]) => Promise<{ error: { message?: string } | null }>
    }
  }
}

type Benutzer = {
  id: string
  email?: string | null
  identities?: { provider?: string | null }[] | null
  app_metadata?: { provider?: string | null; providers?: string[] | null } | null
}

type SpeicherObjekt = { name?: string; owner?: string | null; owner_id?: string | null }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function client(url: string, key: string, authorization?: string) {
  return createClient(url, key, {
    global: authorization ? { headers: { Authorization: authorization } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) as unknown as JsonClient
}

async function speicherUeberApi(
  admin: JsonClient,
  flaeche: { bucket: string; prefix: string },
  benutzerId: string,
) {
  const liste = await admin.storage.from(flaeche.bucket).list(flaeche.prefix)
  if (liste.error || !liste.data) return { art: 'unbekannt' as const }
  const pfade: string[] = []
  for (const objekt of liste.data) {
    const besitzer = objekt.owner ?? objekt.owner_id ?? null
    if (!besitzer || !objekt.name) return { art: 'unbekannt' as const }
    if (besitzer !== benutzerId) continue
    const prefix = flaeche.prefix.replace(/\/$/, '')
    pfade.push(prefix ? `${prefix}/${objekt.name}` : objekt.name)
  }
  if (pfade.length === 0) return { art: 'geleert' as const }
  const entfernt = await admin.storage.from(flaeche.bucket).remove(pfade)
  if (entfernt.error) return { art: 'fehler' as const }
  return { art: 'geleert' as const }
}

Deno.serve(async (req) => {
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const anon = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anon || !serviceRole) {
      return json(503, { status: 'rejected', code: 'nicht_verfuegbar' })
    }

    const admin = client(url, serviceRole)
    const antwort = await kontoLoeschungAusfuehren(
      {
        method: req.method,
        url: req.url,
        authorization: req.headers.get('Authorization'),
        bodyText: await req.text(),
      },
      {
        identitaetPruefen: async (authorization) => {
          const nutzer = client(url, anon, authorization)
          const gelesen = await nutzer.auth.getUser()
          if (gelesen.error || !gelesen.data.user?.id) return { art: 'keine_sitzung' }
          const faktoren = await nutzer.auth.mfa.listFactors()
          if (faktoren.error) return { art: 'faktoren_unlesbar' }
          const anzahl = verifizierteTotpAnzahl(faktoren.data)
          if (anzahl === null) return { art: 'faktoren_unlesbar' }
          let aal: 'aal1' | 'aal2' | null = null
          if (anzahl > 0) {
            const stand = await nutzer.auth.mfa.getAuthenticatorAssuranceLevel()
            const current = stand.data?.currentLevel
            if (!stand.error && (current === 'aal1' || current === 'aal2')) aal = current
          }
          return {
            art: 'ok',
            identitaet: {
              id: gelesen.data.user.id,
              email: typeof gelesen.data.user.email === 'string' ? gelesen.data.user.email : null,
              anbieter: anbieterAusBenutzer(gelesen.data.user),
              aal,
              verifizierteTotp: anzahl,
            },
          }
        },
        bestaetigePasswort: async (email, passwort) => {
          const beweis = client(url, anon)
          const ergebnis = await beweis.auth.signInWithPassword({ email, password: passwort })
          const benutzerId = ergebnis.data.user?.id ?? null
          if (benutzerId) {
            try {
              await beweis.auth.signOut({ scope: 'local' })
            } catch {
              // Beweis-Sitzung nicht protokollieren. Das Löschen entfernt sie mit dem Konto.
            }
          }
          if (ergebnis.error || !benutzerId) {
            const status = ergebnis.error?.status ?? 0
            if (status >= 500 || status === 0 || ergebnis.error?.name === 'AuthRetryableFetchError') {
              return { art: 'fehler' }
            }
            return { art: 'falsch' }
          }
          return { art: 'ok', benutzerId }
        },
        raeumeSpeicher: (flaeche, benutzerId) => speicherUeberApi(admin, flaeche, benutzerId),
        loescheAuthBenutzer: async (benutzerId) => {
          const ergebnis = await admin.auth.admin.deleteUser(benutzerId, false)
          if (!ergebnis.error) return { art: 'geloescht' }
          return { art: authLoeschFehlerEinordnen(ergebnis.error) }
        },
        entferneSicherheitsereignisse: async (benutzerId) => {
          const ergebnis = await admin.from('security_events').delete().eq('user_id', benutzerId)
          if (ergebnis.error) return { art: 'fehler' }
          return { art: 'entfernt' }
        },
      },
      (zeile) => {
        console.log(zeile)
      },
    )

    return json(antwort.status, antwort.body)
  } catch {
    return json(503, { status: 'rejected', code: 'nicht_verfuegbar' })
  }
})

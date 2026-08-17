// scripts/auth/fluesse.ts
//
// Die Anmeldewege des Development-Branches, an ihnen selbst geprüft.
//
// `npm run auth:pruefen` vergleicht Werte. Ein Wert sagt aber nicht, was er
// bewirkt – genau die Lücke, die `npm run db:sicherheit` für die Policies
// schliesst. Diese Datei macht dasselbe für Auth: Sie behauptet nicht, dass
// `password_hibp_enabled` gesetzt ist, sondern schickt ein Passwort aus einem
// bekannten Datenleck an die Registrierung und liest die Ablehnung.
//
// Aufruf:
//   npm run auth:fluesse
//
// Der Lauf braucht `SUPABASE_PROJECT_REF` und `SUPABASE_ACCESS_TOKEN` und zielt
// ausschliesslich auf einen Branch – `ziel()` bricht ab, wenn der Ref auf ein
// eigenständiges Projekt zeigt. Die Schlüssel des Projekts holt er zur Laufzeit
// über die Management API; keiner steht im Repository.
//
// Er legt genau ein Wegwerfkonto an und entfernt es am Ende wieder, auch wenn
// ein Fall scheitert. Zwei Grenzen sind dabei zu kennen, beide gemessen und in
// docs/AUTH.md ausgeführt:
//
//   · Das Konto entsteht über die Admin-API, nicht über `POST /signup`. Der
//     öffentliche Weg verschickt eine Bestätigungs-E-Mail und ist auf zwei je
//     Stunde begrenzt (`rate_limit_email_sent`); ein Lauf, der ihn benutzt,
//     lässt sich nicht wiederholen. Alle Ablehnungen der Registrierung werden
//     trotzdem am öffentlichen Weg geprüft – sie verschicken nichts.
//   · Bestätigungs- und Rücksetzlinks entstehen über `/admin/generate_link`.
//     Der Endpunkt verschickt nichts und ist damit der einzige Weg, den Klick
//     auf einen echten Link ohne Postfach nachzustellen.

import { ziel, projektSchluessel, type Ziel } from './ziel'
import { PASSWORT_RICHTLINIE } from '@/lib/auth/passwort-richtlinie'

/** Erfüllt die Regel und steht in keinem bekannten Datenleck. */
const PASSWORT = 'Lissabon-Reise-2026!q'
const PASSWORT_NEU = 'Porto-Herbstreise-2026!k'

/**
 * Erfüllt die Regel aus zwölf Zeichen und vier Gruppen vollständig und steht
 * trotzdem bei HaveIBeenPwned. Nur so lässt sich der Leck-Abgleich von der
 * Regelprüfung unterscheiden: Ein Passwort, das beides verletzt, würde schon an
 * der Regel scheitern und über HIBP nichts sagen.
 */
const GELEAKT = 'Passw0rd!2345'

const HERKUNFT = 'http://localhost:3000'

type Fall = { name: string; erfuellt: boolean }

const faelle: Fall[] = []

function halte(name: string, erfuellt: boolean, text: string) {
  faelle.push({ name, erfuellt })
  console.log(`  ${erfuellt ? '✓' : '✗'} ${name}`)
  console.log(`      ${text}`)
}

type Antwort = { status: number; koerper: Record<string, unknown> | null; kopf: Headers }

/** Kürzt eine Antwort auf die Aussage, die in die Ausgabe gehört. */
function meldung({ status, koerper }: Antwort): string {
  const text = (koerper?.msg ?? koerper?.error_description ?? koerper?.error ?? koerper?.message ?? '') as string
  return `HTTP ${status}${text ? ` – ${text}` : ''}`
}

function sagt(antwort: Antwort, teil: string): boolean {
  return String(antwort.koerper?.msg ?? '').toLowerCase().includes(teil.toLowerCase())
}

class AuthApi {
  constructor(
    private readonly url: string,
    private readonly anon: string,
    private readonly geheim: string,
  ) {}

  private async ruf(
    pfad: string,
    init: RequestInit & { geheim?: boolean; folgen?: boolean } = {},
  ): Promise<Antwort> {
    const schluessel = init.geheim ? this.geheim : this.anon
    const res = await fetch(`${this.url}/auth/v1${pfad}`, {
      ...init,
      redirect: init.folgen === false ? 'manual' : 'follow',
      headers: {
        apikey: schluessel,
        Authorization: `Bearer ${schluessel}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
    })

    const text = await res.text()
    let koerper: Record<string, unknown> | null = null
    try {
      koerper = text ? (JSON.parse(text) as Record<string, unknown>) : null
    } catch {
      koerper = { msg: text }
    }

    return { status: res.status, koerper, kopf: res.headers }
  }

  registriere(email: string, passwort: string) {
    return this.ruf('/signup', { method: 'POST', body: JSON.stringify({ email, password: passwort }) })
  }

  anonym() {
    return this.ruf('/signup', { method: 'POST', body: JSON.stringify({}) })
  }

  melde(email: string, passwort: string) {
    return this.ruf('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwort }),
    })
  }

  kontoAnlegen(email: string, passwort: string) {
    return this.ruf('/admin/users', {
      geheim: true,
      method: 'POST',
      body: JSON.stringify({ email, password: passwort, email_confirm: false }),
    })
  }

  kontoEntfernen(id: string) {
    return this.ruf(`/admin/users/${id}`, { geheim: true, method: 'DELETE' })
  }

  /** Erzeugt einen Link, ohne eine E-Mail zu verschicken. */
  link(typ: 'signup' | 'recovery', email: string, redirectTo: string, extra: Record<string, unknown> = {}) {
    return this.ruf('/admin/generate_link', {
      geheim: true,
      method: 'POST',
      body: JSON.stringify({ type: typ, email, redirect_to: redirectTo, ...extra }),
    })
  }

  neuesPasswort(zugriffstoken: string, passwort: string) {
    return this.ruf('/user', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${zugriffstoken}` },
      body: JSON.stringify({ password: passwort }),
    })
  }

  faktorAnlegen(zugriffstoken: string) {
    return this.ruf('/factors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${zugriffstoken}` },
      body: JSON.stringify({ factor_type: 'totp', friendly_name: 'Flussprüfung' }),
    })
  }

  faktorEntfernen(zugriffstoken: string, id: string) {
    return this.ruf(`/factors/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${zugriffstoken}` },
    })
  }

  anbieter(name: string) {
    return this.ruf(`/authorize?provider=${name}`, { folgen: false })
  }
}

/** Klickt einen Link, ohne der Weiterleitung zu folgen. */
async function oeffne(link: string): Promise<{ status: number; ort: string; token: Record<string, string> }> {
  const res = await fetch(link, { redirect: 'manual' })
  const ort = res.headers.get('location') ?? ''
  const raute = ort.indexOf('#')
  const token = raute < 0 ? {} : Object.fromEntries(new URLSearchParams(ort.slice(raute + 1)))
  return { status: res.status, ort, token }
}

function ohneFragment(ort: string): string {
  return ort.split('#')[0] || '(leer)'
}

/**
 * Die Registrierung, soweit sie ohne E-Mail prüfbar ist: alle Ablehnungen.
 * Keiner dieser Aufrufe verschickt etwas.
 */
async function pruefeRegistrierung(api: AuthApi) {
  console.log('\nRegistrierung – was abgelehnt wird')

  const email = `flusspruefung-abgelehnt-${Date.now()}@jetnity.test`

  const kurz = await api.registriere(email, 'Kurz1!a')
  halte(
    'zu kurzes Passwort wird abgelehnt',
    kurz.status === 422 && sagt(kurz, String(PASSWORT_RICHTLINIE.mindestlaenge)),
    meldung(kurz),
  )

  const ohneSymbol = await api.registriere(email, 'Reiseplanung2026')
  halte('fehlende Zeichengruppe wird abgelehnt', ohneSymbol.status === 422, meldung(ohneSymbol))

  // Der eigentliche Nachweis für password_hibp_enabled: Die Regel ist erfüllt,
  // die Ablehnung kommt trotzdem – und mit einem anderen Wortlaut. Genau diesen
  // Wortlaut übersetzt lib/auth/passwort-richtlinie.ts.
  const geleakt = await api.registriere(email, GELEAKT)
  halte(
    'Passwort aus einem bekannten Datenleck wird abgelehnt',
    geleakt.status === 422 && sagt(geleakt, 'known to be weak'),
    meldung(geleakt),
  )

  const anonym = await api.anonym()
  halte('anonyme Anmeldung ist aus', anonym.status === 422, meldung(anonym))

  // Was hier nicht steht: ein Fall für die angenommene Registrierung. Ein
  // gültiges Passwort führt zum Versand, und der Versand ist auf zwei je Stunde
  // begrenzt – der Fall wäre beim zweiten Lauf rot, ohne dass sich etwas
  // geändert hat. Dazu lehnt die Plattform die reservierte Endung `.test`
  // ohnehin ab (`email_address_invalid`), sodass der öffentliche Weg mit einer
  // Wegwerfadresse gar nicht zu Ende geht. Beides in docs/AUTH.md, Abschnitt
  // „Was nicht geprüft ist".
}

async function pruefeBestaetigung(api: AuthApi, email: string) {
  console.log('\nE-Mail-Bestätigung')

  const vorher = await api.melde(email, PASSWORT)
  halte(
    'Anmeldung vor der Bestätigung wird abgelehnt',
    vorher.status === 400 && vorher.koerper?.error_code === 'email_not_confirmed',
    meldung(vorher),
  )

  const link = await api.link('signup', email, `${HERKUNFT}/auth/callback`, { password: PASSWORT })
  const url = link.koerper?.action_link as string | undefined
  if (!url) throw new Error(`Bestätigungslink nicht erzeugt: ${meldung(link)}`)

  const geklickt = await oeffne(url)
  halte(
    'der Bestätigungslink führt zurück in die Anwendung',
    geklickt.status === 303 &&
      geklickt.ort.startsWith(`${HERKUNFT}/auth/callback`) &&
      Boolean(geklickt.token.access_token),
    `HTTP ${geklickt.status} → ${ohneFragment(geklickt.ort)}#… (Sitzung im Fragment: ${Boolean(geklickt.token.access_token)})`,
  )

  const nachher = await api.melde(email, PASSWORT)
  const zugriffstoken = nachher.koerper?.access_token as string | undefined
  halte('Anmeldung nach der Bestätigung gelingt', nachher.status === 200 && Boolean(zugriffstoken), meldung(nachher))

  if (!zugriffstoken) throw new Error('Keine Sitzung – die folgenden Fälle brauchen sie.')
  return zugriffstoken
}

async function pruefeZweitenFaktor(api: AuthApi, zugriffstoken: string) {
  console.log('\nZweiter Faktor')

  // TOTP ist auf dem Branch eingeschaltet, und components/auth/MFATotpDialog.tsx
  // führt den Weg zu Ende. Geprüft wird die Einrichtung, nicht der Code selbst –
  // dafür bräuchte der Lauf eine Uhr und den geteilten Schlüssel.
  const angelegt = await api.faktorAnlegen(zugriffstoken)
  const faktor = angelegt.koerper as { id?: string; totp?: { secret?: string } } | null
  halte(
    'TOTP lässt sich einrichten',
    angelegt.status === 200 && Boolean(faktor?.totp?.secret),
    meldung(angelegt),
  )

  if (!faktor?.id) return

  const entfernt = await api.faktorEntfernen(zugriffstoken, faktor.id)
  halte('der Faktor lässt sich wieder entfernen', entfernt.status === 200, meldung(entfernt))
}

async function pruefeRuecksetzung(api: AuthApi, email: string) {
  console.log('\nPasswort-Rücksetzung und -Änderung')

  const eigen = await api.link('recovery', email, `${HERKUNFT}/auth/update-password`)
  const eigenUrl = eigen.koerper?.action_link as string | undefined
  if (!eigenUrl) throw new Error(`Rücksetzlink nicht erzeugt: ${meldung(eigen)}`)

  const geklickt = await oeffne(eigenUrl)
  halte(
    'der Rücksetzlink führt auf /auth/update-password',
    geklickt.ort.startsWith(`${HERKUNFT}/auth/update-password`) && Boolean(geklickt.token.access_token),
    `HTTP ${geklickt.status} → ${ohneFragment(geklickt.ort)}#…`,
  )

  // Der Grund, warum additional_redirect_urls leer bleiben darf: Ein Pfad am
  // eigenen Ursprung wird übernommen, ein fremder Host nicht.
  const fremd = await api.link('recovery', email, 'https://beispiel-fremd.example.com/abgriff')
  const fremdUrl = fremd.koerper?.action_link as string | undefined
  const fremdGeklickt = fremdUrl ? await oeffne(fremdUrl) : { status: 0, ort: '', token: {} }
  halte(
    'ein fremder Host fällt auf site_url zurück',
    fremdGeklickt.ort.startsWith(HERKUNFT) && !fremdGeklickt.ort.includes('beispiel-fremd'),
    `angefordert https://beispiel-fremd.example.com/abgriff → ${ohneFragment(fremdGeklickt.ort)}#…`,
  )

  const token = geklickt.token.access_token
  if (!token) throw new Error('Rücksetzlink ohne Sitzung – die Änderung ist nicht prüfbar.')

  const geleakt = await api.neuesPasswort(token, GELEAKT)
  halte(
    'auch das neue Passwort wird gegen Datenlecks geprüft',
    geleakt.status === 422 && sagt(geleakt, 'known to be weak'),
    meldung(geleakt),
  )

  const zuKurz = await api.neuesPasswort(token, 'Kurz1!a')
  halte('auch das neue Passwort muss die Regel erfüllen', zuKurz.status === 422, meldung(zuKurz))

  const gesetzt = await api.neuesPasswort(token, PASSWORT_NEU)
  halte('das neue Passwort wird gesetzt', gesetzt.status === 200, meldung(gesetzt))

  const neu = await api.melde(email, PASSWORT_NEU)
  halte(
    'die Anmeldung mit dem neuen Passwort gelingt',
    neu.status === 200 && Boolean(neu.koerper?.access_token),
    meldung(neu),
  )

  const alt = await api.melde(email, PASSWORT)
  halte('das alte Passwort gilt nicht mehr', alt.status === 400, meldung(alt))
}

async function pruefeAnbieter(api: AuthApi) {
  console.log('\nFremde Anmeldedienste')

  // Beide Schaltflächen stehen in den Formularen, beide Dienste sind auf dem
  // Branch aus. Der Fall hält den Widerspruch fest, statt ihn zu behaupten:
  // Einschalten braucht Client-ID und Secret und ist offener Punkt (ROADMAP.md).
  for (const name of ['google', 'apple']) {
    const res = await api.anbieter(name)
    halte(
      `${name} ist aus, und der Versuch endet in einer Fehlermeldung`,
      res.status === 400 && sagt(res, 'provider is not enabled'),
      meldung(res),
    )
  }
}

async function main() {
  const z: Ziel = await ziel()
  const { anon, geheim } = await projektSchluessel(z)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL fehlt')

  const api = new AuthApi(url, anon, geheim)
  const email = `flusspruefung-${Date.now()}@jetnity.test`
  let id: string | null = null

  console.log(`Anmeldewege am Branch geprüft. Wegwerfkonto: ${email}`)

  try {
    await pruefeRegistrierung(api)

    const angelegt = await api.kontoAnlegen(email, PASSWORT)
    id = (angelegt.koerper?.id as string | undefined) ?? null
    if (!id) throw new Error(`Wegwerfkonto nicht angelegt: ${meldung(angelegt)}`)

    const zugriffstoken = await pruefeBestaetigung(api, email)
    await pruefeZweitenFaktor(api, zugriffstoken)
    await pruefeRuecksetzung(api, email)
    await pruefeAnbieter(api)
  } finally {
    // Aufräumen gehört zum Lauf, nicht zum Erfolgsfall: Ein Konto, das nach
    // einem Abbruch stehen bleibt, verfälscht den nächsten Lauf.
    if (id) {
      const weg = await api.kontoEntfernen(id)
      console.log(`\nWegwerfkonto entfernt: HTTP ${weg.status}`)
    }
  }

  const offen = faelle.filter((f) => !f.erfuellt)
  console.log(`\n${faelle.length - offen.length} von ${faelle.length} Fällen wie erwartet.`)

  if (offen.length > 0) {
    console.log(`Nicht wie erwartet: ${offen.map((f) => f.name).join(', ')}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`\nAbgebrochen: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})

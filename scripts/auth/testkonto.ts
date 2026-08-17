// scripts/auth/testkonto.ts
//
// Legt auf dem Development-Branch ein Konto mit einer Rolle an oder entfernt es
// wieder – für die Prüfung der Admin-Oberflächen von Hand.
//
// Bewusst ein eigenes Werkzeug und keine Zeile in einer Migration: Ein
// anmeldbares Konto gehört nicht ins Schema. Es entsteht über den Admin-Endpunkt
// von Auth, damit dieselben Felder gesetzt werden, die eine echte Registrierung
// setzt – ein direkt in `auth.users` geschriebenes Konto lässt Token-Spalten auf
// NULL, und GoTrue bricht danach mit „Database error finding user" ab.
//
// Läuft nur gegen einen Branch: `ziel()` bricht bei einem eigenständigen Projekt
// ab, bevor irgendetwas geschrieben wird.
//
//   node --import tsx scripts/auth/testkonto.ts anlegen <mail> <passwort> [rolle]
//   node --import tsx scripts/auth/testkonto.ts entfernen <mail>

import { projektSchluessel, ziel, type Ziel } from './ziel'
import { ROLES, type Role } from '../../lib/auth/roles'

const API = 'https://api.supabase.com/v1'

async function sql(z: Ziel, query: string): Promise<unknown[]> {
  const res = await fetch(`${API}/projects/${z.ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${z.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`SQL fehlgeschlagen (HTTP ${res.status}): ${text}`)
  return text ? (JSON.parse(text) as unknown[]) : []
}

/** Verhindert, dass eine Adresse aus der Eingabe die Anweisung verlässt. */
function zitat(wert: string): string {
  return `'${wert.replace(/'/g, "''")}'`
}

async function authAdmin(pfad: string, methode: string, geheim: string, koerper?: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL fehlt')

  const res = await fetch(`${url}/auth/v1/admin${pfad}`, {
    method: methode,
    headers: {
      apikey: geheim,
      Authorization: `Bearer ${geheim}`,
      ...(koerper ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(koerper ? { body: JSON.stringify(koerper) } : {}),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Auth-Admin ${methode} ${pfad} (HTTP ${res.status}): ${text}`)
  return text ? JSON.parse(text) : null
}

async function kontoId(z: Ziel, mail: string): Promise<string | null> {
  const zeilen = (await sql(z, `select id from auth.users where email = ${zitat(mail)}`)) as {
    id: string
  }[]
  return zeilen[0]?.id ?? null
}

async function anlegen(z: Ziel, mail: string, passwort: string, rolle: Role) {
  const { geheim } = await projektSchluessel(z)

  const vorhanden = await kontoId(z, mail)
  if (vorhanden) await authAdmin(`/users/${vorhanden}`, 'DELETE', geheim)

  const konto = (await authAdmin('/users', 'POST', geheim, {
    email: mail,
    password: passwort,
    email_confirm: true,
  })) as { id: string }

  await sql(
    z,
    `insert into public.creator_profiles (user_id, email, role, name)
     values (${zitat(konto.id)}, ${zitat(mail)}, ${zitat(rolle)}, 'Testkonto')
     on conflict (user_id) do update set role = excluded.role`,
  )

  console.log(`angelegt: ${mail} mit Rolle ${rolle}`)
}

async function entfernen(z: Ziel, mail: string) {
  const { geheim } = await projektSchluessel(z)
  const id = await kontoId(z, mail)

  if (!id) {
    console.log(`nicht vorhanden: ${mail}`)
    return
  }

  await sql(z, `delete from public.creator_profiles where user_id = ${zitat(id)}`)
  await authAdmin(`/users/${id}`, 'DELETE', geheim)
  console.log(`entfernt: ${mail}`)
}

async function main() {
  const [befehl, mail, passwort, rolle = 'owner'] = process.argv.slice(2)
  if (!befehl || !mail) throw new Error('Aufruf: testkonto.ts <anlegen|entfernen> <mail> [passwort] [rolle]')

  const z = await ziel()

  if (befehl === 'anlegen') {
    if (!passwort) throw new Error('Passwort fehlt')
    if (!(ROLES as readonly string[]).includes(rolle)) {
      throw new Error(`Unbekannte Rolle ${rolle}. Erlaubt: ${ROLES.join(', ')}`)
    }
    await anlegen(z, mail, passwort, rolle as Role)
    return
  }

  if (befehl === 'entfernen') {
    await entfernen(z, mail)
    return
  }

  throw new Error(`Unbekannter Befehl ${befehl}`)
}

main().catch((fehler) => {
  console.error(fehler instanceof Error ? fehler.message : fehler)
  process.exit(1)
})

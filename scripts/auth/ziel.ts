// scripts/auth/ziel.ts
//
// Wer wird hier eigentlich angefasst?
//
// Die Auth-Konfiguration liegt nicht in der Datenbank, sondern beim
// Auth-Server des Projekts. Ein falscher Projekt-Ref schreibt sie also nicht in
// eine Migration, die man zurückrollen kann, sondern sofort in die laufende
// Anmeldung – im schlimmsten Fall in die von Production.
//
// Deshalb steht vor jedem Zugriff dieselbe Frage, und sie wird nicht aus einer
// Liste im Repository beantwortet, sondern bei Supabase erfragt: Ist das Ziel
// ein Branch oder ein eigenständiges Projekt? Die Management API trennt beides
// eindeutig – ein Branch ist unter `/v1/projects/{ref}` **nicht** zu finden
// (404) und unter `/v1/branches/{ref}` schon (200). Für das Elternprojekt gilt
// das Umgekehrte.
//
// Ein hart eingetragener Production-Ref wäre die schwächere Lösung: Er müsste
// gepflegt werden und würde ein zweites Produktionsprojekt nicht erkennen.

import { artAusStatus, type ZielArt } from '@/lib/rollout/ziel-art'

const API = 'https://api.supabase.com/v1'

export type Ziel = {
  ref: string
  token: string
}

export type { ZielArt }

/**
 * Der Grund einer abgelehnten Antwort, ohne ihren Körper weiterzugeben.
 *
 * Die Management API antwortet im Fehlerfall mit `{ "message": … }`. Diesen
 * Satz zu zeigen hilft; die Antwort ungelesen in eine Fehlermeldung zu schieben
 * ist etwas anderes – sie landet im CI-Protokoll, und was ausser einer Meldung
 * darin steht, entscheidet nicht Jetnity. Deshalb nur die bekannten Felder.
 */
function grund(text: string): string {
  try {
    const koerper = JSON.parse(text) as Record<string, unknown>
    for (const feld of ['message', 'msg', 'error_description', 'error']) {
      const wert = koerper[feld]
      if (typeof wert === 'string' && wert.length > 0) return wert
    }
  } catch {
    // Keine JSON-Antwort: Der Status ist dann alles, was gesagt werden kann.
  }
  return 'ohne nennbaren Grund'
}

async function status(pfad: string, token: string): Promise<number> {
  // Bewusst nur der Status. `/v1/branches/{ref}` liefert das Datenbankkennwort
  // und das JWT-Secret des Branches mit; nichts davon darf in eine Ausgabe,
  // ein Log oder eine Fehlermeldung geraten.
  const res = await fetch(`${API}${pfad}`, { headers: { Authorization: `Bearer ${token}` } })
  return res.status
}

/**
 * Liest Ref und Token aus der Umgebung und stellt sicher, dass der Ref auf
 * einen Branch zeigt. Alles andere bricht ab, bevor irgendetwas gelesen oder
 * geschrieben wird.
 */
export async function zielArt(ref: string, token: string): Promise<{
  art: ZielArt
  projektStatus: number
  branchStatus: number
}> {
  const projektStatus = await status(`/projects/${ref}`, token)
  const branchStatus = await status(`/branches/${ref}`, token)
  return {
    art: artAusStatus(projektStatus, branchStatus),
    projektStatus,
    branchStatus,
  }
}

function umgebungLesen(): Ziel {
  const ref = process.env.SUPABASE_PROJECT_REF
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!ref) throw new Error('SUPABASE_PROJECT_REF fehlt')
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN fehlt')
  return { ref, token }
}

export async function ziel(): Promise<Ziel> {
  const { ref, token } = umgebungLesen()
  const erkannt = await zielArt(ref, token)

  if (erkannt.art === 'projekt') {
    throw new Error(
      'SUPABASE_PROJECT_REF zeigt auf ein eigenständiges Projekt, nicht auf einen Branch. ' +
        'Die Auth-Konfiguration in supabase/config.toml beschreibt Development. Abgebrochen, ' +
        'damit sie nicht auf Production landet.',
    )
  }

  if (erkannt.art !== 'branch') {
    throw new Error(
      `SUPABASE_PROJECT_REF ist weder Projekt (${erkannt.projektStatus}) noch Branch (${erkannt.branchStatus}). ` +
        'Ref oder Token prüfen. Abgebrochen.',
    )
  }

  return { ref, token }
}

/**
 * Production-Schreiben: das Ziel muss ein eigenständiges Projekt sein.
 * Ein Development-Branch wird abgelehnt. Der bestätigte Ref kommt vom Aufrufer
 * und muss bereits mit der Umgebung übereinstimmen.
 */
export async function produktionsZiel(bestaetigterRef: string): Promise<Ziel> {
  const { ref, token } = umgebungLesen()
  if (ref !== bestaetigterRef) {
    throw new Error(
      'Der bestätigte --projekt-ref stimmt nicht mit SUPABASE_PROJECT_REF überein. Abgebrochen.',
    )
  }

  const erkannt = await zielArt(ref, token)
  if (erkannt.art === 'branch') {
    throw new Error(
      'Production-Modus zeigt auf einen Development-Branch. Abgebrochen. ' +
        'Ein Branch darf nicht als Production beschrieben werden.',
    )
  }
  if (erkannt.art !== 'projekt') {
    throw new Error(
      `Production-Ziel ist unklar (Projekt ${erkannt.projektStatus}, Branch ${erkannt.branchStatus}). Abgebrochen.`,
    )
  }
  return { ref, token }
}

export async function zielFuerAuftrag(auftrag: {
  modus: 'entwicklung' | 'produktion'
  bestaetigterRef?: string
}): Promise<Ziel> {
  if (auftrag.modus === 'produktion') {
    if (!auftrag.bestaetigterRef) {
      throw new Error('Production-Ziel ohne bestätigten Project-Ref. Abgebrochen.')
    }
    return produktionsZiel(auftrag.bestaetigterRef)
  }
  return ziel()
}

/** Holt die laufende Auth-Konfiguration des Ziels. */
export async function authKonfiguration({ ref, token }: Ziel): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Auth-Konfiguration nicht lesbar (HTTP ${res.status}): ${grund(text)}`)
  return JSON.parse(text) as Record<string, unknown>
}

/**
 * Holt den öffentlichen und den geheimen Schlüssel des Ziels.
 *
 * Beide stehen bewusst nicht im Repository und in keiner `.env`: Wer den
 * Personal Access Token hat, kann sie ohnehin abrufen, und ein zweiter
 * Ablageort für einen geheimen Schlüssel ist ein zweiter Ort, an dem er
 * verloren gehen kann ([AGENTS.md](../../AGENTS.md) Regel 16).
 *
 * Der geheime Schlüssel umgeht RLS. Er wird ausschliesslich für die
 * Admin-Endpunkte von Auth benutzt – Konto anlegen, Link erzeugen, Konto
 * entfernen –, nicht für Datenzugriffe.
 */
export async function projektSchluessel({ ref, token }: Ziel): Promise<{ anon: string; geheim: string }> {
  const res = await fetch(`${API}/projects/${ref}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Schlüssel nicht lesbar (HTTP ${res.status})`)

  const schluessel = (await res.json()) as { name: string; type: string; api_key: string }[]
  const finde = (typ: string, name: string) =>
    schluessel.find((s) => s.type === typ && s.name === name)?.api_key

  // Neue Projekte führen `publishable`/`secret`, ältere die beiden
  // JWT-Schlüssel. Beide Paare werden akzeptiert, damit der Lauf nicht an der
  // Umstellung eines Projekts hängt.
  const anon = finde('publishable', 'default') ?? finde('legacy', 'anon')
  const geheim = finde('secret', 'default') ?? finde('legacy', 'service_role')

  if (!anon || !geheim) throw new Error('Projekt liefert keinen öffentlichen und geheimen Schlüssel.')
  return { anon, geheim }
}

/** Schreibt einzelne Schlüssel der Auth-Konfiguration. */
export async function authKonfigurationSetzen(
  { ref, token }: Ziel,
  werte: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(werte),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Auth-Konfiguration nicht schreibbar (HTTP ${res.status}): ${grund(text)}`)
  return JSON.parse(text) as Record<string, unknown>
}

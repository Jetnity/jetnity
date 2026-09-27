// lib/account/kontoloeschung-speicher.ts
//
// Besitz steht in storage.objects.owner_id. Die Storage-List-Antwort hat
// dieses Feld nicht. Diese Datei liest nur bucket_id und name für genau eine
// verifizierte Nutzer-ID und löscht die Pfade ausschließlich über die
// Storage-API. SQL schreibt storage.objects nicht.

export type BesitzZeile = {
  bucketId: string
  name: string
}

export type SpeicherBesitz = {
  lesen: (userId: string) => Promise<{ zeilen: BesitzZeile[] } | { fehler: true }>
  remove: (bucket: string, pfade: string[]) => Promise<'ok' | 'fehler'>
}

const SEITENGROESSE = 100
const MAX_OBJEKTE = 2000

const NUTZER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Feste, parametrisierte Leseabfrage. Die Nutzer-ID steht nur in `werte`. */
export const BESITZ_SQL = 'select bucket_id, name from storage.objects where owner_id = $1'

export function besitzAbfrage(userId: string): { text: string; werte: [string] } | null {
  if (!nutzerIdIstSicher(userId)) return null
  return { text: BESITZ_SQL, werte: [userId] }
}

export async function eigeneSpeicherObjekteLoeschen(
  client: SpeicherBesitz,
  userId: string,
): Promise<'ok' | 'fehler' | 'teilweise'> {
  if (!nutzerIdIstSicher(userId)) return 'fehler'
  const erste = await client.lesen(userId)
  if ('fehler' in erste) return 'fehler'
  const gruppen = gruppenVon(erste.zeilen)
  if (gruppen === 'fehler') return 'fehler'

  let removeVersucht = false
  for (const [bucket, pfade] of gruppen) {
    for (let i = 0; i < pfade.length; i += SEITENGROESSE) {
      const stueck = pfade.slice(i, i + SEITENGROESSE)
      if (stueck.length === 0) continue
      removeVersucht = true
      const entfernt = await client.remove(bucket, stueck)
      if (entfernt !== 'ok') return 'teilweise'
    }
  }

  const rest = await client.lesen(userId)
  if ('fehler' in rest) return removeVersucht ? 'teilweise' : 'fehler'
  const uebrig = gruppenVon(rest.zeilen)
  if (uebrig === 'fehler' || uebrig.size > 0) return removeVersucht ? 'teilweise' : 'fehler'
  return 'ok'
}

function gruppenVon(zeilen: BesitzZeile[]): Map<string, string[]> | 'fehler' {
  const gruppen = new Map<string, string[]>()
  const gesehen = new Set<string>()
  if (zeilen.length > MAX_OBJEKTE) return 'fehler'
  for (const zeile of zeilen) {
    if (!bucketIstSicher(zeile.bucketId) || !pfadIstSicher(zeile.name)) return 'fehler'
    const schluessel = `${zeile.bucketId}\0${zeile.name}`
    if (gesehen.has(schluessel)) continue
    gesehen.add(schluessel)
    const vorhanden = gruppen.get(zeile.bucketId) ?? []
    vorhanden.push(zeile.name)
    gruppen.set(zeile.bucketId, vorhanden)
  }
  return gruppen
}

function nutzerIdIstSicher(userId: string): boolean {
  return NUTZER_ID.test(userId)
}

function pfadIstSicher(name: string): boolean {
  if (!name || name.length > 1024) return false
  if (name.startsWith('/') || name.endsWith('/')) return false
  if (name.includes('\\') || name.includes('\0') || name.includes('..')) return false
  return name.split('/').every((teil) => teil.length > 0 && teil !== '.')
}

function bucketIstSicher(id: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(id)
}

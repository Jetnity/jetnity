// lib/account/kontoloeschung-speicher.ts
//
// Löscht nur Storage-Objekte, deren Owner die verifizierte Nutzer-ID ist.
// Der Aufrufer spricht die Storage-API. SQL auf storage.objects ist hier nicht vorgesehen.
// `teilweise` heißt: ein Remove wurde versucht oder bestätigt, der zweite Walk
// ist aber nicht leer. Der Auth-Nutzer darf danach nicht gelöscht werden.

export type SpeicherEintrag = {
  name: string
  id: string | null
  owner: string | null
  ownerId: string | null
}

export type SpeicherClient = {
  buckets: () => Promise<{ ids: string[] } | { fehler: true }>
  list: (
    bucket: string,
    prefix: string,
    offset: number,
    limit: number,
  ) => Promise<{ eintraege: SpeicherEintrag[] } | { fehler: true }>
  remove: (bucket: string, pfade: string[]) => Promise<'ok' | 'fehler'>
}

const SEITENGROESSE = 100
const MAX_OBJEKTE = 2000
const MAX_TIEFE = 8

export async function eigeneSpeicherObjekteLoeschen(
  client: SpeicherClient,
  userId: string,
): Promise<'ok' | 'fehler' | 'teilweise'> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return 'fehler'
  const buckets = await client.buckets()
  if ('fehler' in buckets) return 'fehler'

  let removeVersucht = false
  for (const bucket of buckets.ids) {
    if (!bucketIstSicher(bucket)) return removeVersucht ? 'teilweise' : 'fehler'
    const erste = await eigenePfade(client, bucket, userId)
    if (erste === 'fehler') return removeVersucht ? 'teilweise' : 'fehler'
    for (let i = 0; i < erste.length; i += SEITENGROESSE) {
      const stueck = erste.slice(i, i + SEITENGROESSE)
      if (stueck.length === 0) continue
      removeVersucht = true
      const entfernt = await client.remove(bucket, stueck)
      if (entfernt !== 'ok') return 'teilweise'
    }
    const rest = await eigenePfade(client, bucket, userId)
    if (rest === 'fehler' || rest.length > 0) return removeVersucht ? 'teilweise' : 'fehler'
  }
  return 'ok'
}

async function eigenePfade(
  client: SpeicherClient,
  bucket: string,
  userId: string,
): Promise<string[] | 'fehler'> {
  const pfade: string[] = []
  const gesehen = new Set<string>()
  const ergebnis = await gehen(client, bucket, userId, '', 0, pfade, gesehen)
  if (ergebnis !== 'ok') return 'fehler'
  return pfade
}

async function gehen(
  client: SpeicherClient,
  bucket: string,
  userId: string,
  prefix: string,
  tiefe: number,
  pfade: string[],
  gesehen: Set<string>,
): Promise<'ok' | 'fehler'> {
  if (tiefe > MAX_TIEFE) return 'fehler'
  const schluessel = `${bucket}\0${prefix}`
  if (gesehen.has(schluessel)) return 'fehler'
  gesehen.add(schluessel)

  let offset = 0
  for (;;) {
    const seite = await client.list(bucket, prefix, offset, SEITENGROESSE)
    if ('fehler' in seite) return 'fehler'
    if (seite.eintraege.length === 0) return 'ok'
    for (const eintrag of seite.eintraege) {
      if (!nameIstSicher(eintrag.name)) return 'fehler'
      const pfad = prefix ? `${prefix}/${eintrag.name}` : eintrag.name
      if (!eintrag.id) {
        const tiefer = await gehen(client, bucket, userId, pfad, tiefe + 1, pfade, gesehen)
        if (tiefer !== 'ok') return 'fehler'
        continue
      }
      if (gehoert(eintrag, userId)) {
        pfade.push(pfad)
        if (pfade.length > MAX_OBJEKTE) return 'fehler'
      }
    }
    if (seite.eintraege.length < SEITENGROESSE) return 'ok'
    offset += seite.eintraege.length
  }
}

function gehoert(eintrag: SpeicherEintrag, userId: string): boolean {
  const ziel = userId.toLowerCase()
  if (eintrag.owner && eintrag.owner.toLowerCase() === ziel) return true
  if (eintrag.ownerId && eintrag.ownerId.toLowerCase() === ziel) return true
  return false
}

function nameIstSicher(name: string): boolean {
  if (!name || name.length > 512) return false
  if (name.includes('/') || name.includes('\\') || name.includes('..') || name.includes('\0')) {
    return false
  }
  return true
}

function bucketIstSicher(id: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(id)
}

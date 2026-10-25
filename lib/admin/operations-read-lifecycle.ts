export const HISTORISCHER_SATZ = 'Die angezeigte Prüfung ist historisch und unbestätigt.'

export type FrischeZustand = 'fresh' | 'stale' | 'unknown'
export type Phase = 'prueft' | 'aktuell' | 'historisch' | 'verweigert' | 'fehler'
export type Latch = 'stale' | 'unknown' | null

export type KnotenAlter = {
  ursprungZustand: FrischeZustand
  ursprungAlterMs: number | null
  ttlMs: number
  bodenMs: number | null
  latch: Latch
}

export type Anzeige = {
  state: FrischeZustand
  ageMs: number | null
  ttlMs: number
}

export type Anker = {
  wand: number | null
  mono: number | null
  vergangenMs: number
  geprueftMs: number
}

export type Hinweis = { state: FrischeZustand; ageMs: number | null } | null

export type KartenAlter = {
  id: string
  geprueftMs: number
  eltern: KnotenAlter
  anzeige: Anzeige
  checks: Array<{ id: string; knoten: KnotenAlter; anzeige: Anzeige }>
}

export type Buch = {
  anker: Anker
  karten: KartenAlter[]
}

export type Lauf = {
  id: number
  art: 'props' | 'get'
  endpunkt: string
  epoche: number
  instanz: number
  quelle: number
}

export type Stand<T> = {
  instanz: number
  montiert: boolean
  naechsteId: number
  endpunkt: string
  epoche: number
  quelle: number
  erlaubt: boolean
  getGesperrt: boolean
  latch: boolean
  phase: Phase
  bericht: T | null
  signatur: string | null
  getAngenommen: boolean
  meldung: string | null
  ausgangFuer: number | null
}

type RohFrische = { state: FrischeZustand; ageMs: number | null; ttlMs: number }
type RohKnoten = {
  id: string
  checkedAt: string
  freshness: RohFrische
  checks?: Array<{ id: string; freshness: RohFrische }> | undefined
}
type RohBericht = { checkedAt: string; items: RohKnoten[] }

export function kappeMeldung(text: string): string {
  const wert = text.trim()
  return wert.length > 500 ? wert.slice(0, 500) : wert
}

export function signaturVon(wert: unknown): string {
  return JSON.stringify(kanonisch(wert))
}

function kanonisch(wert: unknown): unknown {
  if (Array.isArray(wert)) return wert.map(kanonisch)
  if (wert && typeof wert === 'object') {
    const eintrag = wert as Record<string, unknown>
    const aus: Record<string, unknown> = {}
    for (const feld of Object.keys(eintrag).sort()) {
      if (eintrag[feld] !== undefined) aus[feld] = kanonisch(eintrag[feld])
    }
    return aus
  }
  return wert
}

function endlichZahl(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null
}

export function liesUhren(
  wandFn: () => unknown = () => Date.now(),
  monoFn: () => unknown = () => performance.now(),
): { wand: unknown; mono: unknown } {
  let wand: unknown
  let mono: unknown
  try {
    wand = wandFn()
  } catch {
    wand = undefined
  }
  try {
    mono = monoFn()
  } catch {
    mono = undefined
  }
  return { wand, mono }
}

export function knotenAus(state: FrischeZustand, ageMs: number | null, ttlMs: number): KnotenAlter {
  return {
    ursprungZustand: state,
    ursprungAlterMs: ageMs,
    ttlMs,
    bodenMs: typeof ageMs === 'number' ? ageMs : null,
    latch: state === 'unknown' ? 'unknown' : state === 'stale' ? 'stale' : null,
  }
}

export function ankerAus(wand: unknown, mono: unknown, checkedAt: string): Anker {
  return {
    wand: endlichZahl(wand),
    mono: endlichZahl(mono),
    vergangenMs: 0,
    geprueftMs: Date.parse(checkedAt),
  }
}

function delta(jetzt: number | null, anker: number | null): number | null {
  if (jetzt === null || anker === null) return null
  const wert = jetzt - anker
  return Number.isFinite(wert) && wert >= 0 ? wert : null
}

function anwenden(knoten: KnotenAlter, vergangenMs: number, hinweis: Hinweis, erzwingenUnknown: boolean): {
  knoten: KnotenAlter
  anzeige: Anzeige
} {
  let alter = knoten.bodenMs
  if (knoten.ursprungZustand !== 'unknown' && knoten.ursprungAlterMs !== null) {
    const summe = knoten.ursprungAlterMs + vergangenMs
    if (Number.isFinite(summe)) alter = alter === null ? summe : Math.max(alter, summe)
  }
  if (
    knoten.ursprungZustand !== 'unknown' &&
    hinweis &&
    typeof hinweis.ageMs === 'number' &&
    Number.isFinite(hinweis.ageMs) &&
    (knoten.bodenMs === null || hinweis.ageMs > knoten.bodenMs)
  ) {
    alter = alter === null ? hinweis.ageMs : Math.max(alter, hinweis.ageMs)
  }
  if (knoten.ursprungZustand === 'unknown') alter = null

  let latch = knoten.latch
  if (knoten.ursprungZustand === 'unknown' || latch === 'unknown') latch = 'unknown'
  else if (knoten.ursprungZustand === 'stale' || latch === 'stale') latch = 'stale'
  else if (erzwingenUnknown || hinweis?.state === 'unknown') latch = 'unknown'
  else if ((alter !== null && alter > knoten.ttlMs) || hinweis?.state === 'stale') latch = 'stale'

  const zustand: FrischeZustand = latch === 'unknown' ? 'unknown' : latch === 'stale' ? 'stale' : 'fresh'
  const anzeigeAlter = knoten.ursprungZustand === 'unknown' ? null : alter
  return {
    knoten: { ...knoten, bodenMs: anzeigeAlter, latch },
    anzeige: { state: zustand, ageMs: anzeigeAlter, ttlMs: knoten.ttlMs },
  }
}

export function alterFortschreiben(input: {
  anker: Anker
  karten: KartenAlter[]
  wand: unknown
  mono: unknown
  hinweise: Array<{ id: string; hinweis: Hinweis; checks: Hinweis[] }> | null
}): Buch {
  const wandJetzt = endlichZahl(input.wand)
  const monoJetzt = endlichZahl(input.mono)
  const wandDelta = delta(wandJetzt, input.anker.wand)
  const monoDelta = delta(monoJetzt, input.anker.mono)
  let vergangenMs = input.anker.vergangenMs
  if (wandDelta !== null) vergangenMs = Math.max(vergangenMs, wandDelta)
  if (monoDelta !== null) vergangenMs = Math.max(vergangenMs, monoDelta)
  const ankerUnbrauchbar = input.anker.wand === null || input.anker.mono === null
  const erzwingenUnknown = ankerUnbrauchbar
    || (wandDelta === null && monoDelta === null)
    || wandJetzt === null
    || !Number.isFinite(input.anker.geprueftMs)
    || (wandJetzt !== null && input.anker.geprueftMs > wandJetzt)
  const hinweisNachId = new Map((input.hinweise ?? []).map((eintrag) => [eintrag.id, eintrag]))
  return {
    anker: { ...input.anker, vergangenMs },
    karten: input.karten.map((karte) => {
      const hinweis = hinweisNachId.get(karte.id)
      const karteUnbrauchbar = !Number.isFinite(karte.geprueftMs) || (wandJetzt !== null && karte.geprueftMs > wandJetzt)
      const erzwingen = erzwingenUnknown || karteUnbrauchbar
      const eltern = anwenden(karte.eltern, vergangenMs, hinweis?.hinweis ?? null, erzwingen)
      return {
        id: karte.id,
        geprueftMs: karte.geprueftMs,
        eltern: eltern.knoten,
        anzeige: eltern.anzeige,
        checks: karte.checks.map((check, index) => {
          const teil = anwenden(check.knoten, vergangenMs, hinweis?.checks?.[index] ?? null, erzwingen)
          return { id: check.id, knoten: teil.knoten, anzeige: teil.anzeige }
        }),
      }
    }),
  }
}

export function buchAusBericht<T extends RohBericht>(
  bericht: T,
  uhren: { wand: unknown; mono: unknown },
  hinweisFn: (bericht: T, wand: number) => Array<{ id: string; state: FrischeZustand; ageMs: number | null; checks: Array<{ id: string; state: FrischeZustand; ageMs: number | null }> }>,
): Buch {
  const anker = ankerAus(uhren.wand, uhren.mono, bericht.checkedAt)
  const karten: KartenAlter[] = bericht.items.map((item) => ({
    id: item.id,
    geprueftMs: Date.parse(item.checkedAt),
    eltern: knotenAus(item.freshness.state, item.freshness.ageMs, item.freshness.ttlMs),
    anzeige: { state: item.freshness.state, ageMs: item.freshness.ageMs, ttlMs: item.freshness.ttlMs },
    checks: (item.checks ?? []).map((check) => ({
      id: check.id,
      knoten: knotenAus(check.freshness.state, check.freshness.ageMs, check.freshness.ttlMs),
      anzeige: { state: check.freshness.state, ageMs: check.freshness.ageMs, ttlMs: check.freshness.ttlMs },
    })),
  }))
  const wand = endlichZahl(uhren.wand)
  const hinweise = wand === null
    ? null
    : hinweisFn(bericht, wand).map((eintrag) => ({
        id: eintrag.id,
        hinweis: { state: eintrag.state, ageMs: eintrag.ageMs },
        checks: eintrag.checks.map((check) => ({ state: check.state, ageMs: check.ageMs })),
      }))
  return alterFortschreiben({ anker, karten, wand: uhren.wand, mono: uhren.mono, hinweise })
}

export function standAnfang<T>(instanz: number, endpunkt: string, erlaubt: boolean): Stand<T> {
  return {
    instanz,
    montiert: true,
    naechsteId: 1,
    endpunkt,
    epoche: 1,
    quelle: 1,
    erlaubt,
    getGesperrt: false,
    latch: false,
    phase: 'prueft',
    bericht: null,
    signatur: null,
    getAngenommen: false,
    meldung: null,
    ausgangFuer: null,
  }
}

export function laufGueltig<T>(stand: Stand<T>, lauf: Lauf): boolean {
  return stand.montiert
    && stand.instanz === lauf.instanz
    && stand.endpunkt === lauf.endpunkt
    && stand.epoche === lauf.epoche
    && stand.quelle === lauf.quelle
    && lauf.id === stand.naechsteId - 1
}

function offen<T>(stand: Stand<T>, lauf: Lauf): boolean {
  return laufGueltig(stand, lauf) && stand.ausgangFuer !== lauf.id
}

function neuerLauf<T>(stand: Stand<T>, art: Lauf['art']): { stand: Stand<T>; lauf: Lauf } {
  const lauf: Lauf = {
    id: stand.naechsteId,
    art,
    endpunkt: stand.endpunkt,
    epoche: stand.epoche,
    instanz: stand.instanz,
    quelle: stand.quelle,
  }
  return { stand: { ...stand, naechsteId: stand.naechsteId + 1 }, lauf }
}

export function propsBeginnen<T>(stand: Stand<T>): { stand: Stand<T>; lauf: Lauf | null } {
  if (stand.getGesperrt) return { stand, lauf: null }
  return neuerLauf(stand, 'props')
}

export function getBeginnen<T>(stand: Stand<T>): { stand: Stand<T>; lauf: Lauf | null } {
  if (!stand.montiert || !stand.erlaubt || stand.getGesperrt) return { stand, lauf: null }
  const begonnen = neuerLauf(stand, 'get')
  return { stand: { ...begonnen.stand, getGesperrt: true }, lauf: begonnen.lauf }
}

export function propsErfolg<T>(stand: Stand<T>, lauf: Lauf, bericht: T, signatur: string): Stand<T> {
  if (!offen(stand, lauf) || lauf.art !== 'props') return stand
  if (stand.latch || stand.bericht || stand.getAngenommen) return { ...stand, ausgangFuer: lauf.id }
  return {
    ...stand,
    phase: 'aktuell',
    bericht,
    signatur,
    meldung: null,
    ausgangFuer: lauf.id,
  }
}

export function propsMisserfolg<T>(stand: Stand<T>, lauf: Lauf, meldung: string): Stand<T> {
  if (!offen(stand, lauf) || lauf.art !== 'props') return stand
  if (stand.latch || stand.bericht || stand.getAngenommen) return { ...stand, ausgangFuer: lauf.id }
  return {
    ...stand,
    phase: 'fehler',
    bericht: null,
    meldung: kappeMeldung(meldung),
    ausgangFuer: lauf.id,
  }
}

export function getErfolg<T>(stand: Stand<T>, lauf: Lauf, bericht: T, signatur: string): Stand<T> {
  if (!offen(stand, lauf) || lauf.art !== 'get') return stand
  return {
    ...stand,
    latch: false,
    phase: 'aktuell',
    bericht,
    signatur,
    getAngenommen: true,
    getGesperrt: false,
    meldung: null,
    ausgangFuer: lauf.id,
  }
}

export function verweigerung<T>(stand: Stand<T>, lauf: Lauf, meldung: string): Stand<T> {
  if (!offen(stand, lauf) || lauf.art !== 'get') return stand
  return {
    ...stand,
    latch: true,
    phase: 'verweigert',
    bericht: null,
    getAngenommen: true,
    getGesperrt: false,
    meldung: kappeMeldung(meldung),
    ausgangFuer: lauf.id,
  }
}

export function misserfolg<T>(stand: Stand<T>, lauf: Lauf, meldung: string): Stand<T> {
  if (!offen(stand, lauf) || lauf.art !== 'get') return stand
  if (stand.latch) {
    return { ...stand, phase: 'verweigert', bericht: null, getGesperrt: false, ausgangFuer: lauf.id }
  }
  if (stand.bericht) {
    return {
      ...stand,
      phase: 'historisch',
      getGesperrt: false,
      meldung: kappeMeldung(meldung),
      ausgangFuer: lauf.id,
    }
  }
  return {
    ...stand,
    phase: 'fehler',
    bericht: null,
    getGesperrt: false,
    meldung: kappeMeldung(meldung),
    ausgangFuer: lauf.id,
  }
}

export function abschluss<T>(stand: Stand<T>, lauf: Lauf): Stand<T> {
  if (!laufGueltig(stand, lauf) || lauf.art !== 'get' || !stand.getGesperrt) return stand
  return { ...stand, getGesperrt: false }
}

export function endpunktSetzen<T>(stand: Stand<T>, endpunkt: string): Stand<T> {
  if (stand.endpunkt === endpunkt) return stand
  const naechster: Stand<T> = { ...stand, endpunkt, getGesperrt: false, quelle: stand.quelle + 1 }
  if (!stand.latch && stand.bericht) return { ...naechster, phase: 'historisch' }
  return naechster
}

export function erlaubnisSetzen<T>(stand: Stand<T>, erlaubt: boolean): Stand<T> {
  if (stand.erlaubt === erlaubt) return stand
  return {
    ...stand,
    erlaubt,
    epoche: stand.epoche + 1,
    getGesperrt: erlaubt ? stand.getGesperrt : false,
  }
}

export function abmelden<T>(stand: Stand<T>): Stand<T> {
  if (!stand.montiert) return stand
  return { ...stand, montiert: false, getGesperrt: false }
}

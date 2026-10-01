// lib/trips/my-trips-premium-hub-ux-1.ts
//
// Darstellung für Meine Reisen. Die Gruppenmitgliedschaft bleibt in
// `reise-lage` / `reise-archiv`. Hier entsteht keine zweite Wahrheit.

export const MEINE_REISEN_GRUPPEN = [
  { key: 'aktiv', titel: 'Aktiv', leer: 'Keine aktive Reise.' },
  { key: 'kommend', titel: 'Kommend', leer: 'Keine kommende Reise.' },
  { key: 'vergangen', titel: 'Vergangen', leer: 'Keine vergangene Reise.' },
  { key: 'ohneDatum', titel: 'Ohne Datum', leer: 'Keine Reise ohne Datum.' },
] as const

export type MeineReisenGruppenKey = (typeof MEINE_REISEN_GRUPPEN)[number]['key']

export type ReiseGruppenZaehlung = Record<MeineReisenGruppenKey, number>

export type HubLeiste = {
  key: MeineReisenGruppenKey
  titel: string
  leer: string
  anzahl: number
  sichtbar: boolean
  karten: boolean
  schwerpunkt: boolean
}

export const MEINE_REISEN_HAUPT = 'min-h-screen bg-surface-75 px-4 py-8 sm:px-6 sm:py-10'
export const MEINE_REISEN_INNEN = 'mx-auto min-w-0 max-w-6xl'
export const MEINE_REISEN_KOPF =
  'mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'
export const MEINE_REISEN_TITEL =
  'mt-1 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-4xl'
export const MEINE_REISEN_LEAD = 'mt-2 max-w-2xl text-sm leading-6 text-ink-700'
export const MEINE_REISEN_NEU =
  'inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:w-auto'
export const MEINE_REISEN_SUCHE =
  'min-h-11 w-full rounded-full border border-line-200 bg-white py-2 pl-10 pr-4 text-base text-ink-900 outline-none placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10'

export function zaehlungAus(gruppen: {
  aktiv: readonly unknown[]
  kommend: readonly unknown[]
  vergangen: readonly unknown[]
  ohneDatum: readonly unknown[]
}): ReiseGruppenZaehlung {
  return {
    aktiv: gruppen.aktiv.length,
    kommend: gruppen.kommend.length,
    vergangen: gruppen.vergangen.length,
    ohneDatum: gruppen.ohneDatum.length,
  }
}

export function hubDarstellung(zaehlung: ReiseGruppenZaehlung, sucheAktiv: boolean) {
  const schwerpunkt = !sucheAktiv && zaehlung.aktiv === 0 && zaehlung.kommend > 0
  const leiste: HubLeiste[] = MEINE_REISEN_GRUPPEN.map((gruppe) => {
    const anzahl = zaehlung[gruppe.key]
    return {
      key: gruppe.key,
      titel: gruppe.titel,
      leer: gruppe.leer,
      anzahl,
      sichtbar: !sucheAktiv || anzahl > 0,
      karten: anzahl > 0,
      schwerpunkt: schwerpunkt && gruppe.key === 'kommend',
    }
  })
  const leertext = sucheAktiv
    ? ''
    : leiste
        .filter((eintrag) => eintrag.anzahl === 0)
        .map((eintrag) => eintrag.leer)
        .join(' ')
  return { leiste, leertext }
}

export function trefferText(anzahl: number) {
  if (anzahl === 1) return '1 Treffer in den geladenen Reisen.'
  return `${anzahl} Treffer in den geladenen Reisen.`
}

export function kartenRasterKlasse(anzahl: number) {
  if (anzahl <= 1) return 'grid grid-cols-1 gap-3 lg:max-w-xl'
  if (anzahl === 2) return 'grid grid-cols-1 gap-3 sm:grid-cols-2'
  return 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
}

export function leistenKlasse(eintrag: Pick<HubLeiste, 'anzahl' | 'schwerpunkt' | 'key'>) {
  const basis =
    'inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 text-sm'
  if (eintrag.schwerpunkt) return `${basis} border-brand-800 bg-brand-800 font-semibold text-white`
  if (eintrag.anzahl > 0 && eintrag.key === 'aktiv') {
    return `${basis} border-brand-700 bg-surface-100 font-semibold text-brand-800`
  }
  if (eintrag.anzahl > 0) return `${basis} border-line-300 bg-white font-semibold text-brand-800`
  return `${basis} border-line-200 bg-surface-75 font-medium text-ink-700`
}

export function abschnittTitelKlasse(schwerpunkt: boolean) {
  return schwerpunkt
    ? 'text-xl font-semibold tracking-[-0.03em] text-brand-800'
    : 'text-sm font-semibold uppercase tracking-[0.16em] text-brand-700'
}

export type KartenLage = 'aktiv' | 'kommend' | 'vergangen' | 'ohneDatum' | 'archiv'

export function kartenKanteKlasse(lage: KartenLage) {
  if (lage === 'aktiv') return 'border-t-brand-800'
  if (lage === 'kommend') return 'border-t-brand-600'
  if (lage === 'ohneDatum') return 'border-t-line-200'
  return 'border-t-line-300'
}

// lib/trips/organize-premium-experience-6.ts
//
// Presentation only for Organisieren. No coverage truth, no search mounting,
// no provider payload. Adjacent status lines drop a clause only when the same
// wording is already on screen.

export const ORGANISIEREN_FLAECHE_KLASSE =
  'min-w-0 rounded-[24px] border border-line-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,46,42,0.04)] sm:p-5'

export const ORGANISIEREN_FELDGRUPPE_KLASSE =
  'min-w-0 rounded-2xl border border-line-200 bg-surface-25 px-3 pb-3 pt-1'

export const ORGANISIEREN_EINGABE_KLASSE =
  'h-11 min-h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base text-ink-900 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm'

export const ORGANISIEREN_TEXTAREA_KLASSE =
  'min-h-11 w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-base text-ink-900 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm'

export const ORGANISIEREN_PRIMAR_KLASSE =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60 sm:w-auto'

export const ORGANISIEREN_RUECKKEHR_KLASSE =
  'inline-flex min-h-11 shrink-0 scroll-mt-32 items-center gap-1.5 self-start rounded-full px-2 text-xs font-medium text-ink-700 transition hover:bg-surface-50 hover:text-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-600/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

function schluessel(wert: string): string {
  return wert.trim().toLocaleLowerCase('de-CH').replace(/\s+/g, ' ')
}

function klauseln(wert: string): string[] {
  return wert
    .split('·')
    .map((teil) => teil.trim())
    .filter((teil) => teil.length > 0)
}

/** Later clause stays out when the same wording is already visible. */
export function klauselnOhneWiederholung(bisher: readonly string[], zeile: string): string | null {
  const gesehen = new Set<string>()
  for (const eintrag of bisher) {
    const ganz = schluessel(eintrag)
    if (ganz) gesehen.add(ganz)
    for (const teil of klauseln(eintrag)) gesehen.add(schluessel(teil))
  }
  const neu = klauseln(zeile).filter((teil) => !gesehen.has(schluessel(teil)))
  if (neu.length === 0) return null
  return neu.join(' · ')
}

export type DetailStatusfolge = {
  zustand: string | null
  hinweis: string | null
  naechstes: string | null
  eyebrow: string | null
}

/**
 * Orders existing gap copy: identity stays with the caller, then state,
 * qualifiers, then the next explicit step. A short lage already shown in the
 * desktop rail is not repeated here. Phone passes no rail lage, so the detail
 * keeps it.
 */
export function detailStatusfolge(input: {
  eyebrow: string
  text: string
  nebenzeile: string
  naechsterSchritt: string
  lageInDerLeiste: string | null
}): DetailStatusfolge {
  const lage = input.lageInDerLeiste?.trim() || null
  const text = input.text.trim()
  const zustand = lage && schluessel(text) === schluessel(lage) ? null : text || null
  const gesehen = [zustand ?? '', lage ?? ''].filter((eintrag) => eintrag.length > 0)
  const hinweis = klauselnOhneWiederholung(gesehen, input.nebenzeile)
  const eyebrow = klauselnOhneWiederholung([...gesehen, hinweis ?? ''], input.eyebrow)
  const naechstes = klauselnOhneWiederholung(
    [...gesehen, hinweis ?? '', eyebrow ?? ''],
    input.naechsterSchritt,
  )
  return { zustand, hinweis, naechstes, eyebrow }
}

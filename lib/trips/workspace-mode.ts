// lib/trips/workspace-mode.ts
//
// URL-Vertrag der vier Arbeitsmodi. Keine Provider-, Such- oder Reisewahrheit.
// Übersicht ist die Adresse ohne `ansicht`. Ungültige Werte fallen auf Übersicht.

export const WORKSPACE_ANSICHTEN = ['uebersicht', 'plan', 'organisieren', 'vorbereitung'] as const
const WORKSPACE_BEREICHE = ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'] as const

export type WorkspaceAnsicht = (typeof WORKSPACE_ANSICHTEN)[number]
export type WorkspaceBereich = (typeof WORKSPACE_BEREICHE)[number]

export type WorkspaceModus = {
  ansicht: WorkspaceAnsicht
  bereich: WorkspaceBereich | null
  /** Die sichtbare Adresse weicht von der kanonischen Form ab und wird ersetzt. */
  urlAnpassen: boolean
}

export const WORKSPACE_ANSICHT_LABEL: Record<WorkspaceAnsicht, string> = {
  uebersicht: 'Übersicht',
  plan: 'Reiseplan',
  organisieren: 'Organisieren',
  vorbereitung: 'Vorbereitung',
}

const ANSICHT = 'ansicht'
const BEREICH = 'bereich'

const UEBERSICHT: WorkspaceModus = { ansicht: 'uebersicht', bereich: null, urlAnpassen: false }

function istWorkspaceAnsicht(wert: string | null): wert is Exclude<WorkspaceAnsicht, 'uebersicht'> {
  return wert === 'plan' || wert === 'organisieren' || wert === 'vorbereitung'
}

function istWorkspaceBereich(wert: string | null): wert is WorkspaceBereich {
  return wert === 'fluege' || wert === 'unterkunft' || wert === 'aktivitaeten' || wert === 'mobilitaet'
}

function geschlossen(urlAnpassen: boolean): WorkspaceModus {
  return { ansicht: 'uebersicht', bereich: null, urlAnpassen }
}

function rohLesen(params: URLSearchParams): Omit<WorkspaceModus, 'urlAnpassen'> {
  const ansichten = params.getAll(ANSICHT)
  const bereiche = params.getAll(BEREICH)
  if (ansichten.length > 1 || bereiche.length > 1) return { ansicht: 'uebersicht', bereich: null }

  const ansicht = ansichten[0] ?? null
  const bereich = bereiche[0] ?? null

  if (ansicht == null) {
    return { ansicht: 'uebersicht', bereich: null }
  }

  if (!istWorkspaceAnsicht(ansicht)) {
    return { ansicht: 'uebersicht', bereich: null }
  }

  if (ansicht !== 'organisieren') {
    return { ansicht, bereich: null }
  }

  if (bereich == null) return { ansicht: 'organisieren', bereich: null }
  if (!istWorkspaceBereich(bereich)) return { ansicht: 'uebersicht', bereich: null }
  return { ansicht: 'organisieren', bereich }
}

/** Kanonische Query. Fremde Parameter bleiben, `ansicht` und `bereich` werden neu gesetzt. */
export function queryFuerModus(
  aktuell: URLSearchParams,
  modus: Pick<WorkspaceModus, 'ansicht' | 'bereich'>,
): URLSearchParams {
  const next = new URLSearchParams()
  for (const [key, value] of aktuell.entries()) {
    if (key === ANSICHT || key === BEREICH) continue
    next.append(key, value)
  }
  if (modus.ansicht === 'plan' || modus.ansicht === 'vorbereitung') {
    next.append(ANSICHT, modus.ansicht)
  } else if (modus.ansicht === 'organisieren') {
    next.append(ANSICHT, 'organisieren')
    if (modus.bereich) next.append(BEREICH, modus.bereich)
  }
  return next
}

export function modusAusQuery(params: URLSearchParams): WorkspaceModus {
  const roh = rohLesen(params)
  const kanonisch = queryFuerModus(params, roh)
  return { ...roh, urlAnpassen: params.toString() !== kanonisch.toString() }
}

export function modusUrl(href: string, modus: Pick<WorkspaceModus, 'ansicht' | 'bereich'>): string {
  const url = new URL(href, 'http://127.0.0.1')
  const search = queryFuerModus(url.searchParams, modus).toString()
  return `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
}

/** Interne Audit-Starts ohne Query. Ein Domain-Wert öffnet Organisieren, sonst Übersicht. */
export function modusAusAnfangsBereich(wert: string | null | undefined): WorkspaceModus {
  if (istWorkspaceBereich(wert ?? null)) {
    return { ansicht: 'organisieren', bereich: wert as WorkspaceBereich, urlAnpassen: false }
  }
  return UEBERSICHT
}

// URL-/History-Vertrag der vier Arbeitsmodi. Referenzen sind Navigationsintent,
// niemals Reise-/Readiness-Wahrheit. Übersicht besitzt keine Auswahlparameter.

import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import { travellerSlots } from '@/lib/readiness/party'
import {
  PREPARATION_BEREICHE,
  type PreparationBereichId,
  type PreparationZiel,
} from '@/lib/readiness/preparation-premium-experience-5'
import { itemInReise } from '@/lib/trips/detail'
import type { Trip, TripItem } from '@/types/trips'

export const WORKSPACE_ANSICHTEN = ['uebersicht', 'plan', 'organisieren', 'vorbereitung'] as const
const WORKSPACE_BEREICHE = ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'] as const
export const WORKSPACE_QUERY_KEYS = ['ansicht', 'bereich', 'tag', 'punkt', 'vorbereitung', 'reisender'] as const

export type WorkspaceAnsicht = (typeof WORKSPACE_ANSICHTEN)[number]
export type WorkspaceBereich = (typeof WORKSPACE_BEREICHE)[number]

export type WorkspaceModus = {
  ansicht: WorkspaceAnsicht
  bereich: WorkspaceBereich | null
  tagId?: string
  itemId?: string
  preparationZiel?: PreparationZiel
  /** Die sichtbare Adresse weicht von der kanonischen Form ab und wird ersetzt. */
  urlAnpassen: boolean
}

type Navigation = Omit<WorkspaceModus, 'urlAnpassen'>

export const WORKSPACE_ANSICHT_LABEL: Record<WorkspaceAnsicht, string> = {
  uebersicht: 'Übersicht',
  plan: 'Reiseplan',
  organisieren: 'Organisieren',
  vorbereitung: 'Vorbereitung',
}

const UEBERSICHT: WorkspaceModus = { ansicht: 'uebersicht', bereich: null, urlAnpassen: false }

function istWorkspaceBereich(wert: string | null): wert is WorkspaceBereich {
  return (WORKSPACE_BEREICHE as readonly (string | null)[]).includes(wert)
}

function istPreparationBereich(wert: string | null): wert is PreparationBereichId {
  return PREPARATION_BEREICHE.some((bereich) => bereich.id === wert)
}

/** Exakte opake Werte; keine Semantik aus Prefix, Titel, Position oder ID-Teilen. */
function refGueltig(wert: string | undefined, max: number): wert is string {
  return wert !== undefined && wert.length > 0 && wert.length <= max &&
    wert.trim() === wert && !/[\p{Cc}\uFFFD]/u.test(wert)
}

function einzeln(params: URLSearchParams, key: string): string | null {
  const werte = params.getAll(key)
  return werte.length === 1 ? werte[0] : null
}

function refLesen(params: URLSearchParams, key: string, max: number): string | undefined {
  const wert = einzeln(params, key) ?? undefined
  return refGueltig(wert, max) ? wert : undefined
}

function rohLesen(params: URLSearchParams): Navigation {
  const ansicht = einzeln(params, 'ansicht')
  if (ansicht === 'plan') {
    const tagId = refLesen(params, 'tag', 80) // Trip day/item schema: max(80)
    const itemId = refLesen(params, 'punkt', 80)
    // Ein mehrdeutiger/malformed Tag darf kein Child öffnen.
    if (params.has('tag') && !tagId) return { ansicht, bereich: null }
    return { ansicht, bereich: null, ...(tagId && { tagId }), ...(itemId && { itemId }) }
  }
  if (ansicht === 'vorbereitung') {
    const bereich = einzeln(params, 'vorbereitung')
    const travellerClientRef = refLesen(params, 'reisender', READINESS_GRENZEN.clientRef)
    return {
      ansicht,
      bereich: null,
      ...(istPreparationBereich(bereich) && {
        preparationZiel: { bereich, ...(travellerClientRef && { travellerClientRef }) },
      }),
    }
  }
  if (ansicht === 'organisieren') {
    const bereich = einzeln(params, 'bereich')
    return { ansicht, bereich: istWorkspaceBereich(bereich) ? bereich : null }
  }
  return { ansicht: 'uebersicht', bereich: null }
}

/** Fremdparameter inklusive Duplikate bleiben erhalten; nur gültige mode-owned Werte werden geschrieben. */
export function queryFuerModus(aktuell: URLSearchParams, modus: Navigation): URLSearchParams {
  const next = new URLSearchParams(aktuell)
  for (const key of WORKSPACE_QUERY_KEYS) next.delete(key)
  if (modus.ansicht === 'uebersicht') return next
  next.append('ansicht', modus.ansicht)
  if (modus.ansicht === 'organisieren' && istWorkspaceBereich(modus.bereich)) next.append('bereich', modus.bereich)
  if (modus.ansicht === 'plan') {
    if (refGueltig(modus.tagId, 80)) next.append('tag', modus.tagId)
    if (refGueltig(modus.itemId, 80) && (!modus.tagId || refGueltig(modus.tagId, 80))) next.append('punkt', modus.itemId)
  }
  if (modus.ansicht === 'vorbereitung' && modus.preparationZiel && istPreparationBereich(modus.preparationZiel.bereich)) {
    next.append('vorbereitung', modus.preparationZiel.bereich)
    if (refGueltig(modus.preparationZiel.travellerClientRef, READINESS_GRENZEN.clientRef)) {
      next.append('reisender', modus.preparationZiel.travellerClientRef)
    }
  }
  return next
}

export function modusAusQuery(params: URLSearchParams): WorkspaceModus {
  const roh = rohLesen(params)
  return { ...roh, urlAnpassen: params.toString() !== queryFuerModus(params, roh).toString() }
}

export function modusUrl(href: string, modus: Navigation): string {
  const url = new URL(href, 'http://127.0.0.1')
  const search = queryFuerModus(url.searchParams, modus).toString()
  return `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
}

/** Revalidiert jede Referenz am aktuellen Graph, auch nach Löschen/Verschieben. */
export function modusFuerReise(modus: WorkspaceModus, reise: Trip, ohneTag: readonly TripItem[]): WorkspaceModus {
  const next = modusAusQuery(queryFuerModus(new URLSearchParams(), modus))
  if (next.ansicht === 'plan') {
    if (next.tagId && !reise.days.some((tag) => tag.id === next.tagId)) delete next.tagId
    if (next.itemId) {
      const punkt = itemInReise(reise, ohneTag, next.itemId)
      if (!punkt) delete next.itemId
      else if (punkt.dayId && reise.days.some((tag) => tag.id === punkt.dayId)) next.tagId = punkt.dayId
      else delete next.tagId
    }
  }
  if (next.preparationZiel?.travellerClientRef && !travellerSlots(reise).some(
    (slot) => slot.applicable && slot.clientRef === next.preparationZiel?.travellerClientRef,
  )) {
    next.preparationZiel = { bereich: next.preparationZiel.bereich }
  }
  const anders = modusUrl('/', modus) !== modusUrl('/', next)
  return anders ? { ...next, urlAnpassen: true } : modus
}

/** Sicherer Parent eines direkten Links; niemals einen Tag aus einer ID erfinden. */
export function detailElternModus(modus: WorkspaceModus): WorkspaceModus {
  if (modus.ansicht === 'plan') {
    return { ansicht: 'plan', bereich: null, ...(modus.tagId && { tagId: modus.tagId }), urlAnpassen: false }
  }
  return { ansicht: 'organisieren', bereich: null, urlAnpassen: false }
}

/** Interne Audit-Starts ohne Query. */
export function modusAusAnfangsBereich(wert: string | null | undefined): WorkspaceModus {
  if (istWorkspaceBereich(wert ?? null)) {
    return { ansicht: 'organisieren', bereich: wert as WorkspaceBereich, urlAnpassen: false }
  }
  return UEBERSICHT
}

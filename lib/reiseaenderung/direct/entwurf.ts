import { z } from 'zod'
import { operationenAnwenden, type KennungFn } from '@/lib/reiseaenderung/anwenden'
import { AENDERUNG_GRENZEN, type Modelloperation } from '@/lib/reiseaenderung/schema'
import { GRENZEN } from '@/lib/trips/schema'
import { TRIP_INTERESTS, TRIP_PACES, type Trip } from '@/types/trips'

const text = (max: number, mehrzeilig = false) => z.string().min(1, 'Bitte einen Wert eingeben.').max(max)
  .refine(s => s === s.trim() && !(mehrzeilig ? /[\u0000-\u0008\u000b-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(s), 'Bitte Text ohne Rand-Leerzeichen oder Steuerzeichen eingeben.')
const datum = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte ein gültiges Kalenderdatum eingeben.')
  .refine(s => { const d = new Date(`${s}T00:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s }, 'Dieses Datum gibt es nicht.')
const id = z.string().min(1).max(80)
const etappe = z.union([
  z.object({ id, days: z.number().int().min(1).max(GRENZEN.reisetageJeReise) }).strict(),
  z.object({ id, remove: z.literal(true) }).strict(),
])
export const manuellSchema = z.object({
  title: text(GRENZEN.titel).optional(),
  budgetAmount: z.number().finite().min(0).max(1_000_000)
    .refine(n => Number(n.toFixed(2)) === n, 'Das Budgetziel erlaubt höchstens zwei Nachkommastellen.').optional(),
  pace: z.enum(TRIP_PACES).optional(),
  interests: z.array(z.enum(TRIP_INTERESTS)).max(TRIP_INTERESTS.length)
    .refine(a => new Set(a).size === a.length, 'Interessen dürfen nicht doppelt vorkommen.').optional(),
  travelWish: text(GRENZEN.reisewunsch, true).optional(),
  startDate: datum.optional(),
  duration: z.number().int().min(1).max(GRENZEN.reisetageJeReise).optional(),
  stages: z.array(etappe).max(GRENZEN.etappenJeReise).optional(),
}).strict()
export type ManuellerEntwurf = z.infer<typeof manuellSchema>
export type EntwurfErgebnis =
  | { ok: true; eingabe: ManuellerEntwurf; operationen: Modelloperation[]; nachher: Trip }
  | { ok: false; meldung: string; feld: string }

function operation(art: Modelloperation['art'], felder: Partial<Modelloperation> = {}): Modelloperation {
  return { art, etappeId: null, tagId: null, punktId: null, nachEtappeId: null, nachTagId: null,
    name: null, laendercode: null, titel: null, notiz: null, beginn: null, punktArt: null,
    tageDelta: null, tage: null, reisende: null, budgetziel: null, tempo: null, interessen: null,
    reisewunsch: null, abreiseort: null, startdatum: null, ...felder }
}
const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const fehler = (meldung: string, feld = 'form'): EntwurfErgebnis => ({ ok: false, meldung, feld })

/** Closed manual subset, no model text transformations and no location authority. */
export function manuellerEntwurf(vorher: Trip, roh: unknown, kennung: KennungFn, quelle: 'guest' | 'account' = 'guest'): EntwurfErgebnis {
  const parsed = manuellSchema.safeParse(roh)
  if (!parsed.success) return fehler(parsed.error.issues[0]?.message ?? 'Bitte Eingaben prüfen.', String(parsed.error.issues[0]?.path[0] ?? 'form'))
  const v = parsed.data
  const items = [...vorher.days.flatMap(d => d.items), ...vorher.ohneTag]
  if ([vorher.stages, vorher.days, items].some(a => new Set(a.map(x => x.id)).size !== a.length))
    return fehler('Die Reise enthält mehrdeutige Kennungen. Bitte die Reise neu laden.')
  const ops: Modelloperation[] = [], basic = operation('stammdaten')
  if (v.title !== undefined && v.title !== vorher.title) basic.titel = v.title
  if (v.budgetAmount !== undefined && v.budgetAmount !== vorher.budgetAmount) basic.budgetziel = v.budgetAmount
  if (v.pace !== undefined && v.pace !== vorher.pace) basic.tempo = v.pace
  if (v.interests !== undefined && !gleich([...v.interests].sort(), [...vorher.interests].sort())) basic.interessen = v.interests
  if (v.travelWish !== undefined && v.travelWish !== vorher.travelWish) basic.reisewunsch = v.travelWish
  if (v.startDate !== undefined && v.startDate !== vorher.startDate) basic.startdatum = v.startDate
  if (Object.entries(basic).some(([key, value]) => key !== 'art' && value !== null)) ops.push(basic)
  const stages = v.stages ?? []
  if (new Set(stages.map(s => s.id)).size !== stages.length) return fehler('Eine Etappe wurde mehrfach angegeben.', 'stages')
  if (stages.some(s => !vorher.stages.some(t => t.id === s.id))) return fehler('Eine gewählte Etappe gehört nicht mehr zu dieser Reise.', 'stages')
  if (stages.filter(s => 'remove' in s).length >= vorher.stages.length && stages.length)
    return fehler('Die letzte Etappe lässt sich nicht entfernen.', 'stages')
  let total = vorher.days.length
  // Order comes from the actual graph, never a same-named city or client ordering.
  for (const stage of vorher.stages) {
    const change = stages.find(s => s.id === stage.id)
    if (!change) continue
    const days = vorher.days.filter(d => d.stageId === stage.id).length
    if ('remove' in change) {
      total -= days
      ops.push(operation('etappe_entfernen', { etappeId: stage.id }))
    } else {
      const delta = change.days - days
      if (Math.abs(delta) > AENDERUNG_GRENZEN.tageDelta) return fehler('Eine Etappe kann je Änderung um höchstens 30 Tage verlängert oder verkürzt werden.', 'stages')
      if (delta) { total += delta; ops.push(operation('etappe_dauer', { etappeId: stage.id, tageDelta: delta })) }
    }
  }
  const struktur = ops.some(op => op.art === 'etappe_dauer' || op.art === 'etappe_entfernen')
  if (struktur && v.duration !== undefined && v.duration !== total)
    return fehler(`Die Etappen ergeben ${total} Tage. Bitte Gesamtdauer und Etappen auf denselben Wert bringen.`, 'duration')
  if (!struktur && v.duration !== undefined && v.duration !== vorher.days.length) {
    const delta = v.duration - vorher.days.length
    if (Math.abs(delta) > AENDERUNG_GRENZEN.tageDelta) return fehler('Die Gesamtdauer kann je Änderung um höchstens 30 Tage verlängert oder verkürzt werden.', 'duration')
    ops.push(operation('dauer_aendern', { tageDelta: delta }))
  }
  if (!ops.length) return fehler('Es gibt noch keine Änderung.')
  if (ops.length > AENDERUNG_GRENZEN.operationen) return fehler('Diese Änderung überschreitet die Grenze von 20 Operationen.')
  const angewandt = operationenAnwenden(vorher, ops, kennung)
  if (!angewandt.ok) return fehler(angewandt.fehler.meldung + (vorher.readinessItems?.some(t => t.tripItemId) ? ' Bitte prüfe auch verknüpfte Vorbereitungen; ihre Bezüge werden nicht automatisch entfernt.' : ''))
  const afterItems = [...angewandt.reise.days.flatMap(d => d.items), ...angewandt.reise.ohneTag]
  if ([angewandt.reise.stages, angewandt.reise.days, afterItems].some(a => new Set(a.map(x => x.id)).size !== a.length))
    return fehler('Die Änderung würde mehrdeutige Kennungen erzeugen. Bitte eine neue Vorschau erstellen.')
  return { ok: true, eingabe: v, operationen: ops, nachher: quelle === 'account' ? { ...angewandt.reise, dayStageAssignmentMode: vorher.dayStageAssignmentMode } : angewandt.reise }
}

/** Preview and commit create the same IDs. Seed is a validated fresh UUID per proposal. */
export function vorschauKennungen(seed: string): KennungFn {
  let n = 0
  return () => `${seed.slice(0, 24)}${(++n).toString(16).padStart(12, '0')}`
}

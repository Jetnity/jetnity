// W2 / #1299: a deliberately narrow inverse of the *last confirmed* edit.
// It reuses the existing owner-authorised graph reader and revision-checked
// writer. No database history, commercial update, new role or provider API.
import { z } from 'zod'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'
import { reiseSchema } from '@/lib/trips/schema'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import { bedeutung, fingerprint, kanonisch, mutationskennung, type SpeicherErgebnis } from './bestaetigung'
import { manuellerEntwurf, vorschauKennungen, type ManuellerEntwurf } from './entwurf'
import type { Trip, TripItem } from '@/types/trips'

export const RUECKNAHME_FRIST_MS = 120_000

const anfrageSchema = z.object({
  vorher: reiseSchema,
  nachher: reiseSchema,
  seed: z.string().uuid(),
  nurPruefen: z.boolean().optional(),
}).strict()

type Quelle = 'account' | 'guest'
type Rueckgabe = { ok: true; eingabe: ManuellerEntwurf; geplant: Trip; operationen: ModellOperationen }
  | { ok: false; meldung: string }
type ModellOperationen = Modelloperation[]

const AENDERUNG_GESCHUETZT = 'Diese Änderung lässt sich nicht sicher rückgängig machen. Gebuchte Leistungen bleiben unverändert. Bitte prüfe deine Reise und bereite eine neue Änderung vor.'
const VERALTET = 'Deine Reise wurde inzwischen geändert. Bitte lade den aktuellen Stand und prüfe deine Änderung erneut.'
const ABGELAUFEN = 'Die kurze Zeit für «Änderung rückgängig» ist vorbei. Deine Reise bleibt gespeichert.'
const UNGEWISS = 'Ob das Rückgängigmachen gespeichert wurde, ist noch unklar. Prüfe zuerst den aktuellen Reisestand.'
const KONTEXT = 'Die zuletzt gespeicherte Änderung ist für diese Reise nicht bestätigt. Lade deine Reise neu.'

function allePunkte(reise: Trip): Map<string, TripItem> {
  return new Map([...reise.days.flatMap(tag => tag.items), ...reise.ohneTag].map(p => [p.id, p]))
}
function ohneZeilenfassung(punkt: TripItem) {
  const { rowVersion: _version, ...felder } = punkt
  void _version
  return kanonisch(felder)
}
function gebuchtePunkteBleiben(vorher: Trip, nachher: Trip): boolean {
  const alt = allePunkte(vorher), neu = allePunkte(nachher)
  for (const id of new Set([...alt.keys(), ...neu.keys()])) {
    const a = alt.get(id), b = neu.get(id)
    if (!(a && istKommerziell(a)) && !(b && istKommerziell(b))) continue
    if (!a || !b || ohneZeilenfassung(a) !== ohneZeilenfassung(b)) return false
  }
  return true
}

/** Return only an edit expressible through the existing closed manual subset. */
function gegenentwurf(vorher: Trip, nachher: Trip): ManuellerEntwurf | null {
  if (vorher.id !== nachher.id) return null
  const eingabe: ManuellerEntwurf = {}
  if (vorher.title !== nachher.title) eingabe.title = vorher.title
  if (vorher.budgetAmount !== nachher.budgetAmount) {
    if (vorher.budgetAmount === null) return null
    eingabe.budgetAmount = vorher.budgetAmount
  }
  if (vorher.pace !== nachher.pace) eingabe.pace = vorher.pace
  if (kanonisch(vorher.interests) !== kanonisch(nachher.interests)) eingabe.interests = vorher.interests
  if (vorher.travelWish !== nachher.travelWish) {
    if (!vorher.travelWish) return null
    eingabe.travelWish = vorher.travelWish
  }
  if (vorher.startDate !== nachher.startDate) {
    if (!vorher.startDate) return null
    eingabe.startDate = vorher.startDate
  }
  // Removed/added stages cannot be recreated with the same original IDs.
  // Never silently manufacture a new city or a replacement day identity.
  if (kanonisch(vorher.stages.map(s => s.id)) !== kanonisch(nachher.stages.map(s => s.id))) return null
  const count = (reise: Trip, stageId: string) => reise.days.filter(d => d.stageId === stageId).length
  const geaenderteEtappen = vorher.stages.flatMap(s => {
    const ursprung = count(vorher, s.id), aktuell = count(nachher, s.id)
    return ursprung === aktuell ? [] : [{ id: s.id, days: ursprung }]
  })
  if (geaenderteEtappen.some(s => s.days < 1)) return null
  if (geaenderteEtappen.length) {
    eingabe.stages = geaenderteEtappen
    if (vorher.days.length !== nachher.days.length) eingabe.duration = vorher.days.length
  } else if (vorher.days.length !== nachher.days.length) {
    eingabe.duration = vorher.days.length
  } else if (vorher.days.some((d, i) => d.stageId !== nachher.days[i]?.stageId)) {
    eingabe.verteilung = vorher.stages.map(s => ({ id: s.id, days: count(vorher, s.id) }))
  }
  return Object.keys(eingabe).length ? eingabe : null
}

/** Pure, bounded eligibility check; never promises to reverse a provider booking. */
export function rueckgabePlanen(vorher: Trip, nachher: Trip, quelle: Quelle, seed: string): Rueckgabe {
  if (!gebuchtePunkteBleiben(vorher, nachher)) return { ok: false, meldung: AENDERUNG_GESCHUETZT }
  const eingabe = gegenentwurf(vorher, nachher)
  if (!eingabe) return { ok: false, meldung: AENDERUNG_GESCHUETZT }
  const result = manuellerEntwurf(nachher, eingabe, vorschauKennungen(seed), quelle)
  if (!result.ok || bedeutung(result.nachher) !== bedeutung(vorher))
    return { ok: false, meldung: AENDERUNG_GESCHUETZT }
  return { ok: true, eingabe, geplant: result.nachher, operationen: result.operationen }
}

function fristGeprueft(nachher: Trip, jetzt: number): boolean {
  const gespeichert = Date.parse(nachher.updatedAt)
  return Number.isFinite(gespeichert) && jetzt >= gespeichert - 5_000 && jetzt - gespeichert <= RUECKNAHME_FRIST_MS
}

export async function rueckgaengigSpeichern(roh: unknown, ports: {
  quelle: Quelle
  lesen: (id: string) => Promise<Trip | null>
  schreiben: (graph: Trip, mutationId: string, revision: number, ops: ModellOperationen) => Promise<{ konflikt: boolean }>
  jetzt?: () => number
}): Promise<SpeicherErgebnis> {
  const parsed = anfrageSchema.safeParse(roh)
  if (!parsed.success) return { ok: false, art: 'eingabe', meldung: 'Der letzte Änderungsstand kann nicht geprüft werden.' }
  const { vorher, nachher, seed, nurPruefen } = parsed.data
  if (vorher.id !== nachher.id || vorher.revision + 1 !== nachher.revision || !nachher.lastMutationId)
    return { ok: false, art: 'konflikt', meldung: KONTEXT }
  // The backend is authoritative. A browser-supplied "before" graph by itself
  // cannot write anything: same revision, last mutation and exact current
  // meaning must hold, and only the existing manual operations can undo it.
  const plan = rueckgabePlanen(vorher, nachher, ports.quelle, seed)
  if (!plan.ok) return { ok: false, art: 'eingabe', meldung: plan.meldung }
  const originalHash = await fingerprint(bedeutung(vorher))
  const afterHash = await fingerprint(bedeutung(nachher))
  const undoMutation = await mutationskennung(seed, vorher.id, nachher.revision, {
    art: 'w2-rueckgaengig-v1', letzteMutation: nachher.lastMutationId, originalHash, afterHash,
  })

  let current: Trip | null
  try { current = await ports.lesen(vorher.id) }
  catch { return { ok: false, art: 'unverfuegbar', meldung: 'Deine Reise kann gerade nicht gelesen werden. Es wurde nichts erneut geändert.' } }
  if (!current || current.id !== vorher.id) return { ok: false, art: 'sitzung', meldung: 'Deine Reise ist gerade nicht verfügbar. Es wurde nichts geändert.' }
  // Idempotent acknowledgement after the exact same undo: no second write.
  if (current.revision === nachher.revision + 1 && current.lastMutationId === undoMutation
    && await fingerprint(bedeutung(current)) === originalHash) return { ok: true, reise: current }
  if (current.revision !== nachher.revision || current.lastMutationId !== nachher.lastMutationId
    || await fingerprint(bedeutung(current)) !== afterHash)
    return { ok: false, art: 'konflikt', meldung: VERALTET }
  if (!fristGeprueft(current, (ports.jetzt ?? Date.now)()))
    return { ok: false, art: 'konflikt', meldung: ABGELAUFEN }
  if (nurPruefen) return { ok: false, art: 'unverfuegbar', meldung: 'Die Rücknahme ist im aktuellen Reisestand noch nicht bestätigt.' }
  // Re-run the inverse on the fresh authorised trip (not on the old client
  // snapshot). A changed protected item, version or any stale material fails.
  const freshPlan = rueckgabePlanen(vorher, current, ports.quelle, seed)
  if (!freshPlan.ok || await fingerprint(bedeutung(freshPlan.geplant)) !== originalHash)
    return { ok: false, art: 'konflikt', meldung: VERALTET }

  let konflikt = false
  try { konflikt = (await ports.schreiben(freshPlan.geplant, undoMutation, current.revision, freshPlan.operationen)).konflikt }
  catch { /* Lost acknowledgement is not proof of rollback. Read back. */ }
  try {
    const readback = await ports.lesen(vorher.id)
    if (readback && readback.revision === nachher.revision + 1 && readback.lastMutationId === undoMutation
      && await fingerprint(bedeutung(readback)) === originalHash) return { ok: true, reise: readback }
    if (readback && readback.revision !== current.revision && readback.lastMutationId !== undoMutation)
      return { ok: false, art: 'konflikt', meldung: VERALTET }
  } catch { /* uncertain until another explicit read */ }
  return { ok: false, art: konflikt ? 'konflikt' : 'ungewiss', meldung: konflikt ? VERALTET : UNGEWISS }
}

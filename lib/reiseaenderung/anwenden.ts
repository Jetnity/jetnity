// lib/reiseaenderung/anwenden.ts
//
// Wendet geprüfte Modelloperationen auf eine vertrauenswürdige Reise an.
//
// Das Modell schreibt nicht in die Datenbank. Es liefert Operationen. Diese
// Datei ist die einzige Stelle, die daraus einen neuen Reisegraphen macht.
// Nach dem Anwenden muss das Ergebnis erneut durch `reiseSchema`. Kommerzielle
// Planpunkte sind bis Phase 3 vollständig gesperrt: Inhalt, Termin und
// Zuordnung bleiben. Entfällt ihr Tag oder ihre Etappe, bleiben sie ungeplant
// und sonst unverändert. Neue Planpunkte bleiben ohne Handelsfelder.
//
// Frei von Next, Supabase und `process.env`.

import { GRENZEN, reiseLesen } from '@/lib/trips/schema'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { datumVerschieben } from '@/lib/trips/tage'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import type { Reisegraph, TripDay, TripItem, TripStage } from '@/types/trips'
import { kommerziellErhalten, istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'

export type KennungFn = (prefix: string) => string

export type AnwendenFehler = {
  code: 'unbekannte-referenz' | 'ungueltig' | 'grenze'
  meldung: string
}

export type AnwendenErgebnis =
  | { ok: true; reise: Reisegraph }
  | { ok: false; fehler: AnwendenFehler }

class ApplyError extends Error {
  readonly code: AnwendenFehler['code']

  constructor(code: AnwendenFehler['code'], meldung: string) {
    super(meldung)
    this.code = code
  }
}

function alsGraph(reise: Reisegraph): Reisegraph {
  return structuredClone(reise)
}

function etappeSuchen(reise: Reisegraph, id: string | null, meldung: string): TripStage {
  if (!id) throw new ApplyError('unbekannte-referenz', meldung)
  const gefunden = reise.stages.find((etappe) => etappe.id === id)
  if (!gefunden) throw new ApplyError('unbekannte-referenz', meldung)
  return gefunden
}

function tagSuchen(reise: Reisegraph, id: string | null, meldung: string): TripDay {
  if (!id) throw new ApplyError('unbekannte-referenz', meldung)
  const gefunden = reise.days.find((tag) => tag.id === id)
  if (!gefunden) throw new ApplyError('unbekannte-referenz', meldung)
  return gefunden
}

function punktSuchen(
  reise: Reisegraph,
  id: string | null,
  meldung: string,
): { punkt: TripItem; tag: TripDay | null } {
  if (!id) throw new ApplyError('unbekannte-referenz', meldung)
  for (const tag of reise.days) {
    const punkt = tag.items.find((eintrag) => eintrag.id === id)
    if (punkt) return { punkt, tag }
  }
  const ohne = reise.ohneTag.find((eintrag) => eintrag.id === id)
  if (ohne) return { punkt: ohne, tag: null }
  throw new ApplyError('unbekannte-referenz', meldung)
}

function tageDerEtappe(reise: Reisegraph, stageId: string): TripDay[] {
  return reise.days.filter((tag) => tag.stageId === stageId)
}

function reindex(reise: Reisegraph): void {
  const geordnet = [...reise.days].sort((a, b) => a.dayIndex - b.dayIndex || a.id.localeCompare(b.id))
  const start = reise.startDate
  geordnet.forEach((tag, stelle) => {
    tag.dayIndex = stelle + 1
    if (start) tag.dayDate = datumVerschieben(start, stelle)
    tag.items.forEach((punkt, ort) => {
      if (istKommerziell(punkt)) return
      punkt.position = ort + 1
      punkt.dayId = tag.id
      if (tag.dayDate) {
        punkt.startsOn = punkt.startsOn ? tag.dayDate : punkt.startsOn
      }
    })
  })
  reise.days = geordnet
  reise.stages = [...reise.stages].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  reise.stages.forEach((etappe, stelle) => {
    etappe.position = stelle + 1
    const tage = tageDerEtappe(reise, etappe.id)
    if (tage.length === 0) {
      etappe.arrivalDate = null
      etappe.departureDate = null
      return
    }
    etappe.arrivalDate = tage[0]?.dayDate ?? null
    etappe.departureDate = tage[tage.length - 1]?.dayDate ?? null
  })
  if (reise.days.length > 0 && start) {
    reise.endDate = reise.days[reise.days.length - 1]?.dayDate ?? reise.endDate
  } else if (reise.days.length === 0) {
    reise.endDate = reise.startDate
  }
}

function tagePruefen(reise: Reisegraph) {
  if (reise.days.length > GRENZEN.reisetageJeReise) {
    throw new ApplyError('grenze', `Eine Reise trägt höchstens ${GRENZEN.reisetageJeReise} Tage.`)
  }
  if (reise.days.length < 1) {
    throw new ApplyError('ungueltig', 'Eine Reise braucht mindestens einen Tag.')
  }
  if (reise.stages.length > GRENZEN.etappenJeReise) {
    throw new ApplyError('grenze', `Eine Reise trägt höchstens ${GRENZEN.etappenJeReise} Etappen.`)
  }
  const punkte =
    reise.days.reduce((summe, tag) => summe + tag.items.length, 0) + reise.ohneTag.length
  if (punkte > GRENZEN.punkteJeReise) {
    throw new ApplyError('grenze', `Eine Reise trägt höchstens ${GRENZEN.punkteJeReise} Planpunkte.`)
  }
}

function leererTag(id: string, stageId: string | null, dayIndex: number, dayDate: string | null, title: string | null): TripDay {
  return { id, stageId, dayIndex, dayDate, title, items: [] }
}

function stammdaten(reise: Reisegraph, op: Modelloperation) {
  if (op.titel) reise.title = op.titel
  if (op.abreiseort !== null) {
    reise.origin = op.abreiseort
    reise.originPlaceId = null
  }
  if (op.reisende !== null) reise.travellers = op.reisende
  if (op.budgetziel !== null) reise.budgetAmount = op.budgetziel
  if (op.tempo !== null) reise.pace = op.tempo
  if (op.interessen !== null) reise.interests = [...new Set(op.interessen)]
  if (op.reisewunsch !== null) reise.travelWish = op.reisewunsch
  if (op.startdatum) {
    if (reise.startDate) {
      const delta = Math.round(
        (Date.parse(`${op.startdatum}T00:00:00Z`) - Date.parse(`${reise.startDate}T00:00:00Z`)) /
          86_400_000,
      )
      if (delta !== 0) zeitraumVerschieben(reise, { ...op, tageDelta: delta })
    } else {
      reise.startDate = op.startdatum
      reindex(reise)
    }
  }
}

function zeitraumVerschieben(reise: Reisegraph, op: Modelloperation) {
  const delta = op.tageDelta
  if (!delta) return
  reise.startDate = datumVerschieben(reise.startDate, delta)
  reise.endDate = datumVerschieben(reise.endDate, delta)
  for (const etappe of reise.stages) {
    etappe.arrivalDate = datumVerschieben(etappe.arrivalDate, delta)
    etappe.departureDate = datumVerschieben(etappe.departureDate, delta)
  }
  for (const tag of reise.days) {
    tag.dayDate = datumVerschieben(tag.dayDate, delta)
    for (const punkt of tag.items) {
      if (istKommerziell(punkt)) continue
      punkt.startsOn = datumVerschieben(punkt.startsOn, delta)
      punkt.endsOn = datumVerschieben(punkt.endsOn, delta)
    }
  }
  for (const punkt of reise.ohneTag) {
    if (istKommerziell(punkt)) continue
    punkt.startsOn = datumVerschieben(punkt.startsOn, delta)
    punkt.endsOn = datumVerschieben(punkt.endsOn, delta)
  }
}

function tageEinfuegen(
  reise: Reisegraph,
  nachIndex: number,
  anzahl: number,
  stageId: string | null,
  kennung: KennungFn,
) {
  const start = reise.days[nachIndex - 1]
  const basisDatum = start?.dayDate ?? reise.startDate
  const neue: TripDay[] = []
  for (let i = 1; i <= anzahl; i += 1) {
    neue.push(
      leererTag(
        kennung('day'),
        stageId ?? start?.stageId ?? reise.stages[reise.stages.length - 1]?.id ?? null,
        nachIndex + i,
        datumVerschieben(basisDatum, i),
        null,
      ),
    )
  }
  const davor = reise.days.filter((tag) => tag.dayIndex <= nachIndex)
  const danach = reise.days.filter((tag) => tag.dayIndex > nachIndex).map((tag) => ({
    ...tag,
    dayIndex: tag.dayIndex + anzahl,
    dayDate: datumVerschieben(tag.dayDate, anzahl),
  }))
  reise.days = [...davor, ...neue, ...danach]
  reindex(reise)
  tagePruefen(reise)
}

function tageEntfernenAb(reise: Reisegraph, ids: Set<string>) {
  const entfernt: TripItem[] = []
  reise.days = reise.days.filter((tag) => {
    if (!ids.has(tag.id)) return true
    for (const punkt of tag.items) {
      if (istKommerziell(punkt)) {
        entfernt.push({ ...punkt, dayId: null, stageId: null })
      }
    }
    return false
  })
  reise.ohneTag = [...reise.ohneTag, ...entfernt]
  reindex(reise)
  tagePruefen(reise)
}

function dauerAendern(reise: Reisegraph, op: Modelloperation, kennung: KennungFn) {
  const delta = op.tageDelta
  if (!delta) return
  if (delta > 0) {
    const letzte = reise.days[reise.days.length - 1]
    tageEinfuegen(reise, letzte?.dayIndex ?? 0, delta, letzte?.stageId ?? null, kennung)
    return
  }
  const entfernen = Math.min(-delta, reise.days.length - 1)
  const ids = new Set(reise.days.slice(-entfernen).map((tag) => tag.id))
  tageEntfernenAb(reise, ids)
  reise.stages = reise.stages.filter((etappe) => tageDerEtappe(reise, etappe.id).length > 0)
  reindex(reise)
}

function etappeEntfernen(reise: Reisegraph, op: Modelloperation) {
  const etappe = etappeSuchen(reise, op.etappeId, 'Diese Etappe gehört nicht zur Reise.')
  if (reise.stages.length <= 1) {
    throw new ApplyError('ungueltig', 'Die letzte Etappe einer Reise lässt sich nicht entfernen.')
  }
  const ids = new Set(tageDerEtappe(reise, etappe.id).map((tag) => tag.id))
  tageEntfernenAb(reise, ids)
  reise.stages = reise.stages.filter((eintrag) => eintrag.id !== etappe.id)
  reindex(reise)
}

function etappeHinzufuegen(reise: Reisegraph, op: Modelloperation, kennung: KennungFn) {
  const name = op.name
  if (!name) throw new ApplyError('ungueltig', 'Die neue Etappe braucht einen Ort.')
  const anzahl = op.tage ?? 1
  let nachPosition = reise.stages.length
  if (op.nachEtappeId) {
    const davor = etappeSuchen(reise, op.nachEtappeId, 'Die Etappe, nach der eingefügt werden soll, ist unbekannt.')
    nachPosition = davor.position
  }
  const id = kennung('stage')
  const neu: TripStage = {
    id,
    position: nachPosition + 1,
    name,
    countryCode: op.laendercode,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
  }
  reise.stages = reise.stages.map((etappe) =>
    etappe.position > nachPosition ? { ...etappe, position: etappe.position + 1 } : etappe,
  )
  reise.stages.push(neu)
  const letzteDerVorigen =
    reise.days.filter((tag) => {
      const etappe = reise.stages.find((eintrag) => eintrag.id === tag.stageId)
      return (etappe?.position ?? 0) <= nachPosition
    }).sort((a, b) => a.dayIndex - b.dayIndex).at(-1)

  tageEinfuegen(reise, letzteDerVorigen?.dayIndex ?? reise.days.length, anzahl, id, kennung)
}

function etappeDauer(reise: Reisegraph, op: Modelloperation, kennung: KennungFn) {
  const etappe = etappeSuchen(reise, op.etappeId, 'Diese Etappe gehört nicht zur Reise.')
  const delta = op.tageDelta
  if (!delta) return
  const tage = tageDerEtappe(reise, etappe.id)
  if (delta > 0) {
    const letzter = tage[tage.length - 1]
    tageEinfuegen(reise, letzter?.dayIndex ?? reise.days.length, delta, etappe.id, kennung)
    return
  }
  if (tage.length + delta < 1) {
    throw new ApplyError('ungueltig', 'Eine Etappe braucht mindestens einen Tag.')
  }
  const ids = new Set(tage.slice(delta).map((tag) => tag.id))
  tageEntfernenAb(reise, ids)
}

function tagEntfernen(reise: Reisegraph, op: Modelloperation) {
  const tag = tagSuchen(reise, op.tagId, 'Dieser Tag gehört nicht zur Reise.')
  if (reise.days.length <= 1) {
    throw new ApplyError('ungueltig', 'Der letzte Tag einer Reise lässt sich nicht entfernen.')
  }
  tageEntfernenAb(reise, new Set([tag.id]))
  reise.stages = reise.stages.filter((etappe) => tageDerEtappe(reise, etappe.id).length > 0 || reise.stages.length === 1)
  reindex(reise)
}

function tagHinzufuegen(reise: Reisegraph, op: Modelloperation, kennung: KennungFn) {
  let nachIndex = reise.days.length
  let stageId = op.etappeId
  if (op.nachTagId) {
    const davor = tagSuchen(reise, op.nachTagId, 'Der Tag, nach dem eingefügt werden soll, ist unbekannt.')
    nachIndex = davor.dayIndex
    stageId = stageId ?? davor.stageId
  } else if (op.etappeId) {
    const etappe = etappeSuchen(reise, op.etappeId, 'Diese Etappe gehört nicht zur Reise.')
    const letzte = tageDerEtappe(reise, etappe.id).at(-1)
    nachIndex = letzte?.dayIndex ?? reise.days.length
    stageId = etappe.id
  }
  if (stageId) etappeSuchen(reise, stageId, 'Diese Etappe gehört nicht zur Reise.')
  tageEinfuegen(reise, nachIndex, 1, stageId, kennung)
  if (op.titel) {
    const neu = reise.days[nachIndex]
    if (neu) neu.title = op.titel
  }
}

function tagTitel(reise: Reisegraph, op: Modelloperation) {
  const tag = tagSuchen(reise, op.tagId, 'Dieser Tag gehört nicht zur Reise.')
  tag.title = op.titel
}

function punktEntfernen(reise: Reisegraph, op: Modelloperation) {
  const { punkt, tag } = punktSuchen(reise, op.punktId, 'Dieser Planpunkt gehört nicht zur Reise.')
  if (istKommerziell(punkt)) return
  if (tag) tag.items = tag.items.filter((eintrag) => eintrag.id !== punkt.id)
  else reise.ohneTag = reise.ohneTag.filter((eintrag) => eintrag.id !== punkt.id)
}

function punktHinzufuegen(reise: Reisegraph, op: Modelloperation, kennung: KennungFn) {
  const titel = op.titel
  if (!titel) throw new ApplyError('ungueltig', 'Der neue Planpunkt braucht einen Titel.')
  let tag: TripDay | null = null
  if (op.tagId) tag = tagSuchen(reise, op.tagId, 'Dieser Tag gehört nicht zur Reise.')
  const punkt: TripItem = {
    id: kennung('item'),
    dayId: tag?.id ?? null,
    stageId: op.etappeId ?? tag?.stageId ?? null,
    kind: op.punktArt ?? 'note',
    title: titel,
    note: op.notiz,
    position: (tag?.items.length ?? reise.ohneTag.length) + 1,
    startsOn: tag?.dayDate ?? null,
    startsAt: op.beginn,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
  }
  if (tag) tag.items.push(punkt)
  else reise.ohneTag.push(punkt)
}

function punktAnpassen(reise: Reisegraph, op: Modelloperation) {
  const { punkt } = punktSuchen(reise, op.punktId, 'Dieser Planpunkt gehört nicht zur Reise.')
  if (istKommerziell(punkt)) return
  if (op.titel) punkt.title = op.titel
  if (op.notiz !== null) punkt.note = op.notiz
  if (op.punktArt) punkt.kind = op.punktArt
  if (op.beginn !== null) punkt.startsAt = op.beginn
  if (op.tagId) {
    const ziel = tagSuchen(reise, op.tagId, 'Dieser Tag gehört nicht zur Reise.')
    for (const tag of reise.days) {
      tag.items = tag.items.filter((eintrag) => eintrag.id !== punkt.id)
    }
    reise.ohneTag = reise.ohneTag.filter((eintrag) => eintrag.id !== punkt.id)
    punkt.dayId = ziel.id
    punkt.stageId = ziel.stageId
    punkt.startsOn = ziel.dayDate
    punkt.position = ziel.items.length + 1
    ziel.items.push(punkt)
  }
}

function eineOperation(reise: Reisegraph, op: Modelloperation, kennung: KennungFn) {
  switch (op.art) {
    case 'stammdaten':
      stammdaten(reise, op)
      break
    case 'zeitraum_verschieben':
      zeitraumVerschieben(reise, op)
      break
    case 'dauer_aendern':
      dauerAendern(reise, op, kennung)
      break
    case 'etappe_entfernen':
      etappeEntfernen(reise, op)
      break
    case 'etappe_hinzufuegen':
      etappeHinzufuegen(reise, op, kennung)
      break
    case 'etappe_dauer':
      etappeDauer(reise, op, kennung)
      break
    case 'tag_entfernen':
      tagEntfernen(reise, op)
      break
    case 'tag_hinzufuegen':
      tagHinzufuegen(reise, op, kennung)
      break
    case 'tag_titel':
      tagTitel(reise, op)
      break
    case 'punkt_entfernen':
      punktEntfernen(reise, op)
      break
    case 'punkt_hinzufuegen':
      punktHinzufuegen(reise, op, kennung)
      break
    case 'punkt_anpassen':
      punktAnpassen(reise, op)
      break
  }
}

/**
 * Wendet die Operationen der Reihe nach auf eine Kopie der Reise an.
 *
 * Scheitert eine Operation, bleibt das Original unangetastet. Das Ergebnis
 * läuft durch dasselbe Reiseschema wie jede andere Reise.
 */
export function operationenAnwenden(
  original: Reisegraph,
  operationen: Modelloperation[],
  kennung: KennungFn,
): AnwendenErgebnis {
  if (operationen.length === 0) {
    return { ok: false, fehler: { code: 'ungueltig', meldung: 'Es liegt keine Änderung vor.' } }
  }

  const reise = tageEtappenZuordnen(alsGraph(original))

  try {
    for (const op of operationen) eineOperation(reise, op, kennung)
    reindex(reise)
    tagePruefen(reise)
  } catch (fehler) {
    if (fehler instanceof ApplyError) {
      return { ok: false, fehler: { code: fehler.code, meldung: fehler.message } }
    }
    throw fehler
  }

  const erhalten = kommerziellErhalten(original, reise)
  const geprueft = reiseLesen(erhalten)
  if (!geprueft) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltig',
        meldung: 'Die Änderung ergibt keine gültige Reise und wurde verworfen.',
      },
    }
  }

  return { ok: true, reise: geprueft }
}

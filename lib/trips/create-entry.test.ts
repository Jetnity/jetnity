import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { neueReiseSchema } from '@/lib/trips/schema'
import {
  CREATE_PERSISTENZ_INTERESSEN,
  CREATE_PERSISTENZ_TEMPO,
  createEinstiegFuerGast,
  darfCreateModellAufrufen,
  gastCreateGate,
  genericCreateHrefFuerGast,
  planenVorbelegung,
} from '@/lib/trips/create-entry'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('TW-6 Create-Entry – Guest-One-Trip Gate', () => {
  test('Gast ohne Reise darf erstellen', () => {
    const gate = gastCreateGate({ angemeldet: false, aktiveReiseId: null })
    assert.equal(gate.erlaubt, true)
    assert.equal(darfCreateModellAufrufen(gate), true)
  })

  test('Gast mit aktiver Reise wird vor dem Modellaufruf blockiert', () => {
    const gate = gastCreateGate({ angemeldet: false, aktiveReiseId: 'trip-besteht' })
    assert.equal(gate.erlaubt, false)
    if (gate.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(gate.bestehendeId, 'trip-besteht')
    assert.equal(darfCreateModellAufrufen(gate), false)
  })

  test('Konto darf trotz lokalem Restentwurf eine weitere Reise anlegen', () => {
    const gate = gastCreateGate({ angemeldet: true, aktiveReiseId: 'trip-rest' })
    assert.equal(gate.erlaubt, true)
    assert.equal(darfCreateModellAufrufen(gate), true)
  })

  test('leere Kennung zählt nicht als bestehende Reise', () => {
    assert.equal(gastCreateGate({ angemeldet: false, aktiveReiseId: '   ' }).erlaubt, true)
  })
})

describe('TW-6 Create-Entry – Gast-CTA', () => {
  test('ohne Reise führt der Einstieg nach /planen', () => {
    const cta = createEinstiegFuerGast(null)
    assert.equal(cta.art, 'erstellen')
    assert.equal(cta.href, '/planen')
    assert.equal(cta.label, 'Reise erstellen')
  })

  test('mit Reise gibt es keinen zweiten Create', () => {
    const cta = createEinstiegFuerGast({ id: 'trip-1' })
    assert.equal(cta.art, 'fortsetzen')
    assert.equal(cta.href, '/reisen/trip-1')
    assert.equal(cta.label, 'Reise fortsetzen')
  })

  test('generische CTAs werden zur bestehenden Reise umgebogen', () => {
    const ziel = genericCreateHrefFuerGast('/planen', { id: 'trip-1' })
    assert.equal(ziel.href, '/reisen/trip-1')
    assert.equal(ziel.labelErsetzen, true)
  })

  test('zielspezifische Handoffs bleiben Create-Hrefs – die Gate fängt sie', () => {
    const href = '/planen?zielId=geonames%3A1650535'
    const ziel = genericCreateHrefFuerGast(href, null)
    assert.equal(ziel.href, href)
    assert.equal(ziel.labelErsetzen, false)
  })
})

describe('TW-6 Create-Entry – Tempo-Wahrheit', () => {
  test('Persistenzdefault bleibt balanced und kompatibel zum Schema', () => {
    assert.equal(CREATE_PERSISTENZ_TEMPO, 'balanced')
    assert.deepEqual(CREATE_PERSISTENZ_INTERESSEN, [])

    const geprueft = neueReiseSchema.safeParse({
      clientRef: 'trip-tw6',
      title: 'Japan',
      destination: 'Japan',
      destinationPlaceId: 'geonames:1861060',
      origin: 'Zürich',
      originPlaceId: 'geonames:2657896',
      startDate: '2026-10-01',
      endDate: '2026-10-08',
      travellers: 2,
      pace: CREATE_PERSISTENZ_TEMPO,
      interests: CREATE_PERSISTENZ_INTERESSEN,
      travelWish: null,
    })
    assert.equal(geprueft.success, true)
    if (geprueft.success) assert.equal(geprueft.data.pace, 'balanced')
  })

  test('TripPlanner zeigt Tempo nicht als bewusste Nutzerwahl', () => {
    const datei = quelle('../../components/trips/TripPlanner.tsx')
    assert.equal(datei.includes('Reisetempo'), false)
    assert.equal(datei.includes('TEMPO_BEZEICHNUNG'), false)
    assert.equal(datei.includes('TRIP_PACES'), false)
    assert.equal(datei.includes('aria-pressed'), false)
    assert.equal(datei.includes("useState<TripPace>('balanced')"), false)
    assert.match(datei, /CREATE_PERSISTENZ_TEMPO/)
  })
})

describe('TW-6 Create-Entry – Input Truth', () => {
  test('fehlender Startort bleibt fehlend und wird nicht zu ZRH', () => {
    const vorbelegung = planenVorbelegung({
      zielId: 'geonames:1650535',
      zielName: 'Bali',
      idee: 'Strand',
      originId: 'airport:ZRH',
      originName: 'Zürich',
    })
    assert.equal(vorbelegung.destinationId, 'geonames:1650535')
    assert.equal(vorbelegung.destination, 'Bali')
    assert.equal(vorbelegung.idee, 'Strand')
    assert.equal(vorbelegung.originId, '')
    assert.equal(vorbelegung.origin, '')
  })

  test('Homepage-Handoff gibt nur zielId und optional idee weiter', () => {
    const auswahl = quelle('../places/auswahl.ts')
    assert.match(auswahl, /params\.set\('zielId'/)
    assert.match(auswahl, /params\.set\('idee'/)
    assert.equal(auswahl.includes("params.set('origin"), false)
    assert.equal(auswahl.includes('ZRH'), false)
  })

  test('TripPlanner startet ohne erfundenen Abreiseort', () => {
    const datei = quelle('../../components/trips/TripPlanner.tsx')
    assert.match(datei, /useState\(''\)/)
    assert.equal(/setOriginOrt\(\{\s*id:\s*'airport:ZRH'/.test(datei), false)
    assert.equal(datei.includes('Staatsbürgerschaft'), false)
    assert.equal(datei.includes('Reisepass'), false)
  })
})

describe('TW-6 Create-Entry – kein dritter Persistenzpfad', () => {
  test('Create-Persistenz bleibt auf den zwei /planen-Wegen plus Guest→Account', () => {
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    const idee = quelle('../../components/trips/Reiseidee.tsx')
    const workspace = quelle('../../components/trips/TripWorkspace.tsx')

    assert.match(planner, /gastreiseAnlegen/)
    assert.match(idee, /gastreiseAblegen/)
    assert.equal(workspace.includes('gastreiseAnlegen'), false)
    assert.equal(workspace.includes('gastreiseAblegen'), false)
    assert.equal(workspace.includes('reiseAnlegen'), false)
  })

  test('Reiseidee prüft den Guest-Slot vor dem Modellaufruf', () => {
    const datei = quelle('../../components/trips/Reiseidee.tsx')
    const erzeugen = datei.slice(datei.indexOf('const erzeugen'))
    const gate = erzeugen.indexOf('gastCreateGate')
    const modell = erzeugen.indexOf('vorschlagErzeugen')
    assert.ok(gate >= 0, 'Reiseidee muss gastCreateGate im Erzeugen nutzen')
    assert.ok(modell >= 0, 'Reiseidee muss vorschlagErzeugen weiter nutzen')
    assert.ok(gate < modell, 'Fail-fast muss vor dem Modellaufruf stehen')
  })

  test('TripPlanner prüft den Guest-Slot vor Ortsbestätigung und Persistenz', () => {
    const datei = quelle('../../components/trips/TripPlanner.tsx')
    const absenden = datei.slice(datei.indexOf('const absenden'))
    const gate = absenden.indexOf('gastCreateGate')
    const orte = absenden.indexOf('reiseorteBestaetigen')
    const persist = absenden.indexOf('gastreiseAnlegen')
    assert.ok(gate >= 0 && orte >= 0 && persist >= 0)
    assert.ok(gate < orte && gate < persist)
  })

  test('GastReisen zeigt bei aktiver Reise keinen zweiten Create', () => {
    const datei = quelle('../../components/trips/GastReisen.tsx')
    assert.equal(datei.includes('Neue Reise'), false)
    assert.match(datei, /createEinstiegFuerGast|gastReisenPrimaerCta/)
  })

  test('GastArbeitsbereich behauptet bei fehlender Reise keine zweite Create-Reise', () => {
    const datei = quelle('../../components/trips/GastArbeitsbereich.tsx')
    assert.equal(datei.includes('Neue Reise'), false)
    assert.match(datei, /createEinstiegFuerGast/)
  })

  test('Homepage-Inspiration bleibt zielspezifischer Handoff, nicht ein dritter Create', () => {
    const start = quelle('../../app/(public)/page.tsx')
    assert.match(start, /zielHref/)
    assert.match(start, /GastCreateLink/)
    assert.equal(start.includes('gastreiseAnlegen'), false)
  })

  test('/planen-Metadata-Vertrag bleibt unangetastet', () => {
    const datei = quelle('../../app/(public)/planen/page.tsx')
    assert.match(datei, /planenRobots/)
    assert.match(datei, /kanonischeUrl\('\/planen'\)/)
    assert.equal(datei.includes('canonical: kanonischeUrl(`/planen?'), false)
    assert.match(datei, /PlanenCreateGate/)
  })

  test('PlanenCreateGate versteckt die Create-Kinder nicht vor dem ersten Speicherlesen', () => {
    const datei = quelle('../../components/trips/PlanenCreateGate.tsx')
    assert.equal(datei.includes('angemeldet ? null : undefined'), false)
    assert.equal(datei.includes('aria-busy'), false)
    assert.match(datei, /useState<\{ id: string; title: string \} \| null>\(null\)/)
  })
})

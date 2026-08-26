import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { zielHref } from '@/lib/places/auswahl'
import { neueReiseSchema } from '@/lib/trips/schema'
import {
  CREATE_PERSISTENZ_INTERESSEN,
  CREATE_PERSISTENZ_TEMPO,
  createEinstiegFuerGast,
  darfCreateModellAufrufen,
  gastCreateGate,
  gastCreateVorNetzschritt,
  genericCreateCtaFuerSitzung,
  genericCreateHrefFuerGast,
  istGenerischerCreateHref,
  planenVorbelegung,
} from '@/lib/trips/create-entry'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('TW6-A Create-Entry – Guest-One-Trip Gate', () => {
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

describe('TW6-A Create-Entry – Gast-CTA', () => {
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
})

describe('TW6-TL-01 – Session-feste generische Create-CTAs', () => {
  const rest = { id: 'trip-rest' }

  test('Gast ohne Trip bleibt auf /planen', () => {
    const cta = genericCreateCtaFuerSitzung({
      createHref: '/planen',
      createLabel: 'Reise planen',
      sitzung: 'gast',
      aktiv: null,
    })
    assert.equal(cta.href, '/planen')
    assert.equal(cta.labelErsetzen, false)
    assert.equal(cta.label, 'Reise planen')
  })

  test('Gast mit aktivem Trip wird zur bestehenden Reise geführt', () => {
    const cta = genericCreateCtaFuerSitzung({
      createHref: '/planen',
      createLabel: 'Reise planen',
      sitzung: 'gast',
      aktiv: { id: 'trip-1' },
    })
    assert.equal(cta.href, '/reisen/trip-1')
    assert.equal(cta.labelErsetzen, true)
    assert.equal(cta.label, 'Reise fortsetzen')
  })

  test('Konto ohne Guest-Storage bleibt Create', () => {
    const cta = genericCreateCtaFuerSitzung({
      createHref: '/planen',
      createLabel: 'Reise planen',
      sitzung: 'konto',
      aktiv: null,
    })
    assert.equal(cta.href, '/planen')
    assert.equal(cta.labelErsetzen, false)
  })

  test('Konto + liegengebliebener Guest-Storage bleibt Create', () => {
    const cta = genericCreateCtaFuerSitzung({
      createHref: '/planen',
      createLabel: 'Reise planen',
      sitzung: 'konto',
      aktiv: rest,
    })
    assert.equal(cta.href, '/planen')
    assert.equal(cta.labelErsetzen, false)
    assert.equal(cta.label, 'Reise planen')
  })

  test('unbekannte Sitzung darf LocalStorage nicht als Gast lesen', () => {
    const cta = genericCreateCtaFuerSitzung({
      createHref: '/planen',
      createLabel: 'Reise planen',
      sitzung: 'unbekannt',
      aktiv: rest,
    })
    assert.equal(cta.href, '/planen')
    assert.equal(cta.labelErsetzen, false)
  })

  test('Login-/Transfer-Grenze: Helper ohne Sitzung remappt nicht', () => {
    const ziel = genericCreateHrefFuerGast('/planen', rest, 'unbekannt')
    assert.equal(ziel.href, '/planen')
    assert.equal(ziel.labelErsetzen, false)
  })

  test('Navbar, Footer, Homepage, 404 und /reisen teilen dieselbe Semantik', () => {
    const navbar = quelle('../../components/layout/PublicNavbar.tsx')
    const footer = quelle('../../components/layout/Footer.tsx')
    const start = quelle('../../app/(public)/page.tsx')
    const notFound = quelle('../../components/layout/NotFoundView.tsx')
    const reisen = quelle('../../app/(public)/reisen/page.tsx')
    const gastReisen = quelle('../../components/trips/GastReisen.tsx')
    const link = quelle('../../components/trips/GastCreateLink.tsx')

    assert.match(navbar, /GastCreateLink/)
    assert.equal(navbar.includes('nurCreate'), false)
    assert.equal((navbar.match(/<GastCreateLink/g) ?? []).length, 2)

    assert.match(footer, /GastCreateLink/)
    assert.match(start, /GastCreateLink/)
    assert.match(notFound, /GastCreateLink/)

    assert.match(link, /standAusSitzung/)
    assert.match(link, /getSession/)
    assert.match(link, /genericCreateCtaFuerSitzung/)
    assert.equal(link.includes('nurCreate'), false)

    assert.match(reisen, /href="\/planen"/)
    assert.match(reisen, /Neue Reise/)
    assert.match(gastReisen, /createEinstiegFuerGast|gastReisenPrimaerCta/)
    assert.equal(gastReisen.includes('Neue Reise'), false)
  })
})

describe('TW6-TL-03 – generischer Helper darf zielspezifische Handoffs nicht umbiegen', () => {
  const bali = zielHref({ id: 'geonames:1650535', name: 'Bali' })
  assert.ok(bali)

  test('nacktes /planen ist generisch', () => {
    assert.equal(istGenerischerCreateHref('/planen'), true)
    assert.equal(istGenerischerCreateHref('/planen?'), true)
  })

  test('zielHref ist kein generischer Create-Href', () => {
    assert.equal(istGenerischerCreateHref(bali), false)
    assert.equal(istGenerischerCreateHref('/planen?ziel=Bali'), false)
    assert.equal(istGenerischerCreateHref('/planen?idee=Strand'), false)
  })

  test('generisches /planen + aktive Reise -> Fortsetzen', () => {
    const ziel = genericCreateHrefFuerGast('/planen', { id: 'trip-lissabon' }, 'gast')
    assert.equal(ziel.href, '/reisen/trip-lissabon')
    assert.equal(ziel.labelErsetzen, true)
  })

  test('zielHref + aktive Reise bleibt semantisch ehrlich', () => {
    const ziel = genericCreateHrefFuerGast(bali, { id: 'trip-lissabon' }, 'gast')
    assert.equal(ziel.href, bali)
    assert.equal(ziel.labelErsetzen, false)
  })

  test('zielHref ohne Reise bleibt unverändert', () => {
    const ziel = genericCreateHrefFuerGast(bali, null, 'gast')
    assert.equal(ziel.href, bali)
    assert.equal(ziel.labelErsetzen, false)
  })

  test('keine ungetestete Helper-Nutzung an neuen Call-Sites', () => {
    const link = quelle('../../components/trips/GastCreateLink.tsx')
    const start = quelle('../../app/(public)/page.tsx')
    assert.match(link, /genericCreateCtaFuerSitzung/)
    assert.equal(link.includes('genericCreateHrefFuerGast('), false)
    assert.match(start, /zielHref/)
    assert.equal(start.includes('genericCreateHrefFuerGast'), false)
    assert.equal(start.includes('genericCreateCtaFuerSitzung'), false)
  })
})

describe('TW6-TL-02 – Zweittab-Race vor Ortsauflösung', () => {
  test('nach Vorschlag in Tab A blockiert der belegte Slot in Tab B den Netzschritt', () => {
    const nachVorschlag = gastCreateVorNetzschritt({
      angemeldet: false,
      aktiveReiseId: null,
    })
    assert.equal(nachVorschlag.erlaubt, true)

    const nachZweittab = gastCreateVorNetzschritt({
      angemeldet: false,
      aktiveReiseId: 'trip-aus-tab-b',
    })
    assert.equal(nachZweittab.erlaubt, false)
    if (nachZweittab.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(nachZweittab.bestehendeId, 'trip-aus-tab-b')
    assert.equal(darfCreateModellAufrufen(nachZweittab), false)
  })

  test('Konto darf den Vorschlag trotz Rest-Gastspeicher übernehmen', () => {
    const gate = gastCreateVorNetzschritt({
      angemeldet: true,
      aktiveReiseId: 'trip-rest',
    })
    assert.equal(gate.erlaubt, true)
  })

  test('Reiseidee.uebernehmen prüft den Gate erneut vor vorschlagOrteAufloesen', () => {
    const datei = quelle('../../components/trips/Reiseidee.tsx')
    const uebernehmen = datei.slice(datei.indexOf('const uebernehmen'))
    const gate = uebernehmen.indexOf('gastCreateVorNetzschritt')
    const orte = uebernehmen.indexOf('vorschlagOrteAufloesen')
    const persist = uebernehmen.indexOf('gastreiseAblegen')
    assert.ok(gate >= 0, 'uebernehmen muss gastCreateVorNetzschritt nutzen')
    assert.ok(orte >= 0 && persist >= 0)
    assert.ok(gate < orte, 'Fail-fast muss vor der Ortsauflösung stehen')
    assert.ok(gate < persist)
    assert.ok(
      uebernehmen.indexOf('setVorschlag(null)') < 0 ||
        uebernehmen.indexOf('setVorschlag(null)') > orte,
      'Der Vorschlag darf beim Fail-fast nicht verworfen werden',
    )
  })
})

describe('TW6-A Create-Entry – Tempo-Wahrheit', () => {
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

describe('TW6-A Create-Entry – Input Truth', () => {
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

describe('TW6-A Create-Entry – kein dritter Persistenzpfad', () => {
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
    const vorNetz = absenden.indexOf('gastCreateVorNetzschritt')
    const orte = absenden.indexOf('reiseorteBestaetigen')
    const persist = absenden.indexOf('gastreiseAnlegen')
    assert.ok(gate >= 0 && vorNetz >= 0 && orte >= 0 && persist >= 0)
    assert.ok(gate < orte && gate < persist)
    assert.ok(vorNetz > gate && vorNetz < orte && vorNetz < persist)
  })

  test('GastReisen zeigt bei aktiver Reise keinen zweiten Create', () => {
    const datei = quelle('../../components/trips/GastReisen.tsx')
    assert.equal(datei.includes('Neue Reise'), false)
    assert.match(datei, /createEinstiegFuerGast|gastReisenPrimaerCta/)
  })

  test('GastArbeitsbereich behauptet bei fehlender Reise keine zweite Create-Reise', () => {
    const datei = quelle('../../components/trips/GastArbeitsbereich.tsx')
    assert.equal(datei.includes('Neue Reise'), false)
    assert.match(datei, /GastCreateLink/)
  })

  test('Homepage-Inspiration bleibt zielspezifischer Handoff, nicht ein dritter Create', () => {
    const start = quelle('../../app/(public)/page.tsx')
    assert.match(start, /zielHref/)
    assert.match(start, /GastCreateLink/)
    assert.equal(start.includes('gastreiseAnlegen'), false)
  })

  test('TW6-B progressive Ziele bleiben auf bestehender OrtSuche und trip_stages', () => {
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    const aktionen = quelle('./aktionen.ts')
    const gast = quelle('./gastspeicher.ts')

    assert.match(planner, /Weiteres Ziel hinzufügen/)
    assert.match(planner, /weitereDestinationPlaceIds/)
    assert.match(planner, /Aufenthalte werden hier nicht festgelegt/)
    assert.equal(planner.includes('onDrag'), false)
    assert.equal(planner.includes('draggable'), false)
    assert.equal(planner.includes('vorschlagErzeugen'), false)
    assert.equal(planner.includes('Staatsbürgerschaft'), false)
    assert.equal(planner.includes('Reisepass'), false)
    assert.match(aktionen, /createZieleGraph/)
    assert.match(aktionen, /weitereZielIds/)
    assert.match(gast, /createZieleGraph/)
    assert.equal(aktionen.includes('ZRH'), false)
  })

  test('D0-Metadata-/robots-/sitemap-Dateien bleiben Create-fremd', () => {
    const planen = quelle('../../app/(public)/planen/page.tsx')
    const robots = quelle('../../app/robots.ts')
    const sitemap = quelle('../../app/sitemap.ts')

    assert.match(planen, /planenRobots/)
    assert.match(planen, /kanonischeUrl\('\/planen'\)/)
    assert.equal(planen.includes('weitereDestinationPlaceIds'), false)
    assert.equal(robots.includes('weitereDestinationPlaceIds'), false)
    assert.equal(sitemap.includes('weitereDestinationPlaceIds'), false)
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

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { kontoReisenSichten } from '@/lib/account/reise-archiv'
import { reisenGruppenAus } from '@/lib/account/reise-lage'
import {
  hubDarstellung,
  kartenRasterKlasse,
  leistenKlasse,
  MEINE_REISEN_GRUPPEN,
  trefferText,
  zaehlungAus,
  type ReiseGruppenZaehlung,
} from '@/lib/trips/my-trips-premium-hub-ux-1'
import type { TripSummary } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const HEUTE = '2026-10-01'

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: 'Zürich',
    startDate: null,
    endDate: null,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'planned',
    updatedAt: '2026-09-01T10:00:00.000Z',
    stages: [{ name: 'Lissabon', position: 1 }],
    stageCount: 1,
    dayCount: 7,
    itemCount: 4,
    ...teil,
  }
}

const po = [
  reise({
    id: 'lissabon',
    title: 'Lissabon',
    startDate: '2026-10-22',
    endDate: '2026-10-29',
  }),
  reise({
    id: 'kyoto',
    title: 'Kyoto',
    origin: 'Genf',
    startDate: '2026-11-18',
    endDate: '2026-11-28',
  }),
]

describe('Premium-Hub folgt der bestehenden Gruppenwahrheit', () => {
  test('PO-Zustand: nur Kommend bekommt Karten, leere Gruppen bleiben im Text', () => {
    const sicht = kontoReisenSichten(po, '', HEUTE)
    const darstellung = hubDarstellung(zaehlungAus(sicht.gruppen), false)
    assert.deepEqual(
      sicht.gruppen.kommend.map((eintrag) => eintrag.id),
      ['lissabon', 'kyoto'],
    )
    assert.equal(sicht.gruppen.aktiv.length, 0)
    assert.equal(sicht.gruppen.vergangen.length, 0)
    assert.equal(sicht.gruppen.ohneDatum.length, 0)
    assert.deepEqual(
      darstellung.leiste.filter((eintrag) => eintrag.karten).map((eintrag) => eintrag.key),
      ['kommend'],
    )
    assert.equal(darstellung.leiste.find((eintrag) => eintrag.key === 'kommend')?.schwerpunkt, true)
    assert.match(darstellung.leertext, /Keine aktive Reise\./)
    assert.match(darstellung.leertext, /Keine vergangene Reise\./)
    assert.match(darstellung.leertext, /Keine Reise ohne Datum\./)
    assert.equal(darstellung.leertext.includes('Keine kommende Reise.'), false)
  })

  test('gemischte Mitgliedschaft bleibt date-only und ohne Archiv in den Gruppen', () => {
    const reisen = [
      ...po,
      reise({
        id: 'porto',
        title: 'Porto',
        startDate: '2026-09-28',
        endDate: '2026-10-04',
        status: 'booked',
      }),
      reise({ id: 'offen', title: 'Offen', origin: null, stages: [], status: 'draft' }),
      reise({
        id: 'rom',
        title: 'Rom',
        startDate: '2026-08-01',
        endDate: '2026-08-08',
      }),
      reise({
        id: 'archiv',
        title: 'Archiv',
        status: 'archived',
        archivePreviousStatus: 'planned',
        startDate: '2026-07-01',
        endDate: '2026-07-08',
      }),
    ]
    const sicht = kontoReisenSichten(reisen, '', HEUTE)
    const gruppen = reisenGruppenAus(
      reisen.filter((eintrag) => eintrag.status !== 'archived'),
      HEUTE,
    )
    assert.deepEqual(
      sicht.gruppen.aktiv.map((eintrag) => eintrag.id),
      gruppen.aktiv.map((eintrag) => eintrag.id),
    )
    assert.deepEqual(sicht.archiv.map((eintrag) => eintrag.id), ['archiv'])
    const darstellung = hubDarstellung(zaehlungAus(sicht.gruppen), false)
    assert.deepEqual(
      darstellung.leiste.filter((eintrag) => eintrag.karten).map((eintrag) => eintrag.key),
      ['aktiv', 'kommend', 'vergangen', 'ohneDatum'],
    )
    assert.equal(darstellung.leiste.some((eintrag) => eintrag.schwerpunkt), false)
    assert.equal(darstellung.leertext, '')
  })

  test('Suche blendet leere Gruppen aus und zählt nur geladene Treffer', () => {
    const sicht = kontoReisenSichten(po, 'Kyoto', HEUTE)
    const darstellung = hubDarstellung(zaehlungAus(sicht.gruppen), true)
    assert.deepEqual(
      sicht.gruppen.kommend.map((eintrag) => eintrag.title),
      ['Kyoto'],
    )
    assert.deepEqual(
      darstellung.leiste.filter((eintrag) => eintrag.sichtbar).map((eintrag) => eintrag.key),
      ['kommend'],
    )
    assert.equal(darstellung.leertext, '')
    assert.equal(trefferText(1), '1 Treffer in den geladenen Reisen.')
    assert.equal(trefferText(2), '2 Treffer in den geladenen Reisen.')
    const keine = kontoReisenSichten(po, 'zzzz', HEUTE)
    assert.equal(zaehlungAus(keine.gruppen).kommend, 0)
  })

  test('zwei Karten teilen sich die Zeile, leere Zähler bleiben ruhig', () => {
    const leer: ReiseGruppenZaehlung = { aktiv: 0, kommend: 2, vergangen: 0, ohneDatum: 0 }
    const darstellung = hubDarstellung(leer, false)
    const kommend = darstellung.leiste[1]
    assert.match(kartenRasterKlasse(2), /sm:grid-cols-2/)
    assert.equal(kartenRasterKlasse(2).includes('xl:grid-cols-3'), false)
    assert.deepEqual(
      MEINE_REISEN_GRUPPEN.map((gruppe) => gruppe.titel),
      ['Aktiv', 'Kommend', 'Vergangen', 'Ohne Datum'],
    )
    assert.match(leistenKlasse(kommend), /bg-brand-800/)
    assert.equal(leistenKlasse(darstellung.leiste[0]).includes('%'), false)
  })
})

describe('Premium-Hub ändert keine Verträge', () => {
  test('Gerätetag, Grenze, Suche und Archiv bleiben am bestehenden Weg', () => {
    const gruppen = quelle('../../components/trips/KontoReisenGruppen.tsx')
    assert.match(gruppen, /useState<string \| null>\(null\)/)
    assert.match(gruppen, /heutigesDatum/)
    assert.match(gruppen, /kontoReisenSichten/)
    assert.match(gruppen, /reisePasstZurSuche/)
    assert.match(gruppen, /REISEN_LISTE_GRENZE/)
    assert.match(gruppen, /Höchstens die/)
    assert.match(gruppen, /Keine Reise passt zur Suche\./)
    assert.equal(gruppen.includes('fetch('), false)
    assert.equal(gruppen.includes('reisenLaden'), false)
    for (const verboten of ['readiness', 'visa', 'provider', '0%', 'Duffel', 'citizenship']) {
      assert.equal(gruppen.toLowerCase().includes(verboten.toLowerCase()), false, verboten)
    }
  })

  test('Archivaktion liegt ausserhalb des Reise-Links', () => {
    const eintrag = quelle('../../components/trips/KontoReiseEintrag.tsx')
    const karte = quelle('../../components/trips/Reisekarte.tsx')
    const aktion = quelle('../../components/trips/KontoReiseArchivAktion.tsx')
    assert.match(eintrag, /<article/)
    assert.match(eintrag, /<Reisekarte/)
    assert.match(eintrag, /<KontoReiseArchivAktion/)
    assert.match(eintrag, /schale/)
    assert.equal(karte.includes('<button'), false)
    assert.equal(karte.includes('KontoReiseArchivAktion'), false)
    assert.match(karte, /Nur auf diesem Gerät/)
    assert.match(aktion, /Archivieren/)
    assert.match(aktion, /Wiederherstellen/)
    assert.match(aktion, /data-reisen-aktion/)
    assert.match(aktion, /min-h-11/)
    assert.match(aktion, /reiseArchivLebenszyklus/)
    assert.equal(aktion.includes('fetch('), false)
    assert.match(aktion, /role="alert"/)
  })

  test('Error und Empty bleiben auf der Kontoseite getrennt', () => {
    const seite = quelle('../../app/(public)/reisen/page.tsx')
    assert.match(seite, /Deine Reisen konnten nicht geladen werden\./)
    assert.match(seite, /Noch keine Reise in deinem Konto\./)
    assert.match(seite, /Neue Reise/)
    assert.match(seite, /href="\/planen"/)
    assert.equal(seite.includes('fetch('), false)
  })
})

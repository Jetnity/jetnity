import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import Organisieren from '@/components/trips/organisieren/Organisieren'
import { organisierenBestand } from '@/lib/trips/organisieren/bestand'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import { modusAusQuery, modusFuerReise, modusUrl } from '@/lib/trips/workspace-mode'
import { itemAuswahl, sucheIstOffen } from '@/lib/trips/detail'
import type { Trip, TripItem } from '@/types/trips'

const SUCHLABEL = {
  fluege: 'Weitere Flüge suchen',
  unterkunft: 'Neue Unterkünfte suchen',
  aktivitaeten: 'Weitere Aktivitäten entdecken',
  mietwagen: 'Mietwagenangebote suchen',
  verbindungen: 'Weitere Verbindungen suchen',
} as const

const KATEGORIEN = [
  ['fluege', 'flight', 'Flug Phuket'],
  ['unterkunft', 'stay', 'Unterkunft Phuket'],
  ['aktivitaeten', 'activity', 'Aktivität Phuket'],
  ['mietwagen', 'rental_car', 'Mietwagen Phuket'],
  ['verbindungen', 'transfer', 'Verbindung Phuket'],
] as const

function probe(): Trip {
  const reise = n12Reise()
  reise.id = 'synthetische-phuket-reise'
  reise.title = 'Synthetische Phuket-Reise'
  reise.days.forEach(tag => { tag.items = [] })
  reise.ohneTag = []
  const tag = reise.days[0]!
  let position = 0
  const punkt = (id: string, kind: TripItem['kind'], title: string): TripItem =>
    n12Punkt({ id, kind, title, position: ++position, dayId: tag.id, startsOn: tag.dayDate,
      startsAt: '10:00', endsOn: tag.dayDate, endsAt: '11:00' })
  tag.items = [
    punkt('flug-hin', 'flight', 'Flug Phuket 1'),
    punkt('flug-weiter', 'flight', 'Flug Phuket 2'),
    punkt('flug-rueck', 'flight', 'Flug Phuket 3'),
    ...KATEGORIEN.slice(1).map(([k, kind, title]) => punkt('eintrag-' + k, kind, title)),
  ]
  return reise
}

test('five Organisieren categories show only this trip inventory first, no legacy generic search on entry', () => {
  const reise = probe()
  const before = structuredClone(reise)
  for (const [kategorie, , titel] of KATEGORIEN) {
    const eintraege = organisierenBestand(reise, reise.ohneTag, kategorie)
    assert.equal(eintraege.length, kategorie === 'fluege' ? 3 : 1)
    assert.ok(eintraege.every(item => item.titel.includes(titel)))
    const html = renderToStaticMarkup(createElement(Organisieren, {
      reise, tab: kategorie, kategorieWaehlen: () => {}, ohneTag: reise.ohneTag,
      onItem: () => {},
    }))
    assert.match(html, new RegExp('data-organisieren-bestand="' + kategorie + '"'))
    assert.match(html, new RegExp('data-organisieren-suche-toggle="' + kategorie + '"'))
    assert.match(html, new RegExp('data-organisieren-suche="' + kategorie + '"[^>]*hidden=""'))
    assert.match(html, new RegExp('data-suchbereich="' + kategorie + '"'))
    assert.match(html, /class="org-bestand-zeile"/)
    assert.ok(html.includes(eintraege[0]!.titel), kategorie + ': saved row title missing')
    assert.match(html, new RegExp(titel))
    assert.doesNotMatch(html, /Der passende Flug für deine Reise|Flüge mit KAYAK entdecken|KAYAK-Testdaten|Finde deine Unterkunft|<h2>Aktivitäten entdecken<\/h2>|Booking\.com suchen/)
    assert.doesNotMatch(html, /href="(?:\/fluege|\/hotels|\/mietwagen|\/aktivitaeten|\/suche)/)
    assert.ok(html.includes(SUCHLABEL[kategorie]), kategorie + ': explicit search action missing')
  }
  assert.deepEqual(reise, before, 'reading categories cannot mutate trip contents')
})

test('every saved row opens its original item inside the same trip, never a generic search route', () => {
  const reise = probe()
  for (const [kategorie, kind] of KATEGORIEN) {
    const mode = { ansicht: 'organisieren' as const, bereich: null,
      kategorie, urlAnpassen: false }
    const pathname = '/reisen/' + reise.id
    const url = modusUrl(pathname, mode)
    assert.equal(url, pathname + '?ansicht=organisieren&kategorie=' + kategorie)
    assert.equal(modusAusQuery(new URLSearchParams(url.split('?')[1])).kategorie, kategorie)
    for (const eintrag of organisierenBestand(reise, reise.ohneTag, kategorie)) {
      assert.equal(reise.days.flatMap(t => t.items).find(p => p.id === eintrag.id)?.kind, kind)
      const detailUrl = modusUrl(pathname, { ansicht: 'plan', bereich: null, itemId: eintrag.id })
      assert.equal(new URL(detailUrl, 'https://jetnity.com').pathname, pathname)
      assert.equal(modusFuerReise(modusAusQuery(new URLSearchParams(detailUrl.split('?')[1])), reise, reise.ohneTag).itemId, eintrag.id)
      assert.equal(sucheIstOffen(itemAuswahl(eintrag.id)), false)
      assert.equal(detailUrl.includes('kategorie='), false)
    }
  }
  const inventar = readFileSync('components/trips/organisieren/OrganisierenBestand.tsx', 'utf8')
  const page = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
  assert.match(inventar, /onClick=\{\(\) => onItem\(eintrag\.id\)\}/)
  assert.match(page, /onItem=\{oeffneItem\}/)
  assert.match(page, /ansicht: 'plan' as const, bereich: null, itemId/)
})

test('no-inventory category has a clear same-trip empty state, search remains explicit', () => {
  const reise = probe()
  for (const tag of reise.days) tag.items = []
  for (const [kategorie] of KATEGORIEN) {
    const html = renderToStaticMarkup(createElement(Organisieren, {
      reise, tab: kategorie, kategorieWaehlen: () => {}, onItem: () => {},
    }))
    assert.match(html, /Noch keine|Noch kein/)
    assert.match(html, new RegExp('data-organisieren-bestand="' + kategorie + '"'))
    assert.match(html, new RegExp('data-organisieren-suche="' + kategorie + '"[^>]*hidden=""'))
    assert.doesNotMatch(html, /Der passende Flug für deine Reise|KAYAK-Testdaten/)
  }
})

test('presentation gates use neutral #1264 tokens and do not branch on the device', () => {
  const code = readFileSync('components/trips/organisieren/Organisieren.tsx', 'utf8')
  const css = readFileSync('components/trips/organisieren/organisieren.css', 'utf8')
  assert.match(code, /data-organisieren-suche-toggle=\{t\.key\}/)
  assert.match(code, /sucheBesucht\.includes\(t\.key\)/)
  assert.match(code, /hidden=\{!sucheOffen\[t\.key\]\}/)
  assert.match(code, /kategorieSprung\.current = !tastatur/)
  assert.match(code, /border-border bg-card/)
  assert.match(code, /focus-visible:ring-2 focus-visible:ring-ring/)
  assert.doesNotMatch(code, /userAgent|navigator\.platform|window\.innerWidth/)
  assert.match(css, /@media \(max-width: 700px\)/)
  assert.match(css, /\[data-workspace-theme='dark'\] \.org-workspace/)
  // Actual geometry, contrast and Safari taps at 320/390/1280 in light/dark
  // are browser acceptance gates, never claimed as proven by a source test.
})

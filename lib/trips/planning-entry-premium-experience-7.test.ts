import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { scrollVerhalten } from '@/lib/formular/sicht'
import {
  PLANEN_IDEE_ZIEL_ID,
  PLANEN_MANUELL_ZIEL_ID,
  planenIdeeZielAnsteuern,
} from '@/components/trips/PlanenEinstiegNavigation'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

function zwischen(text: string, start: string, ende: string) {
  const von = text.indexOf(start)
  const bis = text.indexOf(ende, von + start.length)
  assert.ok(von >= 0, start)
  assert.ok(bis > von, ende)
  return text.slice(von, bis)
}

describe('Planning Entry premium experience 7 – Wegnavigation', () => {
  test('Ideenziel fokussiert zuerst und scrollt danach, ohne den Hash zu wiederholen', () => {
    const aufrufe: unknown[] = []
    const ziel = {
      focus(options?: FocusOptions) {
        aufrufe.push(['focus', options])
      },
      scrollIntoView(init?: ScrollIntoViewOptions) {
        aufrufe.push(['scroll', init])
      },
    }
    const history = {
      location: { hash: '' },
      replaceState(_data: unknown, _unused: string, url?: string | URL | null) {
        aufrufe.push(['hash', url])
        this.location.hash = String(url)
      },
    }

    assert.equal(planenIdeeZielAnsteuern(ziel, history), true)
    assert.deepEqual(aufrufe, [
      ['focus', { preventScroll: true }],
      ['scroll', { block: 'start', inline: 'nearest', behavior: scrollVerhalten() }],
      ['hash', `#${PLANEN_IDEE_ZIEL_ID}`],
    ])
    assert.equal(planenIdeeZielAnsteuern(ziel, history), true)
    assert.equal(aufrufe.filter((eintrag) => Array.isArray(eintrag) && eintrag[0] === 'hash').length, 1)
  })

  test('ohne Ziel geschieht nichts', () => {
    assert.equal(planenIdeeZielAnsteuern(null), false)
    assert.equal(planenIdeeZielAnsteuern(undefined), false)
  })

  test('beide Wege bleiben sichtbar und lösen keinen Modell- oder Speichervertrag aus', () => {
    const helfer = quelle('../../components/trips/PlanenEinstiegNavigation.tsx')
    const page = quelle('../../app/(public)/planen/page.tsx')
    assert.match(helfer, /In eigenen Worten/)
    assert.match(helfer, /Schritt für Schritt planen/)
    assert.match(helfer, /href=\{`#\$\{PLANEN_IDEE_ZIEL_ID\}`\}/)
    assert.match(helfer, /href=\{`#\$\{PLANEN_MANUELL_ZIEL_ID\}`\}/)
    assert.match(helfer, /scrollVerhalten/)
    assert.equal(helfer.includes('vorschlagErzeugen'), false)
    assert.equal(helfer.includes('reiseAnlegen'), false)
    assert.equal(helfer.includes('gastreiseAnlegen'), false)
    assert.equal(helfer.includes('gastreiseAblegen'), false)
    assert.equal(helfer.includes('fetch('), false)
    assert.equal(helfer.includes('onSubmit'), false)
    assert.equal(helfer.includes('localStorage'), false)
    assert.equal(page.includes('localStorage'), false)
    assert.equal(page.includes('vorschlagErzeugen'), false)
    assert.match(page, /<PlanenIdeeZiel>/)
    assert.match(page, /<PlanenIdeeZeiger/)
    assert.ok(page.indexOf('<PlanenManuellZeiger') < page.indexOf('<Reiseidee'))
    assert.ok(page.indexOf('<Reiseidee') < page.indexOf('<PlanenManuellZiel>'))
    assert.equal(PLANEN_MANUELL_ZIEL_ID, 'manuell-planen')
    assert.equal(PLANEN_IDEE_ZIEL_ID, 'reise-beschreiben')
  })
})

describe('Planning Entry premium experience 7 – Darstellung ohne Vertragsänderung', () => {
  test('manuelle Felder bleiben vollständig und sind in vier Gruppen geordnet', () => {
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    const route = zwischen(planner, 'Route & Ziele', 'Zeitraum')
    const zeit = zwischen(planner, 'Zeitraum', 'Reisende & Budget')
    const leute = zwischen(planner, 'Reisende & Budget', 'Wünsche')
    const wuensche = planner.slice(planner.indexOf('Wünsche'))

    assert.match(route, /Reiseziel/)
    assert.match(route, /Abreise ab/)
    assert.match(route, /Weiteres Ziel hinzufügen/)
    assert.match(route, /Aufenthalte werden hier nicht festgelegt/)
    assert.match(route, /ziel-reihenfolge-1-runter/)
    assert.match(route, /ziel-reihenfolge-2-hoch/)
    assert.match(zeit, /feld-start/)
    assert.match(zeit, /feld-ende/)
    assert.match(leute, /feld-reisende/)
    assert.match(leute, /feld-budget/)
    assert.match(wuensche, /Was ist dir bei dieser Reise besonders wichtig\?/)
    assert.match(planner, /Reise erstellen/)
    assert.equal(planner.includes('vorschlagErzeugen'), false)
    assert.equal(planner.includes('Sparkles'), false)
    assert.equal(planner.includes('onDrag'), false)
    assert.equal(planner.includes('draggable'), false)
  })

  test('Telefon und Tablet bleiben kompakt, der Desktop-Hinweis klebt begrenzt', () => {
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    assert.match(planner, /xl:hidden/)
    assert.match(planner, /hidden h-fit/)
    assert.match(planner, /xl:sticky/)
    assert.match(planner, /xl:max-h-\[calc\(100dvh-var\(--jet-header-h\)-env\(safe-area-inset-top\)-2rem\)\]/)
    assert.equal(
      (planner.match(/Dieses Formular funktioniert ohne die intelligente Planung\. Beide Wege führen zur gleichen Reise\./g) || [])
        .length,
      2,
    )
    assert.equal(planner.includes('lg:grid-cols-[minmax(0,1fr)_340px]'), false)
    assert.equal(planner.includes('lg:sticky'), false)
  })

  test('freie Beschreibung bleibt der ausdrückliche Entwurfsweg', () => {
    const idee = quelle('../../components/trips/Reiseidee.tsx')
    assert.match(idee, /Entwurf erstellen/)
    assert.match(idee, /Der Entwurf wird dir zuerst gezeigt\. Gespeichert wird nichts ohne deine Freigabe\./)
    assert.match(idee, /Kurzbeispiele\. Sie füllen nur das Feld und starten keine Planung\./)
    assert.match(idee, /type="button"/)
    assert.match(idee, /onSubmit=\{erzeugen\}/)
    assert.match(idee, /maxLength=\{VORSCHLAG_GRENZEN\.freitextMaximum\}/)
    assert.match(idee, /<VorschlagVorschau/)
    assert.equal(idee.includes('localStorage.'), false)
    assert.equal(idee.includes('window.localStorage'), false)
  })

  test('Metadata, Canonical und Robots bleiben am Seitenvertrag', () => {
    const page = quelle('../../app/(public)/planen/page.tsx')
    assert.match(page, /planenRobots/)
    assert.match(page, /kanonischeUrl\('\/planen'\)/)
    assert.match(page, /title: 'Reise planen'/)
    assert.match(page, /description: 'Erstelle deine Reise mit Jetnity\.'/)
    assert.equal(page.includes('canonical: kanonischeUrl(`/planen?'), false)
  })
})

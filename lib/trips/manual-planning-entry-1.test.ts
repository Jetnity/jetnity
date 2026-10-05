import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { scrollVerhalten } from '@/lib/formular/sicht'
import {
  PLANEN_MANUELL_ZIEL_ID,
  planenManuellZielAnsteuern,
} from '@/components/trips/PlanenEinstiegNavigation'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('Manual Planning Entry 1 – Zielansteuerung', () => {
  test('fokussiert zuerst und scrollt danach, ohne den Fokus nachzuziehen', () => {
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

    assert.equal(planenManuellZielAnsteuern(ziel, history), true)
    assert.deepEqual(aufrufe, [
      ['focus', { preventScroll: true }],
      ['scroll', { block: 'start', inline: 'nearest', behavior: scrollVerhalten() }],
      ['hash', `#${PLANEN_MANUELL_ZIEL_ID}`],
    ])
  })

  test('schreibt den Hash nicht erneut, wenn er schon stimmt', () => {
    const aufrufe: unknown[] = []
    const ziel = {
      focus() {
        aufrufe.push('focus')
      },
      scrollIntoView() {
        aufrufe.push('scroll')
      },
    }
    const history = {
      location: { hash: `#${PLANEN_MANUELL_ZIEL_ID}` },
      replaceState() {
        aufrufe.push('hash')
      },
    }

    assert.equal(planenManuellZielAnsteuern(ziel, history), true)
    assert.deepEqual(aufrufe, ['focus', 'scroll'])
  })

  test('ohne Ziel geschieht nichts', () => {
    assert.equal(planenManuellZielAnsteuern(null), false)
    assert.equal(planenManuellZielAnsteuern(undefined), false)
  })
})

describe('Manual Planning Entry 1 – Composition', () => {
  test('Zeiger und Ziel liegen innerhalb des Create-Gates, Idee bleibt zuerst', () => {
    const page = quelle('../../app/(public)/planen/page.tsx')
    const gate = page.indexOf('<PlanenCreateGate')
    const zeiger = page.indexOf('<PlanenManuellZeiger')
    const idee = page.indexOf('<Reiseidee')
    const ziel = page.indexOf('<PlanenManuellZiel>')
    const planner = page.indexOf('<TripPlanner')
    const gateEnde = page.lastIndexOf('</PlanenCreateGate>')

    assert.ok(gate >= 0)
    assert.ok(zeiger > gate)
    assert.ok(idee > zeiger)
    assert.ok(ziel > idee)
    assert.ok(planner > ziel)
    assert.ok(gateEnde > planner)
    assert.match(page, /auth\.getUser\(\)/)
    assert.match(page, /planenVorbelegung/)
    assert.match(page, /planenRobots/)
  })

  test('Navigationshelfer besitzt keinen Submit- oder Netzvertrag', () => {
    const helfer = quelle('../../components/trips/PlanenEinstiegNavigation.tsx')
    assert.equal(helfer.includes('vorschlagErzeugen'), false)
    assert.equal(helfer.includes('reiseAnlegen'), false)
    assert.equal(helfer.includes('gastreiseAnlegen'), false)
    assert.equal(helfer.includes('gastreiseAblegen'), false)
    assert.equal(helfer.includes('fetch('), false)
    assert.equal(helfer.includes('onSubmit'), false)
    assert.equal(helfer.includes('localStorage'), false)
    assert.match(helfer, /scrollVerhalten/)
    assert.match(helfer, /href=\{`#\$\{PLANEN_MANUELL_ZIEL_ID\}`\}/)
  })
})

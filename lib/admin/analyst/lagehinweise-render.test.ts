import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { AdminLagehinweiseAnsicht } from '@/components/admin/home/AdminLagehinweise'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { beobachtungsstand, leiteSystemHealthInsights } from './system-health-insights'
import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  infomaniakNichtKonfiguriert,
  vercelNichtKonfiguriert,
} from '@/lib/admin/system-health/bewertung'
import type { AnalystBericht } from './typen'

const JETZT = Date.parse('2026-09-21T12:00:00.000Z')

function synthetischUnavailable(): AnalystBericht {
  return leiteSystemHealthInsights({
    access: { status: 'allowed', grant: 'role' },
    nowMs: JETZT,
    bericht: {
      checkedAt: new Date(JETZT).toISOString(),
      writeActions: [],
      items: [
        bewerteApp({ vercelEnv: 'preview', commitSha: 'a', deploymentId: 'd', region: 'fra1' }, JETZT),
        vercelNichtKonfiguriert(JETZT),
        bewerteSupabaseAppZugriff({
          configured: true,
          ping: { ok: false, message: 'synthetic timeout' },
          nowMs: JETZT,
        }),
        githubNichtKonfiguriert(JETZT),
        infomaniakNichtKonfiguriert(JETZT),
      ],
    },
  })
}

function htmlAus(bericht: AnalystBericht): string {
  return renderToStaticMarkup(createElement(AdminLagehinweiseAnsicht, { bericht }))
}

describe('AdminLagehinweise Ansicht (synthetic render)', () => {
  test('T-a11y-structure: Abschnitt, Liste und Links tragen Status plus Frische', () => {
    const html = htmlAus(synthetischUnavailable())
    assert.match(html, /<h2[^>]*>Aktuelle Hinweise<\/h2>/)
    assert.match(html, /<ul/)
    assert.match(html, /aria-label="System Health öffnen:/)
    assert.match(html, /Nicht erreichbar/)
    assert.match(html, /frisch|veraltet|Alter unbekannt/)
    assert.doesNotMatch(html, /Ask Copilot|Copilot Pro ist live|Copilot-Execute verfügbar/)
    assert.doesNotMatch(html, /dangerouslySetInnerHTML/)
  })

  test('T-keyboard: Untersuchungslink ist ein echtes href-Ziel', () => {
    const html = htmlAus(synthetischUnavailable())
    assert.match(html, /<a href="\/admin\/system-health"/)
    assert.doesNotMatch(html, /pointer-events-none/)
    assert.doesNotMatch(html, /onClick=\{/)
  })

  test('T-no-focus-steal: kein autoFocus', () => {
    const html = htmlAus(synthetischUnavailable())
    assert.doesNotMatch(html, /autoFocus|autofocus/)
    const quelle = readFileSync(join(process.cwd(), 'components/admin/home/AdminLagehinweise.tsx'), 'utf8')
    assert.doesNotMatch(quelle, /autoFocus/)
  })

  test('T-viewport: Stack/Grid ohne fixe Clip-Breite', () => {
    const quelle = readFileSync(join(process.cwd(), 'components/admin/home/AdminLagehinweise.tsx'), 'utf8')
    assert.match(quelle, /grid/)
    assert.match(quelle, /min-w-0/)
    assert.match(quelle, /w-full/)
    assert.doesNotMatch(quelle, /w-\[\d+px\]/)
    assert.doesNotMatch(quelle, /min-w-\[\d{3,}px\]/)
    const html = htmlAus(synthetischUnavailable())
    assert.doesNotMatch(html, /width:\s*\d{3,}px/)
  })

  test('IA-R2: stale 90s zeigt time und Alter, unknown ohne dateTime', () => {
    const ursprung = new Date(JETZT - 90_000).toISOString()
    const stale = leiteSystemHealthInsights({
      access: { status: 'allowed', grant: 'role' },
      nowMs: JETZT,
      bericht: {
        checkedAt: new Date(JETZT).toISOString(),
        writeActions: [],
        items: [
          bewerteApp({ vercelEnv: 'preview', commitSha: 'a', deploymentId: 'd', region: 'fra1' }, JETZT),
          vercelNichtKonfiguriert(JETZT),
          {
            ...bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: JETZT - 90_000 }),
            checkedAt: ursprung,
          },
          githubNichtKonfiguriert(JETZT),
          infomaniakNichtKonfiguriert(JETZT),
        ],
      },
    })
    const html = htmlAus(stale)
    assert.match(html, /<time dateTime="/i)
    assert.match(html, /90 Sekunden/)
    assert.match(html, /Beobachtet:/)
    const stand = beobachtungsstand(stale.insights[0]!)
    assert.equal(stand.dateTime, ursprung)
    assert.match(stand.zeittext, /UTC/)
    assert.match(html, /UTC/)
    assert.equal(html.includes('renderContainsOriginalTimestamp=false'), false)

    const noSignalMs = JETZT - 30_000
    const noSignalZeit = new Date(noSignalMs).toISOString()
    const noSignal = leiteSystemHealthInsights({
      access: { status: 'allowed', grant: 'role' },
      nowMs: JETZT,
      bericht: {
        checkedAt: new Date(JETZT).toISOString(),
        writeActions: [],
        items: [
          bewerteApp({ vercelEnv: 'preview', commitSha: 'a', deploymentId: 'd', region: 'fra1' }, JETZT),
          vercelNichtKonfiguriert(JETZT),
          {
            ...bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: noSignalMs }),
            checkedAt: noSignalZeit,
          },
          githubNichtKonfiguriert(JETZT),
          infomaniakNichtKonfiguriert(JETZT),
        ],
      },
    })
    assert.equal(noSignal.insights.length, 1)
    const noSignalInsight = noSignal.insights[0]!
    assert.equal(noSignalInsight.title, ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseKeinSignalTitel)
    assert.equal(noSignalInsight.checkedAt, noSignalZeit)
    assert.equal(noSignalInsight.freshness.ageMs, 30_000)
    const noSignalHtml = htmlAus(noSignal)
    const noSignalStand = beobachtungsstand(noSignalInsight)
    assert.equal(noSignalStand.dateTime, noSignalZeit)
    assert.match(noSignalStand.zeittext, /UTC/)
    assert.match(noSignalHtml, /<time dateTime="2026-09-21T11:59:30.000Z"/)
    assert.match(noSignalHtml, /30 Sekunden/)
    assert.match(noSignalHtml, /UTC/)
    assert.doesNotMatch(noSignalHtml, /12:00:00/)

    const unbekannt = leiteSystemHealthInsights({
      access: { status: 'allowed', grant: 'role' },
      nowMs: JETZT,
      bericht: {
        checkedAt: 'kein-datum',
        writeActions: [],
        items: [
          { ...bewerteApp({ vercelEnv: null, commitSha: null, deploymentId: null, region: null }, JETZT), checkedAt: '' },
          { ...vercelNichtKonfiguriert(JETZT), checkedAt: '' },
          { ...bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: JETZT }), checkedAt: 'kein-datum' },
          { ...githubNichtKonfiguriert(JETZT), checkedAt: '' },
          { ...infomaniakNichtKonfiguriert(JETZT), checkedAt: '' },
        ],
      },
    })
    const unknownHtml = htmlAus(unbekannt)
    assert.match(unknownHtml, /Prüfzeitpunkt unbekannt/)
    assert.match(unknownHtml, /Alter unbekannt/)
    assert.doesNotMatch(unknownHtml, /<time dateTime="kein-datum"/)
    assert.doesNotMatch(unknownHtml, /höchstens 30s|at most 30s old/)
  })

  test('Denied rendert keine Coverage-Zeile und keinen Investigate-Link', () => {
    const bericht = leiteSystemHealthInsights({
      access: { status: 'denied', denial: 'forbidden' },
      nowMs: JETZT,
    })
    const html = htmlAus(bericht)
    assert.doesNotMatch(html, /data-analyst-coverage/)
    assert.doesNotMatch(html, /System Health öffnen/)
    assert.match(html, /System Health nicht gelesen/)
    assert.match(html, new RegExp(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseOhnePruefung))
  })
})

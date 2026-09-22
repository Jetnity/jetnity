import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { AdminModellnutzungHinweisAnsicht } from '@/components/admin/home/AdminModellnutzungHinweis'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { leiteModelUsageInsights, modelUsageBeobachtungsstand } from './model-usage-insights'
import type { ModelUsageBericht } from './model-usage-typen'
import type { ProviderOpsBoardBericht, ProviderOpsBoardItem, ProviderOpsBoardStatus } from '@/lib/admin/provider-ops-board/typen'

const JETZT = Date.parse('2026-09-22T12:00:00.000Z')

function item(status: ProviderOpsBoardStatus, checkedAt = new Date(JETZT).toISOString()): ProviderOpsBoardItem {
  return {
    id: 'model-usage',
    name: 'Modellnutzung',
    status,
    source: 'public.model_usage',
    checkedAt,
    freshness: { state: 'fresh', ageMs: 0, ttlMs: 120_000 },
    summary: '<script>steal()</script> RAW 0 USD',
    detail: 'backend boom admin@jetnity.test',
    proves: 'in dieser Sitzung',
    doesNotProve: 'victim@example.com',
    metadata: { kostenMikroUsd: '9', juengsteCreatedAt: '2026-09-22T11:59:59.000Z' },
  }
}

function board(status: ProviderOpsBoardStatus, checkedAt = new Date(JETZT).toISOString()): ProviderOpsBoardBericht {
  return { checkedAt: new Date(JETZT).toISOString(), writeActions: [], items: [item(status, checkedAt)] }
}

function htmlAus(bericht: ModelUsageBericht): string {
  return renderToStaticMarkup(createElement(AdminModellnutzungHinweisAnsicht, { bericht }))
}

describe('AdminModellnutzungHinweis Ansicht (synthetic render)', () => {
  test('T-a11y-structure: Abschnitt, Liste und Status plus Frische', () => {
    const bericht = leiteModelUsageInsights({
      access: { status: 'allowed', grant: 'role' },
      nowMs: JETZT,
      board: board('unavailable'),
    })
    const html = htmlAus(bericht)
    assert.match(html, /<h2[^>]*>Modellnutzung<\/h2>/)
    assert.match(html, /<ul/)
    assert.match(html, /aria-label="Provider &amp; Kosten öffnen:/)
    assert.match(html, /Nicht erreichbar/)
    assert.match(html, /frisch|veraltet|Alter unbekannt/)
    assert.doesNotMatch(html, /Ask Copilot|Copilot Pro ist live|Copilot-Execute verfügbar/)
    assert.doesNotMatch(html, /dangerouslySetInnerHTML/)
    assert.doesNotMatch(html, /<script|admin@jetnity\.test|kostenMikroUsd|0 USD/)
  })

  test('T-keyboard: Untersuchungslink ist ein echtes href-Ziel', () => {
    const html = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'role' },
        nowMs: JETZT,
        board: board('empty'),
      }),
    )
    assert.match(html, /<a href="\/admin\/provider-ops"/)
    assert.doesNotMatch(html, /pointer-events-none/)
    assert.doesNotMatch(html, /onClick=\{/)
    assert.doesNotMatch(html, /href="[^"]*\$\{/)
  })

  test('T-no-focus-steal: kein autoFocus', () => {
    const html = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'role' },
        nowMs: JETZT,
        board: board('available'),
      }),
    )
    assert.doesNotMatch(html, /autoFocus|autofocus/)
    const quelle = readFileSync(join(process.cwd(), 'components/admin/home/AdminModellnutzungHinweis.tsx'), 'utf8')
    assert.doesNotMatch(quelle, /autoFocus/)
    assert.match(quelle, /focus-visible:outline/)
  })

  test('T-viewport: Stack/Grid ohne fixe Clip-Breite', () => {
    const quelle = readFileSync(join(process.cwd(), 'components/admin/home/AdminModellnutzungHinweis.tsx'), 'utf8')
    assert.match(quelle, /grid/)
    assert.match(quelle, /min-w-0/)
    assert.match(quelle, /w-full/)
    assert.doesNotMatch(quelle, /w-\[\d+px\]/)
    assert.doesNotMatch(quelle, /min-w-\[\d{3,}px\]/)
    const html = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'role' },
        nowMs: JETZT,
        board: board('unknown'),
      }),
    )
    assert.doesNotMatch(html, /width:\s*\d{3,}px/)
  })

  test('empty, unavailable und stale bleiben im Markup unterscheidbar', () => {
    const empty = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'role' },
        nowMs: JETZT,
        board: board('empty'),
      }),
    )
    const unavailable = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'role' },
        nowMs: JETZT,
        board: board('unavailable'),
      }),
    )
    const stale = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'role' },
        nowMs: JETZT,
        board: board('available', new Date(JETZT - 180_000).toISOString()),
      }),
    )
    assert.match(empty, /data-model-usage-observed="empty"/)
    assert.match(empty, /Keine Einträge/)
    assert.match(empty, /kein Beleg für null Ausgaben/)
    assert.match(unavailable, /data-model-usage-observed="unavailable"/)
    assert.match(unavailable, /Nicht erreichbar/)
    assert.match(unavailable, /kein leeres Kostenprotokoll/)
    assert.match(stale, /data-model-usage-freshness="stale"/)
    assert.match(stale, /Stand ist veraltet/)
    assert.notEqual(empty.includes('Nicht erreichbar'), true)
    assert.notEqual(unavailable.includes('Keine Einträge'), true)
  })

  test('stale zeigt originale time/UTC-Alter; unknown ohne dateTime', () => {
    const ursprung = new Date(JETZT - 180_000).toISOString()
    const bericht = leiteModelUsageInsights({
      access: { status: 'allowed', grant: 'role' },
      nowMs: JETZT,
      board: board('empty', ursprung),
    })
    const html = htmlAus(bericht)
    const stand = modelUsageBeobachtungsstand(bericht.insights[0]!)
    assert.equal(stand.dateTime, ursprung)
    assert.match(stand.zeittext, /UTC/)
    assert.match(html, /<time dateTime="2026-09-22T11:57:00.000Z"/)
    assert.match(html, /180 Sekunden|3 Minuten/)
    assert.match(html, /UTC/)

    const unbekannt = leiteModelUsageInsights({
      access: { status: 'allowed', grant: 'role' },
      nowMs: JETZT,
      board: board('available', 'kein-datum'),
    })
    const unknownHtml = htmlAus(unbekannt)
    assert.match(unknownHtml, /Prüfzeitpunkt unbekannt/)
    assert.match(unknownHtml, /Alter unbekannt/)
    assert.doesNotMatch(unknownHtml, /<time dateTime="kein-datum"/)
  })

  test('Denied und Break-Glass rendern keine Coverage-Zeile und keinen Investigate-Link', () => {
    const denied = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'denied', denial: 'forbidden' },
        nowMs: JETZT,
      }),
    )
    assert.doesNotMatch(denied, /data-model-usage-coverage/)
    assert.doesNotMatch(denied, /Provider &amp; Kosten öffnen/)
    assert.match(denied, /Modellnutzung nicht gelesen/)
    assert.match(denied, new RegExp(ADMIN_EHRLICHE_TEXTE.modellnutzungOhnePruefung))

    const glas = htmlAus(
      leiteModelUsageInsights({
        access: { status: 'allowed', grant: 'break-glass' },
        nowMs: JETZT,
        board: board('available'),
      }),
    )
    assert.doesNotMatch(glas, /data-model-usage-coverage/)
    assert.doesNotMatch(glas, /Provider &amp; Kosten öffnen/)
    assert.match(glas, /nicht zugeschrieben/)
    assert.doesNotMatch(glas, /data-model-usage-observed="available"/)
  })
})

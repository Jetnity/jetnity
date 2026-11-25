import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AtVisitorPreview from '@/components/readiness/AtVisitorPreview'
import { einreisePrueferSicht } from '../einreise-laenderpruefer'
import { capAtProductionDisplayLease, resolveAtApprovedVisitorCopy, type AtApprovedVisitorCopy } from './at-visitor-release'
import { eligibleAustriaProductionVisitor } from './at-production-selection'
import { HUMAN_METHOD_PRODUCTION_URL, HUMAN_METHOD_DEV_URL } from '../official-truth-product-v3/method/human-contract'
import { presentAtVisaReadbacks } from './at-visitor-display'
import { AT_VISITOR_INFORMATION_LINKS } from './at-visitor-links'
import type { V3VisitorInput } from '../official-truth-product-v3/contract'

const copy: AtApprovedVisitorCopy = { approvalReference: 'SYNTHETIC', scope: 'Test-Geltungsbereich', officialLinks: 'Test-Quellen', fraudWarning: 'Test-Warnung', liability: 'Test-Hinweis' }
const input: V3VisitorInput = { destinationCountryCode: 'AT', citizenshipCountryCodes: ['CH', 'IN'] }
const now = new Date('2026-11-25T12:00:00.000Z')
const raw = {
  status: 'accepted', citizenshipCountryCode: 'CH', destinationCountryCode: 'AT', documentType: 'passport',
  visaEffect: 'not_required', visaMode: 'visa_exempt', ruleVersion: 83,
  sourceCheckedAt: '2026-11-25T11:50:00.000Z', verifiedAt: '2026-11-25T11:55:00.000Z', expiresAt: '2026-11-25T12:55:00.000Z',
  sourceUrls: AT_VISITOR_INFORMATION_LINKS.map(x => x.receiptHref),
}

test('Production presentation needs the existing exact flag AND separate approved legal copy; flag rollback denies it', () => {
  const ctx = { deploymentEnv: 'production', projectId: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM', repoOwner: 'Jetnity', repoSlug: 'jetnity', branch: 'main', supabaseUrl: HUMAN_METHOD_PRODUCTION_URL, ownerRelease: 'enabled' }
  assert.equal(resolveAtApprovedVisitorCopy(eligibleAustriaProductionVisitor(ctx), copy), copy)
  assert.equal(resolveAtApprovedVisitorCopy(true, null), null)
  assert.equal(resolveAtApprovedVisitorCopy(true, { ...copy, liability: ' ' }), null)
  for (const change of [{ ownerRelease: 'disabled' }, { ownerRelease: undefined }, { deploymentEnv: 'preview' }, { branch: 'other' }, { supabaseUrl: HUMAN_METHOD_DEV_URL }]) {
    assert.equal(resolveAtApprovedVisitorCopy(eligibleAustriaProductionVisitor({ ...ctx, ...change }), copy), null)
  }
  const server = readFileSync(new URL('./at-visitor-release-server.ts', import.meta.url), 'utf8')
  const route = readFileSync(new URL('../../../app/api/readiness/at-visa/route.ts', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../../../app/(public)/einreise/page.tsx', import.meta.url), 'utf8')
  assert.match(server, /const APPROVED_COPY: AtApprovedVisitorCopy \| null = null/)
  assert.match(route, /if\(!dev&&!selectedAtVisitorProductionPresentation\(\)\)return reply\(200,empty\)/)
  assert.match(route, /presentAtVisaReadbacks\(input,readbacks,new Date\(\),!dev\)/)
  assert.match(page, /atApprovedCopy=\{selectedAtVisitorProductionPresentation\(\)\}/)
})

test('Production refuses legacy or expired facts, wrong passports and absent source authority', () => {
  const accepted = { ...raw, sourceAuthorityVersion: 3 }
  for (const bad of [raw, { ...accepted, sourceAuthorityVersion: 2 }, { ...accepted, expiresAt: now.toISOString() }, { ...accepted, citizenshipCountryCode: 'IN' }, { ...accepted, sourceUrls: ['https://untrusted.invalid'] }]) {
    const view = presentAtVisaReadbacks(input, [{ country: 'CH', data: bad }], now, true)
    assert.ok(view.cells.every(cell => cell.results.every(result => result.status === 'unavailable')))
  }
  const positive = presentAtVisaReadbacks(input, [{ country: 'CH', data: accepted }], now, true)
  assert.equal(positive.cells[0]?.results[0]?.status, 'accepted')
  assert.equal(positive.cells[1]?.results[0]?.status, 'unavailable')
  const leased = capAtProductionDisplayLease(positive)
  const result = leased.cells[0]?.results[0]
  assert.equal(result?.status, 'accepted')
  if (result?.status !== 'accepted') assert.fail('expected synthetic positive')
  assert.equal(result.expiresAt, '2026-11-25T12:01:00.000Z')
  const short = capAtProductionDisplayLease(presentAtVisaReadbacks(input, [{ country: 'CH', data: { ...accepted, expiresAt: '2026-11-25T12:00:10.000Z' } }], now, true))
  const shorter = short.cells[0]?.results[0]
  if (shorter?.status !== 'accepted') assert.fail('expected synthetic short positive')
  assert.equal(shorter.expiresAt, '2026-11-25T12:00:10.000Z')
  const checker = readFileSync(new URL('../../../components/readiness/EinreiseLaenderpruefer.tsx', import.meta.url), 'utf8')
  assert.match(checker, /visibilitychange/)
  assert.match(checker, /pagehide/)
})

test('separately supplied approved copy never renders the Dev label or legal draft', () => {
  const view = presentAtVisaReadbacks(input, [], now, true)
  const sicht = einreisePrueferSicht({ phase: 'ready', view, refresh: 'off', message: null, focusResult: false })
  assert.ok(sicht)
  const html = renderToStaticMarkup(React.createElement(AtVisitorPreview, { anzeige: sicht.anzeige, approvedCopy: copy }))
  assert.match(html, /Test-Hinweis/)
  assert.match(html, /Derzeit nicht verfügbar/)
  assert.doesNotMatch(html, /Dev-Vorschau|Haftungshinweis – Entwurf|Visum nicht erforderlich/)
})

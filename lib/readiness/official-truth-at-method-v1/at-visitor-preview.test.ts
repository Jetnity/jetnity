import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AtVisitorPreview, { AtVisitorPreviewNotice } from '@/components/readiness/AtVisitorPreview'
import { einreisePrueferSicht } from '@/lib/readiness/einreise-laenderpruefer'
import { V3_CUSTOMER_INFORMATION_TOPICS } from '../official-truth-product-v3/customer-information/topics'
import { HUMAN_METHOD_DEV_URL, HUMAN_METHOD_PRODUCTION_URL } from '../official-truth-product-v3/method/human-contract'
import { eligibleAtVisitorPresentationPreview } from './at-visitor-preview-selection'
import { readAtVisaInput } from './at-visa-http'
import { presentAtVisaReadbacks, type AtVisaReadback } from './at-visitor-display'

const sourceUrls = [
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
  'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
]
const current = new Date('2026-11-17T10:45:00.000Z')
// Synthetic unit-test receipt only, never supplied to a deployed visitor.
const sample = {
  status: 'accepted', citizenshipCountryCode: 'CH', destinationCountryCode: 'AT',
  documentType: 'passport', visaEffect: 'not_required', visaMode: 'visa_exempt',
  ruleVersion: 1, sourceCheckedAt: '2026-11-17T10:00:00.000Z',
  verifiedAt: '2026-11-17T10:31:38.041Z', expiresAt: '2026-11-17T11:31:38.041Z',
  sourceUrls,
}

function render(readbacks: readonly AtVisaReadback[] = [], countries = ['CH'], now = current, synthetisch = false) {
  const input = readAtVisaInput({ destinationCountryCode: 'AT', citizenshipCountryCodes: countries })
  assert.ok(input)
  const view = presentAtVisaReadbacks(input, readbacks, now)
  const sicht = einreisePrueferSicht({ phase: 'ready', view, refresh: 'off', message: null, focusResult: false })
  assert.ok(sicht)
  return renderToStaticMarkup(React.createElement(AtVisitorPreview, { anzeige: sicht.anzeige, synthetisch }))
}

test('AT presentation-only preview is restricted to exact server Dev context', () => {
  const good = { env: 'preview', project: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM', owner: 'Jetnity',
    repo: 'jetnity', branch: 'feat/official-truth-at-visitor-preview-20261124', supabaseUrl: HUMAN_METHOD_DEV_URL }
  assert.equal(eligibleAtVisitorPresentationPreview(good), true)
  for (const change of [{ env: 'production' }, { env: undefined }, { branch: 'main' }, { branch: good.branch + '-other' },
    { project: 'other' }, { owner: 'other' }, { repo: 'other' }, { supabaseUrl: HUMAN_METHOD_PRODUCTION_URL }, { supabaseUrl: undefined }]) {
    assert.equal(eligibleAtVisitorPresentationPreview({ ...good, ...change }), false)
  }
  const page = readFileSync(new URL('../../../app/(public)/einreise/page.tsx', import.meta.url), 'utf8')
  const route = readFileSync(new URL('../../../app/api/readiness/at-visa/route.ts', import.meta.url), 'utf8')
  const oldGate = readFileSync(new URL('./at-dev-selection.ts', import.meta.url), 'utf8')
  assert.match(page, /atVisitorPreview=\{selectedAtVisitorPresentationPreview\(\)\}/)
  assert.doesNotMatch(route, /at-visitor-preview-selection|selectedAtVisitorPresentationPreview/)
  assert.doesNotMatch(oldGate, /feat\/official-truth-at-visitor-preview-20261124/)
})

test('all 26 topics per passport stay unavailable without accepted authority', () => {
  const html = render([], ['CH', 'IN'])
  assert.equal(V3_CUSTOMER_INFORMATION_TOPICS.length, 26)
  assert.equal((html.match(/data-at-visitor-topic-status="unavailable"/g) ?? []).length, 52)
  assert.equal((html.match(/data-at-visitor-visa-status="unavailable"/g) ?? []).length, 2)
  assert.match(html, /Staatsangehörigkeit: Schweiz/)
  assert.match(html, /Staatsangehörigkeit: Indien/)
  assert.match(html, /Derzeit nicht verfügbar/)
  assert.match(html, /Haftungshinweis – Entwurf/)
  assert.match(html, /noch nicht rechtlich geprüft/)
  assert.match(html, /kein Nachweis/)
  assert.doesNotMatch(html, /Visum nicht erforderlich|data-at-visitor-topic-status="confirmed"|90 €|2026-11-17/)
  assert.doesNotMatch(html, /ß/)
  for (const topic of V3_CUSTOMER_INFORMATION_TOPICS) assert.ok(html.includes('data-at-visitor-topic="' + topic.id + '"'))
})

test('only an actually accepted, matched, current visa receipt can change its own topic', () => {
  const html = render([{ country: 'CH', data: sample }], ['CH', 'IN'])
  assert.equal((html.match(/data-at-visitor-topic-status="confirmed"/g) ?? []).length, 1)
  assert.equal((html.match(/data-at-visitor-topic-status="unavailable"/g) ?? []).length, 51)
  assert.equal((html.match(/data-at-visitor-visa-status="confirmed"/g) ?? []).length, 1)
  assert.match(html, /Visum nicht erforderlich/)
  assert.match(html, /17\.11\.2026/)
  for (const invalid of [null, {}, { ...sample, citizenshipCountryCode: 'IN' },
    { ...sample, documentType: 'diplomatic_passport' }, { ...sample, sourceUrls: ['https://untrusted.invalid'] }]) {
    assert.doesNotMatch(render([{ country: 'CH', data: invalid }]), /data-at-visitor-topic-status="confirmed"|Visum nicht erforderlich/)
  }
  assert.doesNotMatch(render([{ country: 'CH', data: sample }], ['CH'], new Date(sample.expiresAt)), /data-at-visitor-topic-status="confirmed"|Visum nicht erforderlich/)
  assert.doesNotMatch(render([{ country: 'CH', data: sample }], ['CH'], current, true), /data-at-visitor-topic-status="confirmed"|Visum nicht erforderlich/)
})

test('preview layout uses wrapping, grouped responsive columns and only Hell/Dunkel', () => {
  const html = render()
  assert.match(html, /min-w-0/)
  assert.match(html, /overflow-wrap:anywhere/)
  assert.match(html, /sm:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]/)
  const frame = readFileSync(new URL('../../../components/readiness/OfficialTruthChDe.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../../../components/readiness/at-visitor-preview.css', import.meta.url), 'utf8')
  assert.match(frame, /\['light', 'dark'\]/)
  assert.match(css, /data-workspace-theme="dark"/)
  assert.doesNotMatch(css, /overflow-x:\s*hidden/)
})


test('AT Dev notice is explicit and visible in the entry and the actual result markup', () => {
  const notice = renderToStaticMarkup(React.createElement(AtVisitorPreviewNotice, { placement: 'entry' }))
  const result = render()
  for (const html of [notice, result]) {
    assert.match(html, /Dev-Vorschau · Keine Freigabe für Besucher/)
    assert.match(html, /Diese Darstellung ist nur zur Abnahme vorgesehen/)
    assert.match(html, /role="note"/)
    assert.match(html, /data-hinweis="info"/)
    assert.match(html, /text-foreground/)
  }
  assert.match(notice, /data-at-visitor-notice="entry"/)
  assert.match(result, /data-at-visitor-notice="result"/)
  const frame = readFileSync(new URL('../../../components/readiness/OfficialTruthChDe.tsx', import.meta.url), 'utf8')
  assert.match(frame, /<AtVisitorPreviewNotice placement="entry" \/>/)
  assert.match(frame, /atVisitorPreview \? <AtVisitorPreviewFrame \/> : <EinreiseLaenderpruefer \/>/)
  assert.ok(frame.indexOf('<AtVisitorPreviewNotice placement="entry" />') < frame.indexOf('<EinreiseLaenderpruefer atVisitorPreview />'))
  const checker = readFileSync(new URL('../../../components/readiness/EinreiseLaenderpruefer.tsx', import.meta.url), 'utf8')
  assert.match(checker, /atVisitorPreview && sicht\.zielCode === 'AT'/)
})

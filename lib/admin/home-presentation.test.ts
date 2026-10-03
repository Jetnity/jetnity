import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AdminTimeSeriesClient from '@/components/admin/home/AdminTimeSeriesClient'
import AdminNaechsteSchritte from '@/components/admin/home/AdminNaechsteSchritte'

test('daily chart preserves exact dates/counts and exposes values without a pointer', () => {
  const html = renderToStaticMarkup(createElement(AdminTimeSeriesClient, { data: [
    { date: '2026-10-01', reisen: 2 },
    { date: '2026-10-03', reisen: 1 },
  ] }))
  assert.match(html, /aria-label="01.10.2026: 2 Reisen"/)
  assert.match(html, /aria-label="03.10.2026: 1 Reisen"/)
  assert.doesNotMatch(html, /02.10.2026/)
  assert.equal((html.match(/<li /g) ?? []).length, 2)
  assert.match(html, /<details/)
  assert.match(html, /<dt>01.10.2026<\/dt><dd>2<\/dd>/)
  assert.match(html, /<dt>03.10.2026<\/dt><dd>1<\/dd>/)
})

test('observed zero daily counts remain explicit zero values', () => {
  const html = renderToStaticMarkup(createElement(AdminTimeSeriesClient, { data: [
    { date: '2026-10-01', reisen: 0 },
    { date: '2026-10-02', reisen: 0 },
  ] }))
  assert.match(html, /Keine neuen Reisen im dargestellten Zeitraum/)
  assert.equal((html.match(/<dd>0<\/dd>/g) ?? []).length, 2)
  assert.doesNotMatch(html, /NaN|Infinity/)
})

test('operational links remain real destinations and planned features have no action', () => {
  const html = renderToStaticMarkup(createElement(AdminNaechsteSchritte))
  for (const href of ['/admin/users', '/admin/payments', '/admin/security', '/admin/system-health', '/admin/provider-ops']) {
    assert.match(html, new RegExp(`href="${href}"`))
  }
  assert.match(html, /Read-only/)
  assert.match(html, /In Planung/)
  assert.match(html, /Kostenbild unvollständig/)
  assert.doesNotMatch(html, /Kein Ziel in diesem Slice|href="[^"]*copilot|href="[^"]*infomaniak/)
})

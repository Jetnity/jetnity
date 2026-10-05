import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SystemHealthBoard from '@/components/admin/system-health/SystemHealthBoard'
import ProviderOpsBoard from '@/components/admin/provider-ops/ProviderOpsBoard'
import { SYSTEM_HEALTH_AUDIT_BERICHT } from './system-health/fixtures'
import { PROVIDER_OPS_BOARD_AUDIT_BERICHT } from './provider-ops-board/fixtures'

function collapsed(html: string) { return html.replace(/<details\b[\s\S]*?<\/details>/g, '') }

for (const state of ['fresh', 'stale', 'unknown'] as const) {
  test(`health presentation retains parent/check truth with ${state} evidence`, () => {
    const report = structuredClone(SYSTEM_HEALTH_AUDIT_BERICHT)
    for (const item of report.items) {
      item.freshness.state = state
      for (const check of item.checks ?? []) check.freshness.state = state
    }
    const html = renderToStaticMarkup(createElement(SystemHealthBoard, { anfang: report }))
    assert.equal((html.match(/data-health-green="true"/g) ?? []).length, state === 'fresh' ? 1 : 0)
    assert.match(html, /data-health-id="app" data-health-status="unknown"/)
    assert.match(html, /data-health-id="supabase" data-health-status="not_configured"/)
    assert.match(collapsed(html), /data-health-check="supabase-app-datenzugriff" data-health-status="unavailable"/)
    assert.doesNotMatch(collapsed(html), /supabase-postgrest-airports|VERCEL_\*/)
    assert.match(html, /supabase-postgrest-airports/)
    assert.match(html, /Deployment-Health oder Vercel-Plattform/)
    assert.equal((html.match(/<details/g) ?? []).length, 5)
  })
}

for (const status of ['empty', 'unknown', 'unavailable', 'available'] as const) {
  test(`model usage ${status} never becomes budget health or a live provider capability`, () => {
    const report = structuredClone(PROVIDER_OPS_BOARD_AUDIT_BERICHT)
    const usage = report.items.find(item => item.id === 'model-usage')!
    usage.status = status
    usage.metadata = status === 'available' ? { zeilen: '3', kostenMikroUsd: '21000' } : undefined
    const html = renderToStaticMarkup(createElement(ProviderOpsBoard, { anfang: report }))
    const card = html.match(/<article[^>]*data-ops-id="model-usage"[\s\S]*?<\/article>/)![0]
    assert.match(card, /data-ops-green="false"/)
    assert.match(collapsed(html), /Kostenabdeckung unvollständig/)
    assert.match(collapsed(html), /Kein globales, dauerhaftes Budgetlimit/)
    assert.doesNotMatch(collapsed(card), /Test-Capability|CHF 0|USD 0|public\.model_usage/)
    assert.match(card, /public\.model_usage/)
    if (status === 'empty') assert.match(collapsed(card), /Kein Beleg für null Ausgaben/)
    if (status === 'available') assert.match(collapsed(card), /3.*aufgezeichnete Einträge/)
    if (status === 'unavailable') assert.match(collapsed(card), /konnte nicht gelesen werden/)
  })
}

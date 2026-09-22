#!/usr/bin/env node
// Fails on wrong navbar measurements. Does not treat later homepage overflow
// as a navbar PASS failure. Source-string / Tailwind-class tests are not used.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const hier = dirname(fileURLToPath(import.meta.url))
const PHASE = process.env.AUDIT_PHASE || 'after'
const bericht = JSON.parse(readFileSync(join(hier, `audit-${PHASE}.json`), 'utf8'))

function scene(name) {
  const gefunden = bericht.scenes.find((item) => item.name === name)
  assert.ok(gefunden, `missing scene ${name}`)
  return gefunden
}

function interaction(name) {
  const gefunden = bericht.interactions.find((item) => item.name === name)
  assert.ok(gefunden, `missing interaction ${name}`)
  return gefunden
}

if (PHASE === 'before') {
  const s1024 = scene('before_1024x768_text-200_gast')
  const s1440 = scene('before_1440x900_text-200_gast')
  assert.ok(
    (s1024.geometry.navbarHorizontalOffenders || []).length > 0 ||
      (s1024.geometry.header?.overflowX || 0) > 0.5 ||
      (s1024.geometry.controls || []).some((item) => item.right > 1024.5),
    'expected a horizontal navbar offender at 1024/200%',
  )
  assert.ok(
    (s1440.geometry.navbarVerticalOffenders || []).length > 0 ||
      (s1440.geometry.row && s1440.geometry.row.height <= 72.5 &&
        (s1440.geometry.controls || []).some((item) => item.height > 72.5 || item.bottom > (s1440.geometry.header?.bottom || 72) + 0.5)),
    'expected a vertical navbar/header clash at 1440/200%',
  )
  console.log('assert before PASS')
  process.exit(0)
}

const kritisch = [
  'after_1024x768_text-200_gast',
  'after_1440x900_text-200_gast',
  'after_1024x768_text-200_konto',
  'after_1440x900_text-200_konto',
  'after_360x800_text-200_gast',
  'after_390x844_text-200_gast',
  'after_360x800_text-100_gast',
  'after_390x844_text-100_gast',
  'after_767x800_text-100_gast',
  'after_768x800_text-100_gast',
  'after_769x800_text-100_gast',
  'after_1024x768_text-100_gast',
  'after_1440x900_text-100_gast',
  'after_1920x1080_text-100_gast',
]

for (const name of kritisch) {
  const szene = scene(name)
  assert.equal((szene.geometry.navbarHorizontalOffenders || []).length, 0, `${name} horizontal navbar overflow ${JSON.stringify(szene.geometry.navbarHorizontalOffenders)}`)
  assert.equal((szene.geometry.navbarVerticalOffenders || []).length, 0, `${name} vertical navbar overflow ${JSON.stringify(szene.geometry.navbarVerticalOffenders)}`)
  const painted = szene.geometry.controls || []
  assert.ok(painted.length > 0, `${name} painted no navbar controls`)
  for (const control of painted) {
    assert.ok(control.width >= 24 && control.height >= 24, `${name} small target ${control.text} ${control.width}x${control.height}`)
    assert.ok(control.right <= szene.geometry.viewport.width + 0.5, `${name} ${control.text} right ${control.right}`)
  }
}

const desktop200 = scene('after_1024x768_text-200_gast')
assert.ok(
  desktop200.labels.some((label) => /Reise planen|Fortsetzen/.test(label)),
  '1024/200% must keep the planning CTA readable',
)
assert.ok(
  desktop200.labels.some((label) => label.includes('Entdecken')) ||
    desktop200.labels.some((label) => /Menü/.test(label)),
  '1024/200% must keep destinations on the bar or in the menu trigger',
)

const konto = scene('after_1024x768_text-200_konto')
assert.ok(konto.labels.some((label) => label.includes('Konto')), `konto labels ${konto.labels.join('|')}`)
assert.ok(konto.labels.some((label) => label.includes('Abmelden')), `konto labels ${konto.labels.join('|')}`)

const unbekannt = scene('after_1024x768_text-200_unbekannt')
assert.equal(
  unbekannt.labels.some((label) => label === 'Anmelden' || label === 'Abmelden' || label === 'Konto'),
  false,
  `unbekannt must not claim a session: ${unbekannt.labels.join('|')}`,
)

const menu100 = interaction('after_390x600_text-100_gast')
assert.equal(menu100.beforeOpen.expanded, 'false')
assert.equal(menu100.open.expanded, 'true')
assert.equal(menu100.open.hidden, false)
assert.equal(menu100.open.inert, false)
assert.ok(menu100.open.labels.some((label) => label.includes('Entdecken')))
assert.ok(menu100.open.labels.some((label) => /Reise planen|Fortsetzen/.test(label)))
assert.equal(menu100.afterEscape.expanded, 'false')
assert.equal(menu100.afterEscape.inert, true)
assert.match(String(menu100.afterEscape.active || ''), /Menü öffnen|BUTTON/)
assert.equal(menu100.afterHash.expanded, 'false')
assert.equal(menu100.afterHash.hash, '#entdecken')
assert.equal(menu100.abortProbe.completed, false)
assert.ok(menu100.schreiben.completedUnexpected === 0, JSON.stringify(menu100.schreiben))
assert.ok(menu100.schreiben.versuche >= 1, 'armed abort must observe the probe POST attempt')
assert.ok(menu100.schreiben.abgebrochen >= 1, 'armed abort must block the probe POST')

const menu200 = interaction('after_390x600_text-200_gast')
assert.equal(menu200.open.expanded, 'true')
assert.equal((menu200.open.geometry.navbarHorizontalOffenders || []).length, 0)
assert.ok(menu200.open.geometry.menu, 'open menu geometry missing')
assert.ok(
  menu200.open.geometry.menu.overflowY === 'auto' ||
    menu200.open.geometry.menu.overflowY === 'scroll' ||
    menu200.open.geometry.menu.canScroll ||
    menu200.open.geometry.menu.height <= menu200.open.geometry.viewport.height,
  `short 200% menu must remain in-viewport/scrollable ${JSON.stringify(menu200.open.geometry.menu)}`,
)
assert.ok(menu200.focusVisible && menu200.focusVisible.height >= 24)

const menuKonto = interaction('after_390x844_text-200_konto')
assert.ok(menuKonto.open.labels.some((label) => label.includes('Konto')))
assert.ok(menuKonto.open.labels.some((label) => label.includes('Abmelden')))
assert.equal(menuKonto.schreiben.completedUnexpected, 0)

console.log('assert after PASS')

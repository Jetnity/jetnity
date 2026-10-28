import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  UX_U1A3_NEBENEINANDER_AB_PX,
  UX_U1A3_ROOT_GROSS_PX,
  dichteZeile,
} from '@/lib/trips/ux-u1a3-header-density-1'

const hier = dirname(fileURLToPath(import.meta.url))

test('Route und Hilfe teilen sich eine Zeile erst ab 1024 und unter 32px Wurzelschrift', () => {
  for (const breite of [280, 320, 360, 390, 430, 768, UX_U1A3_NEBENEINANDER_AB_PX - 1]) {
    assert.equal(dichteZeile({ viewportBreite: breite, rootSchriftPx: 16 }), false)
  }
  assert.equal(dichteZeile({ viewportBreite: UX_U1A3_NEBENEINANDER_AB_PX, rootSchriftPx: 16 }), true)
  assert.equal(dichteZeile({ viewportBreite: 1440, rootSchriftPx: 16 }), true)
  assert.equal(dichteZeile({ viewportBreite: 1440, rootSchriftPx: UX_U1A3_ROOT_GROSS_PX - 0.1 }), true)
  assert.equal(dichteZeile({ viewportBreite: 1440, rootSchriftPx: UX_U1A3_ROOT_GROSS_PX }), false)
  assert.equal(dichteZeile({ viewportBreite: 390, rootSchriftPx: UX_U1A3_ROOT_GROSS_PX }), false)
  assert.equal(dichteZeile({ viewportBreite: Number.NaN, rootSchriftPx: 16 }), false)
  assert.equal(dichteZeile({ viewportBreite: 1440, rootSchriftPx: Number.NaN }), false)
})

test('Kopf und Aktionen behalten Titel, Speicherwahrheit, 44px und die Erklärung', () => {
  const kopf = readFileSync(join(hier, '../../components/trips/TripWorkspaceKopf.tsx'), 'utf8')
  const uebersicht = readFileSync(join(hier, '../../components/trips/TripWorkspaceUebersicht.tsx'), 'utf8')
  assert.match(kopf, /data-workspace-identity/)
  assert.match(kopf, /data-save-truth=\{gast \? 'device' : 'account'\}/)
  assert.match(kopf, /Nur auf diesem Gerät/)
  assert.match(kopf, /Im Konto gespeichert/)
  assert.match(kopf, /Reisende und Budget/)
  assert.match(kopf, /label="Budget"/)
  assert.match(kopf, /Noch offen/)
  assert.match(kopf, /min-h-11/)
  assert.equal(kopf.includes('line-clamp'), false)
  assert.equal(kopf.includes('truncate'), false)
  assert.match(uebersicht, /Deine Reise auf einen Blick/)
  assert.match(uebersicht, /data-workspace-modus-heading/)
  assert.match(uebersicht, /Grunddaten, Zeitraum und Etappen/)
  assert.match(uebersicht, /ändert nichts/)
  assert.match(uebersicht, /aria-controls="reise-aenderung"/)
  assert.match(uebersicht, /aria-controls="reisebegleiter"/)
  assert.match(uebersicht, /aria-expanded=\{aenderungOffen\}/)
  assert.match(uebersicht, /aria-expanded=\{begleiterOffen\}/)
  assert.match(uebersicht, /min-h-11/)
  assert.match(uebersicht, /fortschrittText/)
  assert.match(uebersicht, /planText/)
  assert.equal(uebersicht.includes('%'), false)
  assert.equal(uebersicht.includes('text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Übersicht'), false)
})

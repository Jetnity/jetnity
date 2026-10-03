import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import {
  SECURITY_LISTEN_MAX_ZEILEN,
  securityEreignisLeerart,
  securityReadIstAnDerGrenze,
} from '@/lib/admin/security/filter-ehrlichkeit'

const route = readFileSync(join(process.cwd(), 'app/api/admin/security/list/route.ts'), 'utf8')
const widget = readFileSync(join(process.cwd(), 'components/admin/security/SecurityWidget.tsx'), 'utf8')

describe('Admin-Security Filter-Ehrlichkeit', () => {
  test('die sichtbare Grenze ist die aktuelle Listengrenze', () => {
    const match = route.match(/const MAX_ZEILEN = (\d+)/)
    assert.ok(match)
    assert.equal(Number(match[1]), SECURITY_LISTEN_MAX_ZEILEN)
    assert.match(
      ADMIN_EHRLICHE_TEXTE.securityTabelleBegrenzt,
      new RegExp(String(SECURITY_LISTEN_MAX_ZEILEN)),
    )
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleBegrenzt, /unvollständig/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleBegrenzt, /aufgezeichnete Zeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleBegrenzt, /24h-Kennzahlen/)
  })

  test('leere Nutzlast und Filter ohne Treffer sind verschiedene Sätze', () => {
    assert.equal(securityEreignisLeerart(0), 'zeitraum')
    assert.equal(securityEreignisLeerart(1), 'filter')
    assert.equal(securityEreignisLeerart(SECURITY_LISTEN_MAX_ZEILEN), 'filter')
    assert.equal(
      ADMIN_EHRLICHE_TEXTE.securityTabelleLeer,
      'Keine aufgezeichneten Events in diesem Zeitraum.',
    )
    assert.equal(
      ADMIN_EHRLICHE_TEXTE.securityTabelleFilterLeer,
      'Keine aufgezeichneten Events passen zu diesem Filter.',
    )
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityTabelleFilterLeer, /in diesem Zeitraum/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityTabelleLeer, /nichts geschehen|keine Gefahr/i)
  })

  test('die Grenze wird erst bei Erreichen genannt', () => {
    assert.equal(securityReadIstAnDerGrenze(0), false)
    assert.equal(securityReadIstAnDerGrenze(199), false)
    assert.equal(securityReadIstAnDerGrenze(200), true)
    assert.equal(securityReadIstAnDerGrenze(201), true)
    assert.throws(() => securityEreignisLeerart(-1), /nichtnegative/)
    assert.throws(() => securityEreignisLeerart(1.5), /nichtnegative/)
  })

  test('die Blockliste nennt dieselbe Grenze erst bei einer vollen Blocklisten-Nutzlast', () => {
    assert.match(
      ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt,
      new RegExp(String(SECURITY_LISTEN_MAX_ZEILEN)),
    )
    assert.match(ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt, /können unvollständig sein/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt, /Blocklisteneinträge/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt, /gelesenen Zeilen/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt, /24h-Kennzahlen/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt, /aufgezeichnete Zeilen/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt, /abgeschnitten|weitere Einträge|alle gesperrten/i)
    assert.notEqual(
      ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt,
      ADMIN_EHRLICHE_TEXTE.securityTabelleBegrenzt,
    )
    assert.match(widget, /securityReadIstAnDerGrenze\(data\.blocklist\.length\)/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityBlocklisteBegrenzt/)
    assert.match(widget, /data-security-read-bound="blocklist"/)
    assert.match(widget, /data-security-read-bound="events"/)
    assert.match(widget, /Blockliste · ohne technische Sperrwirkung/)
    assert.match(widget, /'\/api\/admin\/security\/block'/)
    assert.match(widget, /'\/api\/admin\/security\/unblock'/)
    assert.match(widget, /\{ ip, reason \}/)
    assert.match(widget, /\{ ip \}/)
  })

  test('das Widget trennt die Sätze und lässt Kennzahlen und Grenzen stehen', () => {
    assert.match(widget, /securityEreignisLeerart\(data\.events\.length\)/)
    assert.match(widget, /securityReadIstAnDerGrenze\(data\.events\.length\)/)
    assert.doesNotMatch(widget, /securityReadIstAnDerGrenze\(events/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityTabelleLeer/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityTabelleFilterLeer/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityTabelleBegrenzt/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityAbdeckungHinweis/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityKpiEvents24h/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.ipBlockHinweis/)
    assert.match(widget, /fetch\('\/api\/admin\/security\/list'/)
    assert.doesNotMatch(widget, /\.insert\(/)
    assert.doesNotMatch(widget, /from\('security_events'\)/)
  })
})
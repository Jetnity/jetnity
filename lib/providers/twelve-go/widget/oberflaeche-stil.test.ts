import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ANWENDUNGS_STIL_REIHENFOLGE, arbeitsflaeche, umfangBeweis } from '@/scripts/twelve-go-widget-v2/oberflaeche'

describe('12Go-Flächennachweis benutzt den Anwendungsstil', () => {
  test('die Reihenfolge folgt Layout und Workspace-Shell', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8')
    const shell = readFileSync('components/workspace/WorkspaceShell.tsx', 'utf8')
    const globals = layout.indexOf('styles/globals.css')
    const mint = layout.indexOf('styles/white-mint.css')
    const workspace = shell.indexOf('./workspace.css')
    const surfaces = shell.indexOf('./workspace-surfaces.css')
    assert.equal(globals >= 0 && mint > globals, true)
    assert.equal(workspace >= 0 && surfaces > workspace, true)
    assert.deepEqual(ANWENDUNGS_STIL_REIHENFOLGE, [
      'styles/globals.css',
      'styles/white-mint.css',
      'components/workspace/workspace.css',
      'components/workspace/workspace-surfaces.css',
    ])
  })

  test('die handgeschriebene Utility-Liste ist nicht mehr die Quelle', () => {
    const skript = readFileSync('scripts/twelve-go-widget-v2/oberflaeche.ts', 'utf8')
    assert.equal(skript.includes('.min-h-11 { min-height:'), false)
    assert.equal(skript.includes('/opt/cursor/artifacts'), false)
    assert.equal(skript.includes('anwendungsStil'), true)
    assert.equal(skript.includes('TwelveGoAffiliateLinks'), true)
    assert.equal(skript.includes('data-workspace-theme="light"'), true)
    assert.equal(skript.includes('workspace-content'), true)
  })

  test('ohne hellen Workspace gilt die Mint-Regel nicht', () => {
    const drin = arbeitsflaeche('<section data-twelve-go-affiliate="1"></section>')
    assert.equal(drin.includes('data-workspace-theme="light"'), true)
    assert.equal(drin.includes('workspace-content'), true)
    assert.equal(drin.includes('data-twelve-go-affiliate'), true)
    assert.equal('<body><section data-twelve-go-affiliate="1"></section></body>'.includes('workspace-shell'), false)
    assert.equal(umfangBeweis({ treffer: false, farbe: 'rgb(58,86,76)', erwartet: 'rgb(58,86,76)', seitenAbstand: null }), 'Umfang fehlt')
    assert.equal(umfangBeweis({ treffer: true, farbe: 'rgb(95,117,109)', erwartet: 'rgb(58,86,76)', seitenAbstand: null }), 'Mint-Farbe fehlt')
    assert.equal(umfangBeweis({ treffer: true, farbe: 'rgb(58,86,76)', erwartet: 'rgb(58,86,76)', seitenAbstand: 0 }), 'Inhalt ohne Seitenabstand')
    assert.equal(umfangBeweis({ treffer: true, farbe: 'rgb(58,86,76)', erwartet: 'rgb(58,86,76)', seitenAbstand: 224 }), null)
  })
})

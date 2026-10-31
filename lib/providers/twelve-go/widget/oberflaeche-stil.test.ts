import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ANWENDUNGS_STIL_REIHENFOLGE } from '@/scripts/twelve-go-widget-v2/oberflaeche'

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
  })
})

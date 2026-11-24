import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = (p: string) => readFileSync(p, 'utf8')

test('W2 owner choice exposes only Light and Dark and safely migrates old green preference', () => {
  const theme = source('components/workspace/useWorkspaceTheme.ts')
  const shell = source('components/workspace/WorkspaceShell.tsx')
  const settings = source('components/account/ui-einstellungen-1/ArbeitsbereichDarstellung.tsx')
  const css = source('components/workspace/workspace-surfaces.css')
  assert.match(theme, /WorkspaceTheme = 'light' \| 'dark'/)
  assert.match(theme, /raw === 'dark' \|\| raw === 'green' \? 'dark' : 'light'/)
  assert.match(theme, /localStorage\.setItem\(STORAGE_KEY, 'dark'\)/)
  assert.match(theme, /CHANGED/)
  assert.match(shell, /Dunkle Darstellung aktivieren/)
  assert.match(shell, /Helle Darstellung aktivieren/)
  assert.doesNotMatch(shell, /Grünes Design aktivieren/)
  assert.match(settings, /aria-pressed=\{theme === id\}/)
  assert.match(settings, /id: 'light'/)
  assert.match(settings, /id: 'dark'/)
  assert.doesNotMatch(settings, /id: 'green'/)
  assert.match(css, /data-workspace-theme="dark"/)
  assert.doesNotMatch(css, /data-workspace-theme="green"/)
  assert.match(css, /--workspace-bg: #121921/)
  assert.match(css, /\[data-hinweis="info"\]/)
  assert.match(css, /\[data-hinweis="aufgabe"\]/)
  assert.match(css, /\[data-status-siegel="gewaehlt"\]/)
  assert.match(css, /background-color: #283742/)
  assert.match(css, /background-color: #392e28/)
})

test('W2 visitor dates are rendered from civil UTC in Swiss weekday format', async () => {
  const { datumMitWochentag, aenderungstextLesbar } = await import('@/lib/trips/datum-anzeige')
  assert.equal(datumMitWochentag('2026-12-01'), 'Di, 1. Dez. 2026')
  assert.equal(datumMitWochentag('2026-11-30'), 'Mo, 30. Nov. 2026')
  assert.equal(datumMitWochentag('2026-02-30'), null)
  assert.match(aenderungstextLesbar('Etappe 1, 2026-12-01 bis 2026-12-03'), /Di, 1\. Dez\. 2026/)
  assert.doesNotMatch(aenderungstextLesbar('2026-12-01'), /\d{4}-\d{2}-\d{2}/)
})

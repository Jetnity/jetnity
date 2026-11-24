import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const quelle = (pfad: string) => readFileSync(resolve(root, pfad), 'utf8')

test('W2 #1299 offer versus user-marked booking: visible, distinct by text and colour', () => {
  const c = quelle('components/trips/ReiseAenderungBuchungshinweise.tsx')
  assert.match(c, /buchungsHinweise\(vorher, nachher\)/)
  assert.match(c, /hinweis\.status === 'vom_nutzer_markiert'/)
  assert.match(c, /hinweis\.label/)
  assert.match(c, /border-status-achtung-line bg-status-achtung-soft/)
  assert.match(c, /border-status-neutral-line bg-status-neutral-soft/)
  assert.match(c, /hinweis\.preisHinweis/)
  assert.match(c, /Preisstand mit Datum\/Uhrzeit nicht verfügbar/)
  assert.match(c, /hinweis\.handlung/)
  assert.match(c, /href=\{hinweis\.link\}/)
  assert.match(c, /rel="noopener noreferrer nofollow sponsored"/)
  assert.match(c, /min-h-11/)
  assert.match(c, /sr-only/)
  assert.doesNotMatch(c, /new Date\(|Date\.now\(|\\d\{4\}-\\d\{2\}-\\d\{2\}/,
    'display never fabricates or guesses the last price timestamp')
  assert.doesNotMatch(c, /fetch\(|axios|localStorage|supabase|sessionStorage/,
    'display is only a projection, never a booking or provider action')
})

test('W2 #1299 both edit flows show the very same trusted booking guidance', () => {
  const direct = quelle('components/trips/ReiseAenderungManuell.tsx')
  const free = quelle('components/trips/ReiseAenderung.tsx')
  for (const component of [direct, free]) {
    assert.match(component, /import ReiseAenderungBuchungshinweise/)
    assert.match(component, /<ReiseAenderungBuchungshinweise vorher=\{vorschau\.vorher\} nachher=\{vorschau\.nachher\}/)
  }
})

test('W2 #1299 cursor UI scope maintains before/after, paging and separate explicit save', () => {
  const impact = quelle('components/trips/ReiseAenderungAuswirkungen.tsx')
  const ai = quelle('components/trips/AenderungVorschau.tsx')
  assert.match(impact, /Was ändert sich in deiner Reise\?/)
  assert.match(impact, /gruppe\.zeilen\.slice\(seite \* limit, \(seite \+ 1\) \* limit\)/)
  assert.match(impact, /onClick=\{\(\) => page\(seite - 1\)\}/)
  assert.match(impact, /onClick=\{\(\) => page\(seite \+ 1\)\}/)
  assert.match(ai, /Noch nicht gespeichert/)
  assert.match(ai, /onVerwerfen/)
  assert.match(ai, /onUebernehmen/)
  assert.match(ai, /loescht \? 'Löschung übernehmen' : 'Änderung übernehmen'/)
  assert.match(ai, /Diese Punkte würden gelöscht/)
})

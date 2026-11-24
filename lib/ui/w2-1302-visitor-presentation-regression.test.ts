import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { aenderungstextLesbar, datumMitWochentag } from '@/lib/trips/datum-anzeige'

test('W2 #1302 F1: impact headings are meaningful German with umlauts and no jargon', () => {
  const title = aenderungstextLesbar('Geschützte Planpunkte mit betroffenem Reisezeitraum oder Tageskontext')
  assert.equal(title, 'Geschützte Einträge, die von der Änderung betroffen sein könnten')
  assert.equal(aenderungstextLesbar('Weitere betroffene Planpunkte'), 'Weitere betroffene Einträge')
  for (const raw of ['Übernachtungsintervalle', 'Etappenzuordnung', 'Position 1', 'Planpunkte']) {
    const shown = aenderungstextLesbar(raw)
    assert.notEqual(shown, raw)
    assert.doesNotMatch(shown, /Eintrage|Tageskontext|Etappenzuordnung|Übernachtungsintervalle|Planpunkte|Position/)
  }
})
test('W2 #1302 F2: visible dates include real weekday, while original ISO values remain untouched', () => {
  const original = 'Zeitraum: 2026-12-01 → 2026-12-02'
  const shown = aenderungstextLesbar(original)
  assert.match(shown, /Di, 1\. Dez\. 2026/)
  assert.match(shown, /Mi, 2\. Dez\. 2026/)
  assert.doesNotMatch(shown, /2026-12-0[12]/)
  assert.equal(original, 'Zeitraum: 2026-12-01 → 2026-12-02')
  assert.equal(datumMitWochentag('2026-12-01'), 'Di, 1. Dez. 2026')
  assert.equal(datumMitWochentag('2026-12-02'), 'Mi, 2. Dez. 2026')
  assert.equal(datumMitWochentag('2026-02-30'), null)
})
test('W2 #1302 F2: lodging check-in/out and day selector render visitor dates, never raw ISO', () => {
  const stay = readFileSync('components/trips/UnterkunftBestand.tsx', 'utf8')
  const editor = readFileSync('components/trips/PlanpunktEditor.tsx', 'utf8')
  assert.match(stay, /datumMitWochentag\(item\.startsOn\)/)
  assert.match(stay, /datumMitWochentag\(item\.endsOn\)/)
  assert.match(editor, /datumMitWochentag\(day\.dayDate\)/)
  assert.doesNotMatch(stay, /Check-in: \{item\.startsOn/)
  assert.doesNotMatch(editor, /\$\{day\.dayDate\}/)
  assert.doesNotMatch(stay, /Übernachtungsintervalle|Etappenzuordnung/)
})
test('W2 #1302 F3: all visible impact rows use shared prose width, flexible grid, safe wrapping', () => {
  const ui = readFileSync('components/trips/ReiseAenderungAuswirkungen.tsx', 'utf8')
  assert.match(ui, /max-w-prose grid-cols-\[minmax\(0,1fr\)\]/)
  assert.match(ui, /max-w-prose break-words/)
  assert.match(ui, /\[overflow-wrap:anywhere\]/)
  assert.match(ui, /gruppe\.zeilen\.slice\(seite \* limit, \(seite \+ 1\) \* limit\)/)
  assert.match(ui, /workspaceEditFocus\(summary\.current\)/)
})

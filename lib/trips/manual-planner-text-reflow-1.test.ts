import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('Manual Planner Text Reflow 1 – lokale Formularhülle', () => {
  const planner = quelle('../../components/trips/TripPlanner.tsx')
  const feld = quelle('../../components/ui/feld.tsx')

  test('Budget-Label und optionale Markierung bleiben sichtbar und ungekürzt', () => {
    assert.match(planner, /label="Ungefähres Gesamtbudget"/)
    assert.match(planner, /id="feld-budget"/)
    assert.match(planner, /optional/)
    assert.equal(planner.includes('sr-only">Ungefähres'), false)
    assert.equal(planner.includes('truncate'), false)
    assert.equal(planner.includes('overflow-hidden'), false)
    assert.equal(planner.includes('overflow-x-hidden'), false)
    assert.equal(planner.includes('text-['), false)
  })

  test('Reflow sitzt an der Feld-Spur, nicht an page/body-Clipping', () => {
    assert.match(planner, /feldReflowClass/)
    assert.match(planner, /grid-cols-\[minmax\(0,1fr\)\]/)
    assert.match(planner, /\[&_label\]:break-words/)
    assert.match(planner, /\[&_label>span\]:inline-block/)
    assert.match(planner, /className=\{feldReflowClass\}/)
    assert.equal((planner.match(/className=\{feldReflowClass\}/g) || []).length >= 7, true)
    assert.match(planner, /min-w-0 max-w-full rounded-\[28px\]/)
    assert.equal(planner.includes('document.body'), false)
    assert.equal(planner.includes('overflow-x-clip'), false)
  })

  test('Create-, Gate- und Prefill-Verträge bleiben unverändert', () => {
    assert.match(planner, /gastCreateGate/)
    assert.match(planner, /gastCreateVorNetzschritt/)
    assert.match(planner, /reiseFormularPruefen/)
    assert.match(planner, /gastreiseAnlegen/)
    assert.match(planner, /reiseAnlegen/)
    assert.match(planner, /reiseorteBestaetigen/)
    assert.match(planner, /initialDestination/)
    assert.match(planner, /initialIdea/)
    assert.match(planner, /type="submit"/)
    assert.match(planner, /noValidate/)
  })

  test('Gemeinsames Feld bleibt semantisch unverändert', () => {
    assert.match(feld, /htmlFor=\{id\}/)
    assert.match(feld, /\(optional\)/)
    assert.match(feld, /sr-only"> \(Pflichtfeld\)/)
    assert.match(feld, /feldFehlerId/)
    assert.match(feld, /role="alert"/)
    assert.equal(feld.includes('truncate'), false)
    assert.equal(feld.includes('overflow-hidden'), false)
  })
})

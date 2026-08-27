import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const hier = dirname(fileURLToPath(import.meta.url))

describe('Suchliste-Semantik', () => {
  test('die Option selbst ist die Interaktion, ohne nested button', () => {
    const datei = readFileSync(join(hier, '../../components/suche/Suchliste.tsx'), 'utf8')
    assert.match(datei, /role="option"/)
    assert.match(datei, /onClick=\{\(\) => onWaehlen\(index\)\}/)
    assert.match(datei, /onMouseDown=\{\(ereignis\) => ereignis\.preventDefault\(\)\}/)
    assert.match(datei, /tabIndex=\{-1\}/)
    assert.equal(datei.includes('<button'), false)
    assert.equal(datei.includes('</button>'), false)
  })

  test('OrtSuche und FlughafenSuche sichern Abort-Races mit der Anfragegrenze', () => {
    const ort = readFileSync(join(hier, '../../components/places/OrtSuche.tsx'), 'utf8')
    const flughafen = readFileSync(join(hier, '../../components/airports/FlughafenSuche.tsx'), 'utf8')
    for (const datei of [ort, flughafen]) {
      assert.match(datei, /sucheAnfrageStarten/)
      assert.match(datei, /sucheAnfrageDarfSchreiben/)
      assert.match(datei, /if \(darf\(\)\) setLaedt\(false\)/)
    }
  })
})

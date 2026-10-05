import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const lese = (relativ: string) => readFileSync(join(wurzel, relativ), 'utf8')

const FEHLER_GRENZEN = [
  'app/(public)/error.tsx',
  'app/account/error.tsx',
  'app/(admin)/admin/error.tsx',
] as const

const KONSTANTE_FALLBACKS = ['#unbekannt', '#unknown', '#n/a', '#fallback', '#error']
const OPERATOR_KORRELATION = [
  'nachverfolgbar',
  'korreliert',
  'operator-side',
  'Support findet',
  'wir finden den Fehler',
  'melde diese ID',
  'an den Support',
  '24/7',
  'rund um die Uhr',
  'automatisch nachschlagen',
]
const VERBOTENE_RUNBOOK_KORRELATION = [
  'operator-side automatic Fehler-ID correlation exists',
  'Fehler-ID is automatically correlated',
  'we can look this ID up automatically',
  'die Fehler-ID ist nachverfolgbar',
  'wir können diese ID nachschlagen',
]

function ohneKommentare(quelle: string): string {
  return quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function ohneDevDiagnose(quelle: string): string {
  return quelle
    .replace(/if\s*\(\s*process\.env\.NODE_ENV\s*!==\s*['"]production['"]\s*\)\s*\{[\s\S]*?\}/g, '')
    .replace(/\{process\.env\.NODE_ENV\s*!==\s*['"]production['"]\s*&&\s*\([\s\S]*?\)\}/g, '')
}

describe('V1 Error Reference Usability 1 bleibt wahrheits- und sicherheitstreu', () => {
  test('alle drei Fehlergrenzen zeigen eine stabile Fehler-ID und den faktischen Support-Kanal', () => {
    for (const datei of FEHLER_GRENZEN) {
      assert.equal(existsSync(join(wurzel, datei)), true, datei)
      const quelle = lese(datei)
      assert.match(quelle, /^'use client'/m, datei)
      assert.match(quelle, /oeffentlicheFehlerId\(/, datei)
      assert.match(quelle, /React\.useId\(/, datei)
      assert.match(quelle, /Fehler-ID/, datei)
      assert.match(quelle, /mailto:info@jetnity\.ch/, datei)
      assert.match(quelle, /info@jetnity\.ch/, datei)
      assert.match(quelle, /angezeigte Fehler-ID angeben/, datei)
      assert.equal(/[?&](subject|body|cc|bcc)=/i.test(quelle), false, datei)
      assert.equal(/Date\.now\s*\(/.test(quelle), false, datei)
      assert.equal(/Math\.random\s*\(/.test(quelle), false, datei)
      for (const verboten of KONSTANTE_FALLBACKS) {
        assert.equal(quelle.includes(verboten), false, `${datei} ${verboten}`)
      }

      const sichtbare = ohneKommentare(quelle)
      for (const verboten of OPERATOR_KORRELATION) {
        assert.equal(
          sichtbare.toLowerCase().includes(verboten.toLowerCase()),
          false,
          `${datei} ${verboten}`,
        )
      }
    }
  })

  test('keine der drei Fehlergrenzen loggt das Error-Objekt in Production', () => {
    for (const datei of FEHLER_GRENZEN) {
      const quelle = lese(datei)
      assert.equal(/error\.stack/.test(quelle), false, datei)

      const ohneDiagnose = ohneDevDiagnose(quelle)
      assert.equal(/console\.error\s*\(/.test(ohneDiagnose), false, `${datei} console.error`)
      assert.equal(
        /console\.error\s*\([\s\S]*?\berror\b/.test(ohneDiagnose),
        false,
        `${datei} console.error(error)`,
      )
      assert.equal(/error\?\.message/.test(ohneDiagnose), false, `${datei} error?.message`)
      assert.equal(/error\.message/.test(ohneDiagnose), false, `${datei} error.message`)
    }
  })

  test('Admin-Fehlergrenze hängt nicht am Digest und zeigt keine Production-Rohdetails', () => {
    const quelle = lese('app/(admin)/admin/error.tsx')
    assert.match(quelle, /oeffentlicheFehlerId\(/)
    assert.match(quelle, /React\.useId\(/)
    assert.match(quelle, /Fehler-ID/)
    assert.equal(/error\.digest\s*&&/.test(quelle), false)
    assert.equal(/\bRef:/.test(quelle), false)
    assert.match(quelle, /process\.env\.NODE_ENV\s*!==\s*['"]production['"]/)
    assert.equal(/error\.stack/.test(quelle), false)
    assert.match(quelle, /reset\s*\(\s*\)/)
    assert.match(quelle, /href=["']\/admin["']/)
    assert.match(quelle, /Neu laden/)
    assert.match(quelle, /Zum Dashboard/)

    const ohneDiagnose = ohneDevDiagnose(quelle)
    assert.equal(/error\?\.message/.test(ohneDiagnose), false)
    assert.equal(/error\.message/.test(ohneDiagnose), false)
    assert.equal(/console\.error\s*\(/.test(ohneDiagnose), false)
  })

  test('Support-Runbook hält 4.3 user-facing geschlossen und Korrelation offen', () => {
    const runbook = lese('docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md')

    assert.match(runbook, /no operator-side automatic Fehler-ID correlation/i)
    assert.match(runbook, /do not tell the user .we can look this ID up/i)
    assert.match(runbook, /user-facing\/process half closed/i)
    assert.match(runbook, /correlation\/tooling half remains \*\*open under 5\.5\*\*/i)
    assert.match(runbook, /Do not mark 5\.5 tooling PASS/i)
    assert.equal(runbook.includes('app/account/error.tsx'), true)
    assert.equal(/Account routes have \*\*no\*\* `app\/account\/error\.tsx`/.test(runbook), false)
    assert.equal(/Ref: \{error\.digest\}/.test(runbook), false)
    assert.equal(/Finding 4\.3 remains open\./.test(runbook), false)
    assert.equal(/admin IDs exist only when a digest exists/i.test(runbook), false)
    assert.equal(/error surfaces lack the support contact path/i.test(runbook), false)

    for (const verboten of VERBOTENE_RUNBOOK_KORRELATION) {
      assert.equal(runbook.toLowerCase().includes(verboten.toLowerCase()), false, verboten)
    }
  })
})

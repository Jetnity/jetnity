import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function dateienUnter(relativ: string): string[] {
  const start = join(wurzel, relativ)
  return readdirSync(start, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = `${relativ}/${eintrag.name}`
    return eintrag.isDirectory() ? dateienUnter(pfad) : [pfad]
  })
}

const SLICE = [
  'lib/country/katalog.ts',
  'lib/country/copy.ts',
  'lib/country/darstellung.ts',
  'lib/country/land-feld.ts',
  'components/country/LandFeld.tsx',
  'components/account/AccountReisende.tsx',
  'components/account/AccountReisendeKarte.tsx',
  'components/trips/Reisevorbereitung.tsx',
]

const VERBOTEN = [
  'primaryCitizenship',
  'defaultCitizenship',
  'defaultPassport',
  'preferred',
  'chosen',
  'bestPassport',
  'citizenships[0]',
  'documents[0]',
  'createServiceRole',
  'SERVICE_ROLE',
  'navigator.geolocation',
  'touch-pan-x',
]

describe('TA-CUX1 Scope- und Dangerous-Pattern-Vertrag', () => {
  test('führt keine Default-/First-Item-Semantik und keine Service-Role ein', () => {
    const runtime = SLICE.map((pfad) => quelle(pfad)).join('\n')
    for (const muster of VERBOTEN) {
      assert.equal(runtime.includes(muster), false, muster)
    }
    assert.equal(runtime.includes('from(\'account_travellers\')') || runtime.includes('LandFeld'), true)
  })

  test('ändert kein Schema und keine Package-Abhängigkeit', () => {
    assert.equal(
      dateienUnter('supabase/migrations').some((pfad) => pfad.toLowerCase().includes('cux1') || pfad.toLowerCase().includes('country_picker')),
      false,
    )
    const paket = quelle('package.json')
    assert.equal(paket.includes('i18n-iso-countries'), false)
    assert.equal(paket.includes('country-flag-icons'), false)
    assert.equal(paket.includes('react-country'), false)
  })
})

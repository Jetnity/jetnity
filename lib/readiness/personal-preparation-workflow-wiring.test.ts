import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

describe('personal preparation wiring', () => {
  test('the workspace watches the raw server trip and the guest read stays read-only', () => {
    const workspace = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
    const konto = readFileSync('components/trips/KontoArbeitsbereich.tsx', 'utf8')
    const gast = readFileSync('components/trips/GastArbeitsbereich.tsx', 'utf8')
    const bereich = readFileSync('components/trips/Reisevorbereitung.tsx', 'utf8')
    const speicher = readFileSync('lib/trips/gastspeicher.ts', 'utf8')
    assert.match(workspace, /usePersonalPreparationLifecycle/)
    assert.match(workspace, /eigeneSteuerung=\{eigeneSteuerung\}/)
    assert.match(workspace, /readinessKanonischeReise/)
    assert.match(konto, /readinessKanonischeReise=\{serverReise\}/)
    assert.doesNotMatch(konto, /readinessKanonischeReise=\{bestaetigt/)
    assert.match(gast, /aktiveV3GastreiseLesen\(tripId\)/)
    assert.match(bereich, /id="eigene-vorbereitung"/)
    assert.match(bereich, /Punkt hinzufügen/)
    assert.match(speicher, /export function aktiveV3GastreiseLesen/)
    assert.doesNotMatch(speicher.slice(speicher.indexOf('export function aktiveV3GastreiseLesen')), /setItem|removeItem/)
  })
})

// lib/readiness/p2-ta04-write-path-inventory.test.ts
//
// P2-TA-04 Evidence-Lock: welche aktuellen App-/Lib-/Component-Quellen
// Traveller-Tabellen direkt ansprechen vs. party_schreiben / party_loeschen.
// C1: kein produktives trip_travellers-DELETE mehr. Kein Runtime-DB-Write.

import { readdirSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const QUELL_ENDUNGEN = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const QUELL_VERZEICHNISSE = ['app', 'lib', 'components', 'scripts']
const IGNORIERTE_TEILE = new Set(['node_modules', '.git', 'docs', 'supabase'])

function dateienSammeln(verzeichnis: string, gefunden: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    if (IGNORIERTE_TEILE.has(eintrag.name)) continue
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) {
      dateienSammeln(pfad, gefunden)
      continue
    }
    const punkt = eintrag.name.lastIndexOf('.')
    const endung = punkt >= 0 ? eintrag.name.slice(punkt) : ''
    if (QUELL_ENDUNGEN.has(endung) && !eintrag.name.endsWith('.test.ts') && !eintrag.name.endsWith('.test.tsx')) {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

function quelle(absolut: string): string {
  return readFileSync(absolut, 'utf8')
}

function rel(absolut: string): string {
  return relative(wurzel, absolut).replaceAll('\\', '/')
}

const FROM_TRAVELLER = /\.from\(\s*['"]trip_travellers['"]\s*\)/
const FROM_CITIZENSHIPS = /\.from\(\s*['"]trip_traveller_citizenships['"]\s*\)/
const FROM_DOCUMENTS = /\.from\(\s*['"]trip_traveller_documents['"]\s*\)/
const RPC_PARTY = /\.rpc\(\s*['"]party_schreiben['"]/
const RPC_LOESCHEN = /\.rpc\(\s*['"]party_loeschen['"]/

describe('P2-TA-04 Traveller write-path inventory', () => {
  const kandidaten = QUELL_VERZEICHNISSE.flatMap((name) => dateienSammeln(join(wurzel, name)))

  test('kein produktiver trip_travellers-Tabellenwrite mehr', () => {
    const treffer = kandidaten.filter((pfad) => FROM_TRAVELLER.test(quelle(pfad)))
    assert.deepEqual(treffer, [])
  })

  test('travellerEntfernen löscht nur über party_loeschen', () => {
    const treffer = kandidaten.filter((pfad) => RPC_LOESCHEN.test(quelle(pfad)))
    assert.deepEqual(treffer.map(rel), ['lib/readiness/reisende-aktionen.ts'])

    const aktion = quelle(join(wurzel, 'lib/readiness/reisende-aktionen.ts'))
    const deleteBlock = aktion.slice(aktion.indexOf('export async function travellerEntfernen'))
    assert.match(deleteBlock, RPC_LOESCHEN)
    assert.doesNotMatch(deleteBlock, FROM_TRAVELLER)
    assert.doesNotMatch(deleteBlock, /\.delete\(\)/)
    assert.equal(aktion.includes('service_role'), false)
    assert.equal(aktion.includes('createServiceRole'), false)
  })

  test('keine App-/Lib-/Component-Quelle schreibt Child-Tabellen direkt', () => {
    const citizenships = kandidaten.filter((pfad) => FROM_CITIZENSHIPS.test(quelle(pfad)))
    const documents = kandidaten.filter((pfad) => FROM_DOCUMENTS.test(quelle(pfad)))
    assert.deepEqual(citizenships, [])
    assert.deepEqual(documents, [])
  })

  test('party_schreiben-RPC wird nur im Reisenden-Schreibwrapper aufgerufen', () => {
    const treffer = kandidaten.filter((pfad) => RPC_PARTY.test(quelle(pfad)))
    assert.deepEqual(treffer.map(rel), ['lib/readiness/reisende-aktionen.ts'])

    const aktion = quelle(join(wurzel, 'lib/readiness/reisende-aktionen.ts'))
    assert.match(aktion, /async function partySchreiben/)
    assert.match(aktion, /travellerSetzen/)
    assert.match(aktion, /partyUebernehmen/)
    assert.match(aktion, /registryTravellerInReiseUebernehmen/)
    assert.match(aktion, /registryTravellerAlsFrischenTripSnapshot/)
    assert.match(aktion, /partyLimitUeberschritten/)
    assert.equal(aktion.includes('service_role'), false)
    assert.equal(aktion.includes('createServiceRole'), false)
  })

  test('Konto- und Guest-UI rufen die dokumentierten Wrapper, nicht die Tabellen', () => {
    const konto = quelle(join(wurzel, 'components/trips/KontoArbeitsbereich.tsx'))
    const gast = quelle(join(wurzel, 'components/trips/GastreiseBruecke.tsx'))
    assert.match(konto, /travellerSetzen/)
    assert.match(konto, /travellerEntfernen/)
    assert.match(konto, /registryTravellerInReiseUebernehmen/)
    assert.match(gast, /partyUebernehmen/)
    assert.doesNotMatch(gast, /registryTravellerInReiseUebernehmen/)
    assert.doesNotMatch(konto, FROM_TRAVELLER)
    assert.doesNotMatch(gast, FROM_TRAVELLER)
    assert.doesNotMatch(konto, RPC_PARTY)
    assert.doesNotMatch(gast, RPC_PARTY)
    assert.doesNotMatch(konto, RPC_LOESCHEN)
    assert.doesNotMatch(gast, RPC_LOESCHEN)
  })
})

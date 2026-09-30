// lib/readiness/preparation-premium-experience-5.test.ts
//
// Presentation-Vertrag der Vorbereitung. Keine Engine, kein Provider, kein Schema.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  PREPARATION_BEREICHE,
  PREPARATION_DISCLAIMER,
  preparationPersoenlichAufteilen,
  preparationPlatzhalterGruppe,
  preparationPlatzhalterZeile,
  preparationUebersichtStatus,
} from '@/lib/readiness/preparation-premium-experience-5'
import type { ReadinessKind } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

describe('Preparation premium experience 5', () => {
  test('behält den Disclaimer und kürzt nur wiederholte Fail-closed-Sätze', () => {
    assert.match(PREPARATION_DISCLAIMER, /keine offizielle Visa- oder Einreisebestätigung/)
    const pruefung =
      'Für die automatische Prüfung fehlen noch Angaben · Automatische Einreiseprüfung derzeit nicht verfügbar'
    assert.equal(
      preparationUebersichtStatus(pruefung, 'Noch nicht offiziell geprüft'),
      pruefung,
    )
    assert.equal(
      preparationUebersichtStatus(pruefung, 'Nicht verfügbar'),
      pruefung,
    )
    assert.equal(
      preparationUebersichtStatus('Offizielle Anforderungen wurden geprüft', 'Nicht verfügbar'),
      'Offizielle Anforderungen wurden geprüft. Nicht verfügbar',
    )
    assert.equal(preparationUebersichtStatus('', 'Nicht verfügbar'), 'Nicht verfügbar')
  })

  test('teilt persönliche Punkte verlustfrei und ohne Amtsanspruch', () => {
    const items: Array<{ clientRef: string; kind: ReadinessKind }> = [
      { clientRef: 'ticket', kind: 'ticket_confirmation_check' },
      { clientRef: 'booking', kind: 'booking_confirmation_check' },
      { clientRef: 'prep', kind: 'preparation' },
      { clientRef: 'entry', kind: 'entry_check' },
      { clientRef: 'visa', kind: 'visa_check' },
    ]
    const teile = preparationPersoenlichAufteilen(items)
    assert.deepEqual(
      [...teile.tickets, ...teile.eigene, ...teile.weitere].map((item) => item.clientRef),
      items.map((item) => item.clientRef),
    )
    assert.deepEqual(teile.tickets.map((item) => item.kind), [
      'ticket_confirmation_check',
      'booking_confirmation_check',
    ])
    assert.deepEqual(teile.eigene.map((item) => item.kind), ['preparation'])
    assert.deepEqual(teile.weitere.map((item) => item.kind), ['entry_check', 'visa_check'])
  })

  test('fasst nur identische reine Placeholder zusammen', () => {
    const zeile = preparationPlatzhalterZeile(
      'Für die Prüfung fehlen Angaben: Staatsangehörigkeit',
      'Automatische Einreiseprüfung derzeit nicht verfügbar',
    )
    assert.match(zeile, /Staatsangehörigkeit/)
    assert.match(zeile, /nicht verfügbar/)
    assert.equal(
      preparationPlatzhalterZeile('Noch nicht offiziell geprüft', 'Noch nicht offiziell geprüft'),
      'Noch nicht offiziell geprüft',
    )
    const gemeinsam = preparationPlatzhalterGruppe([
      { kompakt: true, ergebnisText: 'Noch nicht offiziell geprüft', freshnessText: 'Noch nicht offiziell geprüft' },
      { kompakt: true, ergebnisText: 'Noch nicht offiziell geprüft', freshnessText: 'Noch nicht offiziell geprüft' },
    ])
    assert.equal(gemeinsam.art, 'gemeinsam')
    const abweichend = preparationPlatzhalterGruppe([
      { kompakt: true, ergebnisText: 'Erneut prüfen', freshnessText: 'Offizielle Anforderungen erneut prüfen' },
      { kompakt: true, ergebnisText: 'Noch nicht offiziell geprüft', freshnessText: 'Noch nicht offiziell geprüft' },
    ])
    assert.equal(abweichend.art, 'einzeln')
    const evidence = preparationPlatzhalterGruppe([
      { kompakt: false, ergebnisText: 'Erforderlich', freshnessText: 'Offizielle Anforderungen wurden geprüft' },
      { kompakt: false, ergebnisText: 'Erforderlich', freshnessText: 'Offizielle Anforderungen wurden geprüft' },
    ])
    assert.equal(evidence.art, 'einzeln')
  })

  test('UI bleibt bei den bestehenden Verträgen und nennt die vier Bereiche', () => {
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    const registry = quelle('components/trips/RegistryReiseUebernahme.tsx')
    assert.deepEqual(
      PREPARATION_BEREICHE.map((bereich) => bereich.titel),
      [
        'Reisende & Dokumente',
        'Offizielle Anforderungen',
        'Tickets & Buchungsbestätigungen',
        'Eigene Vorbereitung',
      ],
    )
    assert.equal(ui.includes('BEREICH_TITEL[id]'), true)
    assert.equal(ui.includes('bereich.titel'), true)
    assert.equal(ui.includes('data-preparation-section={id}'), true)
    for (const bereich of PREPARATION_BEREICHE) {
      assert.equal(ui.includes(`id="${bereich.id}"`), true, bereich.id)
    }
    assert.equal(ui.includes('PREPARATION_DISCLAIMER'), true)
    assert.equal(ui.includes('officialChecklist'), true)
    assert.equal(ui.includes('readinessWorkspaceSichtbar'), true)
    assert.equal(ui.includes('readinessWorkspaceZusammenfassung'), true)
    assert.equal(ui.includes('data-official-group'), true)
    assert.equal(ui.includes('data-official-requirement-type'), true)
    assert.equal(ui.includes('data-official-freshness'), true)
    assert.equal(ui.includes('data-official-status'), true)
    assert.equal(ui.includes('data-official-result'), true)
    assert.equal(ui.includes('timingTexte'), true)
    assert.equal(ui.includes('Vorbereitung öffnen'), true)
    assert.equal(ui.includes('Vorbereitung schliessen'), true)
    assert.equal(ui.includes('Angaben speichern'), true)
    assert.equal(ui.includes('Angaben entfernen'), true)
    assert.equal(ui.includes('Weitere Staatsbürgerschaft'), true)
    assert.equal(ui.includes('Weiteres Dokument'), true)
    assert.equal(ui.includes('Zugeordnete Staatsbürgerschaft'), true)
    assert.equal(ui.includes('Punkt hinzufügen'), true)
    assert.equal(ui.includes('Entfernen'), true)
    assert.equal(ui.includes('dokumenteAlsPayload'), true)
    assert.equal(ui.includes('citizenshipClientRefFuer'), true)
    assert.equal(ui.includes('dokumentAblaufGegenReise'), true)
    assert.equal(ui.includes('DOKUMENT_LEBENSZYKLUS_COPY.reiseHinweis'), true)
    assert.equal(ui.includes('Einreise & Reisevorbereitung'), true)
    assert.equal(ui.includes('evaluations[0]'), false)
    assert.equal(ui.includes('documents[0]'), false)
    assert.equal(ui.includes('citizenships[0]'), false)
    assert.equal(ui.includes('best passport'), false)
    assert.equal(ui.includes('bester Pass'), false)
    assert.equal(ui.includes('primaryCitizenship'), false)
    assert.equal(registry.includes('REGISTRY_TRIP_COPY.aktion'), true)
    assert.equal(registry.includes('citizenships[0]'), false)
    assert.equal(registry.includes('documents[0]'), false)
    assert.doesNotMatch(ui, /const gruppeItems = items\.filter/)
  })
})

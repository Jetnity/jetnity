import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ACCOUNT_ARCHIVE_METADATA_KEY,
  archivSchreibversion,
  archivStandVeraltet,
  archivierenPlan,
  archivierteReisenAus,
  istArchiviert,
  kontoReisenSichten,
  metadataNachArchivieren,
  metadataNachWiederherstellen,
  offeneReisenAus,
  previousStatusAusMetadata,
  previousStatusAusReise,
  wiederherstellenPlan,
} from '@/lib/account/reise-archiv'
import type { TripSummary } from '@/types/trips'

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: null,
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    updatedAt: '2026-08-01T10:00:00.000Z',
    stages: [{ name: 'Ubud', position: 1 }],
    stageCount: 1,
    dayCount: 0,
    itemCount: 0,
    ...teil,
  }
}

const HEUTE = '2026-08-24'

describe('AP-4 Archivfilter getrennt von AP-3-Datumsgruppen', () => {
  test('archivierte Reise liegt nur im Archiv, nicht in Aktiv/Kommend/Vergangen/Ohne Datum', () => {
    const aktiv = reise({
      id: 'aktiv',
      title: 'Lisbon',
      startDate: '2026-08-20',
      endDate: '2026-08-28',
      status: 'planned',
    })
    const archivVergangen = reise({
      id: 'alt',
      title: 'Rom',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      status: 'archived',
    })
    const archivOffen = reise({
      id: 'skizze',
      title: 'Skizze',
      status: 'archived',
    })
    const sicht = kontoReisenSichten([aktiv, archivVergangen, archivOffen], '', HEUTE)

    assert.deepEqual(sicht.gruppen.aktiv.map((eintrag) => eintrag.id), ['aktiv'])
    assert.deepEqual(sicht.gruppen.kommend, [])
    assert.deepEqual(sicht.gruppen.vergangen, [])
    assert.deepEqual(sicht.gruppen.ohneDatum, [])
    assert.deepEqual(sicht.archiv.map((eintrag) => eintrag.id), ['alt', 'skizze'])
  })

  test('Archiv-Suche bleibt im Archiv und springt nicht in eine Datumsgruppe', () => {
    const offen = reise({
      id: 'porto',
      title: 'Porto Wochenende',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      status: 'planned',
    })
    const archiv = reise({
      id: 'alt-porto',
      title: 'Porto Archiv',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      status: 'archived',
    })
    const sicht = kontoReisenSichten([offen, archiv], 'porto', HEUTE)

    assert.deepEqual(sicht.gruppen.kommend.map((eintrag) => eintrag.id), ['porto'])
    assert.deepEqual(sicht.gruppen.vergangen, [])
    assert.deepEqual(sicht.archiv.map((eintrag) => eintrag.id), ['alt-porto'])
  })

  test('date-only-Ableitung selbst filtert archived nicht; der Filter ist eine zweite Verantwortung', () => {
    const archiv = reise({
      id: 'alt',
      title: 'Archiv',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      status: 'archived',
    })
    assert.equal(istArchiviert(archiv), true)
    assert.deepEqual(offeneReisenAus([archiv]), [])
    assert.deepEqual(archivierteReisenAus([archiv]).map((eintrag) => eintrag.id), ['alt'])
  })
})

describe('AP-4 Restore-Provenienz', () => {
  test('Archivieren draft → Provenienz draft → archived', () => {
    const plan = archivierenPlan({ status: 'draft', metadata: { notiz: 'behalten' } })
    assert.equal(plan.ok, true)
    if (!plan.ok) return
    assert.equal(plan.expectedStatus, 'draft')
    assert.equal(plan.nextStatus, 'archived')
    assert.equal(previousStatusAusMetadata(plan.nextMetadata), 'draft')
    assert.equal(plan.nextMetadata.notiz, 'behalten')
  })

  test('Archivieren planned und booked erhält den jeweiligen exakten vorherigen Status', () => {
    for (const status of ['planned', 'booked'] as const) {
      const plan = archivierenPlan({ status, metadata: { a: 1 } })
      assert.equal(plan.ok, true)
      if (!plan.ok) continue
      assert.equal(plan.expectedStatus, status)
      assert.equal(plan.nextStatus, 'archived')
      assert.equal(previousStatusAusMetadata(plan.nextMetadata), status)
      assert.equal(plan.nextMetadata.a, 1)
    }
  })

  test('Bereits archiviert überschreibt Provenienz nicht', () => {
    const metadata = {
      notiz: 'alt',
      [ACCOUNT_ARCHIVE_METADATA_KEY]: { previous_status: 'planned' },
    }
    const plan = archivierenPlan({ status: 'archived', metadata })
    assert.deepEqual(plan, { ok: false, grund: 'bereits-archiviert' })
    assert.equal(previousStatusAusMetadata(metadata), 'planned')
  })

  test('Wiederherstellen nutzt exakt gültigen previous_status', () => {
    const plan = wiederherstellenPlan({
      status: 'archived',
      metadata: {
        notiz: 'behalten',
        [ACCOUNT_ARCHIVE_METADATA_KEY]: { previous_status: 'booked' },
      },
    })
    assert.equal(plan.ok, true)
    if (!plan.ok) return
    assert.equal(plan.expectedStatus, 'archived')
    assert.equal(plan.nextStatus, 'booked')
    assert.equal(plan.nextMetadata.notiz, 'behalten')
    assert.equal(ACCOUNT_ARCHIVE_METADATA_KEY in plan.nextMetadata, false)
    assert.equal(previousStatusAusMetadata(plan.nextMetadata), null)
  })

  test('fehlende oder ungültige Restore-Provenienz ist fail-closed, kein Default', () => {
    assert.deepEqual(wiederherstellenPlan({ status: 'archived', metadata: {} }), {
      ok: false,
      grund: 'keine-provenienz',
    })
    assert.deepEqual(
      wiederherstellenPlan({
        status: 'archived',
        metadata: { [ACCOUNT_ARCHIVE_METADATA_KEY]: { previous_status: 'archived' } },
      }),
      { ok: false, grund: 'keine-provenienz' },
    )
    assert.deepEqual(
      wiederherstellenPlan({
        status: 'archived',
        metadata: { [ACCOUNT_ARCHIVE_METADATA_KEY]: { previous_status: 'planned ' } },
      }),
      { ok: false, grund: 'keine-provenienz' },
    )
    assert.deepEqual(
      wiederherstellenPlan({
        status: 'archived',
        metadata: { [ACCOUNT_ARCHIVE_METADATA_KEY]: 'planned' },
      }),
      { ok: false, grund: 'keine-provenienz' },
    )
    assert.equal(previousStatusAusMetadata({ [ACCOUNT_ARCHIVE_METADATA_KEY]: { previous_status: 'draft' } }), 'draft')
    assert.equal(previousStatusAusMetadata(null), null)
  })

  test('bestehende metadata-Keys bleiben bei Archive und Restore erhalten', () => {
    const metadata = { keep: true, liste: [1, 2], tief: { a: 'b' } }
    const archiviert = metadataNachArchivieren(metadata, 'planned')
    assert.ok(archiviert)
    assert.equal(archiviert.keep, true)
    assert.deepEqual(archiviert.liste, [1, 2])
    assert.deepEqual(archiviert.tief, { a: 'b' })

    const restored = metadataNachWiederherstellen(archiviert)
    assert.ok(restored)
    assert.deepEqual(restored, metadata)
  })

  test('bestehende Geschwister unter account_archive überleben Archive und Restore', () => {
    const metadata = {
      source: 'import',
      [ACCOUNT_ARCHIVE_METADATA_KEY]: { extra: 'behalten' },
    }
    const archiviert = metadataNachArchivieren(metadata, 'planned')
    assert.deepEqual(archiviert, {
      source: 'import',
      [ACCOUNT_ARCHIVE_METADATA_KEY]: {
        extra: 'behalten',
        previous_status: 'planned',
      },
    })

    const restored = metadataNachWiederherstellen(archiviert)
    assert.deepEqual(restored, metadata)
    assert.equal(previousStatusAusMetadata(restored), null)
  })

  test('ungültiges Metadata-Objekt ist fail-closed, ohne erfundene Größengrenze', () => {
    assert.deepEqual(archivierenPlan({ status: 'draft', metadata: ['nein'] }), {
      ok: false,
      grund: 'metadata-ungueltig',
    })
  })

  test('gleicher Status mit geändertem updated_at gilt als veraltet', () => {
    assert.equal(archivSchreibversion('2026-08-27T10:00:00.000Z'), '2026-08-27T10:00:00.000Z')
    assert.equal(archivSchreibversion(''), null)
    assert.equal(archivSchreibversion(null), null)
    assert.equal(
      archivStandVeraltet(
        { status: 'draft', updatedAt: '2026-08-27T10:00:00.000Z' },
        { status: 'draft', updatedAt: '2026-08-27T10:00:01.000Z' },
      ),
      true,
    )
    assert.equal(
      archivStandVeraltet(
        { status: 'draft', updatedAt: '2026-08-27T10:00:00.000Z' },
        { status: 'draft', updatedAt: '2026-08-27T10:00:00.000Z' },
      ),
      false,
    )
  })

  test('null-Stand und nicht-archivierter Restore sind fail-closed', () => {
    assert.deepEqual(archivierenPlan(null), { ok: false, grund: 'unbekannt' })
    assert.deepEqual(wiederherstellenPlan(null), { ok: false, grund: 'unbekannt' })
    assert.deepEqual(wiederherstellenPlan({ status: 'planned', metadata: {} }), {
      ok: false,
      grund: 'nicht-archiviert',
    })
    assert.deepEqual(archivierenPlan({ status: 'unknown', metadata: {} }), {
      ok: false,
      grund: 'ungueltiger-status',
    })
  })

  test('Listenfeld archivePreviousStatus erfindet keinen Status', () => {
    assert.equal(previousStatusAusReise({ archivePreviousStatus: 'planned' }), 'planned')
    assert.equal(previousStatusAusReise({ archivePreviousStatus: null }), null)
    assert.equal(previousStatusAusReise({}), null)
  })
})

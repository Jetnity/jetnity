import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activityZustand, activityZustandMeldung } from '@/lib/activities/zustand'

describe('Aktivitätszustand', () => {
  test('Production bleibt hart aus, auch mit Kill Switch und Provider', () => {
    const zustand = activityZustand({ VERCEL_ENV: 'production', JETNITY_ACTIVITY_AKTIV: 'true' }, true)
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'production')
    assert.match(activityZustandMeldung(zustand), /Production/)
  })

  test('ohne Kill Switch bleibt die Suche aus', () => {
    const zustand = activityZustand({}, true)
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'abgeschaltet')
  })

  test('fehlender Provider ist Feature-unavailable, kein Buildfehler', () => {
    const zustand = activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, false)
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'ohne-zugang')
    assert.match(activityZustandMeldung(zustand), /vorbereitet/)
  })

  test('Preview darf die Suche nur mit Provider einschalten', () => {
    const zustand = activityZustand({ VERCEL_ENV: 'preview', JETNITY_ACTIVITY_AKTIV: 'true' }, true)
    assert.deepEqual(zustand, { aktiv: true, umgebung: 'test' })
  })
})

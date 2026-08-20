import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { modellFuerReiseaenderung } from '@/lib/reiseaenderung/routing'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Das Routing für eine Reiseänderung', () => {
  test('eine kurze Änderung an einer kleinen Reise geht an Terra', () => {
    assert.equal(
      modellFuerReiseaenderung('Wir reisen jetzt zu dritt.', beispielreise()),
      'gpt-5.6-terra',
    )
  })

  test('eine Umstrukturierung einer mehrstufigen Reise geht an Sol', () => {
    assert.equal(
      modellFuerReiseaenderung('Entferne Rom und mach Florenz länger.', beispielreise()),
      'gpt-5.6-sol',
    )
    assert.equal(
      modellFuerReiseaenderung('Füge nach Florenz noch zwei Tage am Meer hinzu.', beispielreise()),
      'gpt-5.6-sol',
    )
  })

  test('viele Etappen oder Tage gehen an Sol', () => {
    const lang = beispielreise({
      stages: [
        ...beispielreise().stages,
        { id: 's3', position: 3, name: 'Neapel', countryCode: 'IT', arrivalDate: null, departureDate: null, latitude: null, longitude: null },
      ],
    })
    assert.equal(modellFuerReiseaenderung('Mach es ruhiger.', lang), 'gpt-5.6-sol')
  })

  test('ein gesetzter Name sticht den Pfad', () => {
    assert.equal(
      modellFuerReiseaenderung('Entferne Rom.', beispielreise(), 'gpt-5.6-terra'),
      'gpt-5.6-terra',
    )
  })

  test('Luna wird nicht automatisch gewählt', () => {
    assert.notEqual(
      modellFuerReiseaenderung('Mach die Reise zwei Tage länger.', beispielreise()),
      'gpt-5.6-luna',
    )
  })
})

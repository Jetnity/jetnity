import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  REGISTRY_BEZEICHNUNG_ABGELEHNT,
  REGISTRY_DOKUMENT_LIMIT,
  REGISTRY_DOPPELTE_STAAT,
  REGISTRY_SCHREIB_500,
  REGISTRY_SCHREIB_503,
  REGISTRY_STAAT_LIMIT,
  registrySchreibmeldung,
} from '@/lib/traveller/account-registry-meldung'

describe('Account-Registry Schreibmeldungen', () => {
  test('übersetzt Duplicate-Country und Limit-Backstops', () => {
    assert.equal(
      registrySchreibmeldung({
        code: '23505',
        message: 'duplicate key value violates unique constraint "account_traveller_citizenships_land_eindeutig"',
      }),
      REGISTRY_DOPPELTE_STAAT,
    )
    assert.equal(
      registrySchreibmeldung({
        code: '23514',
        message: 'Ein Registry-Reisender trägt höchstens 8 Staatsbürgerschaften.',
      }),
      REGISTRY_STAAT_LIMIT,
    )
    assert.equal(
      registrySchreibmeldung({
        code: '23514',
        message: 'Ein Registry-Reisender trägt höchstens 12 Reisedokumente.',
      }),
      REGISTRY_DOKUMENT_LIMIT,
    )
  })

  test('trennt 503 von generischer Ablehnung und lehnt sensible Labels ehrlich ab', () => {
    assert.equal(registrySchreibmeldung({ message: 'fetch failed' }, 0), REGISTRY_SCHREIB_503)
    assert.equal(
      registrySchreibmeldung({
        code: '23514',
        message: 'new row violates check constraint "account_travellers_keine_ausweisnummern"',
      }),
      REGISTRY_BEZEICHNUNG_ABGELEHNT,
    )
    assert.equal(registrySchreibmeldung({ code: '42P01', message: 'relation missing' }), REGISTRY_SCHREIB_500)
  })
})

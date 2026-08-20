import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { LeseRollen, SchreibPrivilegien, rechteAusMetadaten } from '@/lib/rollout/rechte'

const gesund = {
  rlsAktiv: true,
  rechte: [
    { rolle: 'anon', privileg: 'SELECT' },
    { rolle: 'authenticated', privileg: 'SELECT' },
  ],
  policies: [
    { name: 'places_lesen', cmd: 'SELECT', rollen: ['anon', 'authenticated'] },
  ],
}

describe('Rechte aus Metadaten', () => {
  test('SELECT plus RLS ohne Schreibrecht besteht', () => {
    const befund = rechteAusMetadaten(gesund)
    assert.equal(befund.lesen, true)
    assert.equal(befund.schreiben, false)
    assert.deepEqual([...LeseRollen], ['anon', 'authenticated'])
    assert.deepEqual([...SchreibPrivilegien], ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'])
  })

  test('fehlendes SELECT, fehlendes RLS oder Schreibrecht fallen durch', () => {
    assert.equal(rechteAusMetadaten({ ...gesund, rlsAktiv: false }).lesen, false)
    assert.equal(
      rechteAusMetadaten({
        ...gesund,
        rechte: [{ rolle: 'anon', privileg: 'SELECT' }],
      }).lesen,
      false,
    )
    assert.equal(
      rechteAusMetadaten({
        ...gesund,
        rechte: [...gesund.rechte, { rolle: 'anon', privileg: 'INSERT' }],
      }).schreiben,
      true,
    )
    assert.equal(
      rechteAusMetadaten({
        ...gesund,
        policies: [...gesund.policies, { name: 'places_schreiben', cmd: 'INSERT', rollen: ['anon'] }],
      }).schreiben,
      true,
    )
    assert.equal(
      rechteAusMetadaten({
        ...gesund,
        rechte: [...gesund.rechte, { rolle: 'PUBLIC', privileg: 'DELETE' }],
      }).schreiben,
      true,
    )
  })
})

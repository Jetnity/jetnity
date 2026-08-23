import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { sha256Hex } from '@/lib/readiness/digest'

describe('SHA-256 Digest', () => {
  test('kennt die leere Eingabe und einen kurzen Vektor', () => {
    assert.equal(
      sha256Hex(''),
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    assert.equal(
      sha256Hex('abc'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

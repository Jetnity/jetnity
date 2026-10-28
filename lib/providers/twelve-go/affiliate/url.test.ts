import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { TWELVE_GO_GEPRUEFTE_ROUTEN, TWELVE_GO_PARTNER_ID, TWELVE_GO_SUB_ID } from '@/lib/providers/twelve-go/affiliate/konstanten'
import { twelveGoAffiliateUrl, twelveGoGenerischeSuche } from '@/lib/providers/twelve-go/affiliate/url'

const ERWARTET = `https://12go.asia/?z=${TWELVE_GO_PARTNER_ID}&sub_id=${TWELVE_GO_SUB_ID}`

function pruefe(href: string, pathname: string) {
  const url = new URL(href)
  assert.equal(url.protocol, 'https:')
  assert.equal(url.hostname, '12go.asia')
  assert.equal(url.port, '')
  assert.equal(url.username, '')
  assert.equal(url.password, '')
  assert.equal(url.hash, '')
  assert.equal(url.pathname, pathname)
  assert.deepEqual([...url.searchParams.keys()], ['z', 'sub_id'])
  assert.equal(url.searchParams.getAll('z').length, 1)
  assert.equal(url.searchParams.getAll('sub_id').length, 1)
  assert.equal(url.searchParams.get('z'), TWELVE_GO_PARTNER_ID)
  assert.equal(url.searchParams.get('sub_id'), TWELVE_GO_SUB_ID)
  assert.equal(url.search, `?z=${TWELVE_GO_PARTNER_ID}&sub_id=${TWELVE_GO_SUB_ID}`)
  assert.doesNotMatch(href, /date=|currency|pax|traveller|age|chf/i)
}

describe('12Go Affiliate-URL', () => {
  test('allgemeine Suche ist fest und ohne Personenbezug', () => {
    assert.equal(TWELVE_GO_GEPRUEFTE_ROUTEN.length, 0)
    const href = twelveGoGenerischeSuche()
    assert.equal(href, ERWARTET)
    pruefe(href, '/')
  })

  test('nur ein geprüfter /de/travel-Pfad bleibt erhalten', () => {
    const href = twelveGoAffiliateUrl('/de/travel/Bangkok/Koh-Chang/')
    assert.ok(href)
    pruefe(href!, '/de/travel/Bangkok/Koh-Chang/')
    assert.equal(href, `https://12go.asia/de/travel/Bangkok/Koh-Chang/?z=${TWELVE_GO_PARTNER_ID}&sub_id=${TWELVE_GO_SUB_ID}`)
    assert.doesNotMatch(href!, /jetnity-route-demo/)
  })

  test('Namen, Hosts und Abfragen werden nicht zu einer Strecke', () => {
    const abgelehnt = [
      '/travel/Bangkok/Koh-Chang/',
      '/de/travel/Bangkok/Koh Chang/',
      '/de/travel/Bangkok/Koh-Chang',
      '/de/travel/Bangkok/Koh-Chang/?z=1',
      '/de/travel/Bangkok/Koh-Chang/#x',
      '/de/travel/../Koh-Chang/',
      'https://12go.asia/de/travel/Bangkok/Koh-Chang/',
      'https://evil.example/de/travel/Bangkok/Koh-Chang/',
      'https://12go.asia.evil/',
      '//evil.example/',
      'javascript:alert(1)',
      '/de/travel/%42angkok/Koh-Chang/',
      '',
    ]
    for (const pfad of abgelehnt) assert.equal(twelveGoAffiliateUrl(pfad), null, pfad)
  })
})

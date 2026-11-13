import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cityPhoto, licensedPhoto } from './city-photo'

const raw = { width: 2000, height: 1000, thumburl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Cityscape_Berlin.jpg/1280px-Cityscape_Berlin.jpg?utm_source=commons', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Cityscape_Berlin.jpg', extmetadata: {
  Artist: { value: '<b><a href="https://example.com">Thomas Wolf</a></b>' }, LicenseShortName: { value: 'CC BY-SA 3.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0' }, Restrictions: { value: '' },
} }

test('free photo retains individual attribution and drops tracking query', () => {
  const p = licensedPhoto(raw, 'Cityscape Berlin.jpg')
  assert.ok(p)
  assert.equal(p.author, 'Thomas Wolf')
  assert.equal(p.licenseUrl, 'https://creativecommons.org/licenses/by-sa/3.0/')
  assert.equal(p.src.includes('?'), false)
  assert.equal(p.sourceUrl, raw.descriptionurl)
})

test('ambiguous rights, restrictions and arbitrary image hosts are rejected', () => {
  assert.equal(licensedPhoto({ ...raw, extmetadata: {} }, 'photo'), null)
  assert.equal(licensedPhoto({ ...raw, thumburl: 'https://evil.example/photo.jpg' }, 'photo'), null)
  assert.equal(licensedPhoto({ ...raw, thumburl: raw.thumburl.replace('.jpg?', '.svg?') }, 'photo'), null)
  assert.equal(licensedPhoto({ ...raw, extmetadata: { ...raw.extmetadata, LicenseUrl: { value: 'https://evil.example/by-sa/3.0' } } }, 'photo'), null)
  assert.equal(licensedPhoto({ ...raw, extmetadata: { ...raw.extmetadata, Restrictions: { value: 'non-commercial only' } } }, 'photo'), null)
  assert.equal(licensedPhoto({ ...raw, extmetadata: { ...raw.extmetadata, LicenseShortName: { value: 'All rights reserved' } } }, 'photo'), null)
})

test('untrusted metadata never creates HTML or scripts in the attribution', () => {
  const p = licensedPhoto({ ...raw, extmetadata: { ...raw.extmetadata, Artist: { value: '<script>alert(1)</script><img src=x onerror=alert(2)>Alice &amp; Bob' } } }, 'photo')
  assert.equal(p?.author, 'Alice & Bob')
})

test('non-canonical names and invalid country identifiers never invoke external lookup', async () => {
  assert.equal(await cityPhoto('Paris', 'FR'), null)
  assert.equal(await cityPhoto('geonames:2988507', 'France'), null)
  assert.equal(await cityPhoto('geonames:1"; malicious', 'FR'), null)
})

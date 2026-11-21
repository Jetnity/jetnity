import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cityPhotoQuery } from './query'

test('exact canonical place and country alone are still accepted', () => {
  assert.deepEqual(cityPhotoQuery(new URLSearchParams('place=geonames%3A2950159&country=DE')),
    { place: 'geonames:2950159', country: 'DE' })
})
test('a single bounded provider-owned Vercel share query marker does not hide public city pictures', () => {
  const input = new URLSearchParams('place=geonames%3A2950159&country=DE&_vercel_share=gzmV317tapuT74Txsn0HMD1AYxAwzo2W')
  assert.deepEqual(cityPhotoQuery(input), { place: 'geonames:2950159', country: 'DE' })
})
test('unknown fields, duplicate source identity and malformed share markers remain rejected', () => {
  for (const query of [
    '', 'place=geonames%3A2950159', 'country=DE',
    'place=geonames%3A2950159&country=DE&other=1',
    'place=geonames%3A2950159&country=DE&place=geonames%3A2988507',
    'place=geonames%3A2950159&country=DE&country=FR',
    'place=geonames%3A2950159&country=DE&_vercel_share=',
    'place=geonames%3A2950159&country=DE&_vercel_share=a',
    'place=geonames%3A2950159&country=DE&_vercel_share=fixed_token&_vercel_share=another_token',
  ]) assert.equal(cityPhotoQuery(new URLSearchParams(query)), null, query)
})

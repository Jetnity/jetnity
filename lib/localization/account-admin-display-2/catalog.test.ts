import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ADMIN_SPRACHKATALOG } from '../admin-sprachkatalog'
import { ANALYTICS_SCHLUESSEL, ANALYTICS_TEXTE } from '../analytics-texte'
import { BUCHUNGEN_SCHLUESSEL, BUCHUNGEN_TEXTE } from '../buchungen-texte'
import { ADMIN_LESE_SCHLUESSEL, ADMIN_LESE_TEXTE } from '../admin-lese-texte'

test('catalog exposes every actual analytics and booking translation without duplicate keys', () => {
  const expected = [
    ...ANALYTICS_SCHLUESSEL.map((key) => ({ key, de: ANALYTICS_TEXTE.de[key], en: ANALYTICS_TEXTE.en[key] })),
    ...BUCHUNGEN_SCHLUESSEL.map((key) => ({ key: `bookings.${key}`, de: BUCHUNGEN_TEXTE.de[key], en: BUCHUNGEN_TEXTE.en[key] })),
    ...ADMIN_LESE_SCHLUESSEL.map((key) => ({ key, de: ADMIN_LESE_TEXTE.de[key], en: ADMIN_LESE_TEXTE.en[key] })),
  ]
  for (const row of expected) assert.deepEqual(ADMIN_SPRACHKATALOG.filter(({ key }) => key === row.key), [row])
  assert.equal(new Set(ADMIN_SPRACHKATALOG.map(({ key }) => key)).size, ADMIN_SPRACHKATALOG.length)
})

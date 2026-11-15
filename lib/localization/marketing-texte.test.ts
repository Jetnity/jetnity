import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MARKETING_SCHLUESSEL, MARKETING_TEXTE, marketingText } from './marketing-texte'
import { EINSTELLUNGEN_SCHLUESSEL, EINSTELLUNGEN_TEXTE, einstellungenText } from './einstellungen-texte'
import { ADMIN_SPRACHKATALOG } from './admin-sprachkatalog'

test('all Marketing messages are complete namespaced plain text in both languages', () => {
  assert.deepEqual(Object.keys(MARKETING_TEXTE.en).sort(), [...MARKETING_SCHLUESSEL].sort())
  assert.equal(new Set(MARKETING_SCHLUESSEL).size, MARKETING_SCHLUESSEL.length)
  for (const key of MARKETING_SCHLUESSEL) for (const language of ['de', 'en'] as const) {
    assert.match(key, /^marketing\./)
    const value = marketingText(language, key)
    assert.ok(value.trim().length > 0)
    assert.doesNotMatch(value, /<\/?[a-z]|\bundefined\b|\bTODO\b|\bTRANSLATE\b/)
  }
})

test('combined catalog preserves every Settings key and both original values without collisions', () => {
  assert.equal(ADMIN_SPRACHKATALOG.length, EINSTELLUNGEN_SCHLUESSEL.length + MARKETING_SCHLUESSEL.length)
  assert.equal(new Set(ADMIN_SPRACHKATALOG.map((row) => row.key)).size, ADMIN_SPRACHKATALOG.length)
  for (const key of EINSTELLUNGEN_SCHLUESSEL) assert.deepEqual(ADMIN_SPRACHKATALOG.find((row) => row.key === key), { key, de: EINSTELLUNGEN_TEXTE.de[key], en: EINSTELLUNGEN_TEXTE.en[key] })
  for (const key of MARKETING_SCHLUESSEL) assert.deepEqual(ADMIN_SPRACHKATALOG.find((row) => row.key === key), { key, de: MARKETING_TEXTE.de[key], en: MARKETING_TEXTE.en[key] })
  assert.ok(Object.isFrozen(ADMIN_SPRACHKATALOG))
  assert.ok(ADMIN_SPRACHKATALOG.every(Object.isFrozen))
})

test('coverage, public destination and copy uncertainty stay explicit without publication or storage claims', () => {
  assert.match(marketingText('de', 'marketing.scope'), /nicht gespeichert oder gemessen/)
  assert.match(marketingText('en', 'marketing.scope'), /not stored or measured/)
  for (const language of ['de', 'en'] as const) {
    assert.match(marketingText(language, 'marketing.origin'), /jetnity\.com/)
    assert.match(einstellungenText(language, 'catalog.scope'), /Marketing/)
    assert.match(einstellungenText(language, 'catalog.intro'), /Marketing/)
  }
  assert.match(marketingText('en', 'marketing.copy.unconfirmed'), /not cancelled or retried/)
  assert.match(marketingText('en', 'marketing.copy.outstanding'), /may change the clipboard later.*after it settles/)
  assert.match(marketingText('de', 'marketing.copy.outstanding'), /Zwischenablage später ändern.*Abschluss/)
  assert.doesNotMatch(einstellungenText('de', 'language.scope'), /Admin|Marketing/)
})

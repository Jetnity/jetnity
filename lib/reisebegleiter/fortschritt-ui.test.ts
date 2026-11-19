import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import Begleiterfortschritt from '@/components/trips/Begleiterfortschritt'

describe('Warteanzeige des Reisebegleiters', () => {
  const html = renderToStaticMarkup(createElement(Begleiterfortschritt))

  test('zeigt eine zugängliche Statuskarte statt nur einer Ladezeile', () => {
    assert.match(html, /role="status"/)
    assert.match(html, /aria-live="polite"/)
    assert.match(html, /aria-busy="true"/)
    assert.match(html, /Jetnity bereitet deine Auskunft vor/)
    assert.match(html, /Deine Frage wird bearbeitet/)
    assert.equal((html.match(/<li\b/g) ?? []).length, 3)
    assert.match(html, /motion-safe:animate-pulse/)
  })

  test('beschreibt die echten Jetnity-Schritte ohne frei erfundene Antwort oder Live-Phase', () => {
    assert.match(html, /gespeicherten Reisebestand berücksichtigen/)
    assert.match(html, /Zutreffende Jetnity-Aussagen auswählen/)
    assert.match(html, /Auskunft vor der Anzeige prüfen/)
    assert.match(html, /keinen gemessenen Live-Fortschritt/)
    assert.doesNotMatch(html, /\d+\s*%|amtlich (?:freigegeben|bestätigt)|Flugpreis|Anbieterpreis|wird gebucht/i)
  })

  test('Statuspunkte sind dekorativ und erzeugen keine zusätzliche Auskunft', () => {
    assert.equal((html.match(/aria-hidden="true"/g) ?? []).length, 4)
    assert.doesNotMatch(html, /<button|<form|<input/)
  })
})

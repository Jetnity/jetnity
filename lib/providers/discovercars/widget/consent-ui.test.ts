import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DiscoverCarsSuche from '@/components/trips/DiscoverCarsSuche'

test('ohne Anbieter-CMP-Freigabe bietet die Mietwagensuche nur sichere Alternativen', () => {
  const markup = renderToStaticMarkup(createElement(DiscoverCarsSuche))
  assert.match(markup, /optionale externe Suchformular ist noch nicht freigegeben/)
  assert.match(markup, /nicht geladen und erhält dadurch keine Verbindungsdaten/)
  assert.match(markup, /Direkt bei DiscoverCars suchen/)
  assert.doesNotMatch(markup, /<iframe|>Suchformular laden</)
  assert.doesNotMatch(markup, /data-discovercars-zustand="sichtbar"/)
})

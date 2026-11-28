// lib/layout/kopfleiste.test.ts
//
// Premium-Redesign PR A (A1): Öffentliche Seiten und Arbeitsbereich teilen EINEN Kopfbaustein
// (components/layout/KopfLeiste.tsx). Der Test rendert den echten Baustein serverseitig in beiden
// Varianten und prüft, dass Marke, Menüknopf, «Reise planen» und Kontomenü identisch entstehen,
// dass Slots ihren Platz bekommen und dass die Darstellungswahl im öffentlichen Kontomenü steht.
// Er ersetzt keinen Browser-Test: Sichtbarkeit und Masse messen scripts/premium-redesign-a/*.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import KopfLeiste, { type KopfVariante } from '@/components/layout/KopfLeiste'

function rendern(variante: KopfVariante, zusatz: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    createElement(KopfLeiste, {
      variante,
      menue: { offen: false, steuert: 'ziel-menue', onKlick: () => undefined },
      ...zusatz,
    }),
  )
}

function ohneVariante(html: string) {
  return html
    .replace(/ data-kopf-variante="[^"]*"/, '')
    .replace(/ class="kopf (kopf-oeffentlich|workspace-header)/, ' class="kopf')
    .replace(/ kopf-menue-oeffentlich| workspace-menu-button/, '')
    .replace(/ workspace-header-brand/, '')
    .replace(/<section class="workspace-nav-group" data-darstellung-wahl[\s\S]*?<\/section>/, '')
    .replace(/ data-mitte=""/, '')
}

describe('KopfLeiste – ein Baustein für beide Kopfzeilen', () => {
  const oeffentlich = rendern('oeffentlich')
  const arbeitsbereich = rendern('arbeitsbereich')

  test('beide Varianten rendern dieselbe Struktur: Menü, Marke, Reise planen, Kontomenü', () => {
    for (const html of [oeffentlich, arbeitsbereich]) {
      assert.match(html, /<header[^>]*class="kopf /)
      assert.match(html, /<button[^>]*aria-label="Menü"[^>]*aria-controls="ziel-menue"[^>]*class="kopf-menue /)
      assert.match(html, /<a aria-label="Jetnity Startseite" class="kopf-marke[^"]*" href="\/">/)
      assert.match(html, /src="\/brand\/jetnity-logo\.png"/)
      assert.match(html, /<a class="kopf-planen workspace-button workspace-primary" href="\/planen">[\s\S]*?<span>Reise planen<\/span><\/a>/)
      assert.match(html, /<summary class="kopf-profil" aria-label="Kontomenü"/)
    }
  })

  test('ausser den Varianten-Merkmalen und der Darstellungswahl sind die Zeilen identisch', () => {
    assert.equal(ohneVariante(oeffentlich), ohneVariante(arbeitsbereich))
  })

  test('die Variante steht als Attribut und Klasse: öffentlich schaltet das Menü ab 48 rem aus, Arbeitsbereich ab 64 rem', () => {
    assert.match(oeffentlich, /data-kopf-variante="oeffentlich"/)
    assert.match(oeffentlich, /class="kopf kopf-oeffentlich"/)
    assert.match(oeffentlich, /class="kopf-menue kopf-menue-oeffentlich"/)
    assert.match(arbeitsbereich, /data-kopf-variante="arbeitsbereich"/)
    assert.match(arbeitsbereich, /class="kopf workspace-header"/)
    assert.match(arbeitsbereich, /class="kopf-menue workspace-menu-button"/)
    assert.match(arbeitsbereich, /class="kopf-marke workspace-header-brand"/)
  })

  test('Menü-Symbol: öffentlich wechselt zu «Schliessen», Arbeitsbereich öffnet nur', () => {
    const offen = (variante: KopfVariante) =>
      renderToStaticMarkup(
        createElement(KopfLeiste, { variante, menue: { offen: true, steuert: 'x', onKlick: () => undefined } }),
      )
    assert.match(offen('oeffentlich'), /aria-expanded="true"[^>]*>\s*<svg[^>]*lucide-x /)
    assert.match(offen('arbeitsbereich'), /aria-expanded="true"[^>]*>\s*<svg[^>]*lucide-menu /)
  })

  test('Slots: mitte, aktionen und darunter erscheinen an ihrem Platz', () => {
    const html = rendern('oeffentlich', {
      mitte: createElement('nav', { id: 'slot-mitte' }, 'M'),
      aktionen: createElement('div', { id: 'slot-aktionen' }, 'A'),
      darunter: createElement('div', { id: 'slot-darunter' }, 'D'),
    })
    const stelle = (id: string) => html.indexOf(`id="${id}"`)
    assert.ok(stelle('slot-mitte') > html.indexOf('class="kopf-links"'))
    assert.ok(stelle('slot-mitte') < html.indexOf('class="kopf-rechts"'))
    assert.ok(stelle('slot-aktionen') > html.indexOf('class="kopf-rechts"'))
    assert.ok(stelle('slot-aktionen') < html.indexOf('class="kopf-planen'))
    assert.ok(stelle('slot-darunter') > html.indexOf('</div></div>'))
    assert.match(html, /data-mitte=""/)
    assert.doesNotMatch(rendern('arbeitsbereich'), /data-mitte/)
  })

  test('inert wird an die Kopfzeile gereicht (offene Seitenleiste macht sie inert)', () => {
    assert.match(rendern('arbeitsbereich', { inert: true }), /<header[^>]*inert=""/)
    assert.doesNotMatch(rendern('arbeitsbereich', { inert: false }), /<header[^>]*inert/)
  })
})

describe('KopfLeiste – Darstellungswahl im Menü', () => {
  test('öffentlich: im Kontomenü, mit Hinweis, wo die Wahl gilt', () => {
    const html = rendern('oeffentlich')
    assert.match(html, /<section class="workspace-nav-group" data-darstellung-wahl="true">/)
    assert.match(html, /<div role="group" aria-label="Darstellung"/)
    assert.match(html, /<span class="workspace-nav-label">Hell<\/span>/)
    assert.match(html, /<span class="workspace-nav-label">Dunkel<\/span>/)
    assert.match(html, /Gilt für Planung, Reisen und Konto\. Öffentliche Seiten bleiben hell\./)
  })

  test('Arbeitsbereich: das Kontomenü dupliziert die Wahl nicht, sie bleibt in der Seitenleiste', () => {
    assert.doesNotMatch(rendern('arbeitsbereich'), /data-darstellung-wahl/)
    const shell = readFileSync('components/workspace/WorkspaceShell.tsx', 'utf8')
    assert.match(shell, /<DarstellungWahl theme=\{theme\} onWahl=\{setTheme\} \/>/)
  })
})

describe('KopfLeiste – Grenzen des Bausteins', () => {
  const baustein = readFileSync('components/layout/KopfLeiste.tsx', 'utf8')
  const navbar = readFileSync('components/layout/PublicNavbar.tsx', 'utf8')
  const shell = readFileSync('components/workspace/WorkspaceShell.tsx', 'utf8')

  test('der Baustein trägt weder Sitzung noch Abmelden noch eine eigene Navigation', () => {
    assert.doesNotMatch(baustein, /signOut|getSession|onAuthStateChange|createBrowserClient|usePathname|HAUPTNAVIGATION/)
  })

  test('beide Kopfzeilen sind Verwendungen des Bausteins und bringen kein eigenes header-Markup mit', () => {
    assert.match(navbar, /<KopfLeiste\s+variante="oeffentlich"/)
    assert.match(shell, /<KopfLeiste\s+variante="arbeitsbereich"/)
    assert.doesNotMatch(navbar, /<header/)
    assert.doesNotMatch(shell, /<header/)
    assert.doesNotMatch(navbar, /jetnity-logo\.png/)
    assert.doesNotMatch(navbar + shell, /WorkspaceAccountMenu/)
  })

  test('Auth-Wege bleiben in der öffentlichen Leiste: Sitzung, Abmelden, Nachlesen', () => {
    assert.match(navbar, /signOutAction/)
    assert.match(navbar, /GlobalesAbmeldenForm/)
    assert.match(navbar, /onAuthStateChange/)
  })
})

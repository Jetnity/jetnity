import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

// Premium-Redesign PR A, Work-Nachtest 27.11.2026: Der Filter «Alle» (hell) stand mit 1,82 : 1 auf dunkelgrüner Fläche,
// weil die Themenabbildung der Shell (white-mint.css) `text-ink-700` in der hellen Shell umfärbt und gegen die
// Zustandsvariante `aria-pressed:text-white` gewinnt, während `bg-brand-800` stehen blieb. Diese Tests halten fest:
//   1. Auswahlfelder tragen ihr Farbpaar aus der zentralen Klasse `.jet-wahl`, nicht aus Paletten-Utilities mit Zustandsvariante.
//   2. Die Farbpaare der zentralen Klasse erreichen in beiden Themen 4,5 : 1 (Text) und die Kontur 3 : 1.
//   3. Die Auswahl zeigt mehr als Farbe (Häkchen) und bleibt im Kontrastmodus sichtbar.

const lesen = (pfad: string) => readFileSync(pfad, 'utf8')
const globals = lesen('styles/globals.css')
const weissMint = lesen('styles/white-mint.css')
const flaechen = lesen('components/workspace/workspace-surfaces.css')

type Farbe = readonly [number, number, number]

function hex(wert: string): Farbe {
  const m = wert.trim().match(/^#([0-9a-f]{6})$/i)
  assert.ok(m, `Hex-Farbe erwartet: ${wert}`)
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as unknown as Farbe
}

function kanaele(wert: string): Farbe {
  const m = wert.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/)
  assert.ok(m, `RGB-Kanäle erwartet: ${wert}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function leuchtdichte([r, g, b]: Farbe): number {
  const l = [r, g, b].map((k) => {
    const v = k / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
}

function kontrast(a: Farbe, b: Farbe): number {
  const la = leuchtdichte(a)
  const lb = leuchtdichte(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function wertAus(quelle: string, name: string): string {
  const m = quelle.match(new RegExp(`${name}:\\s*([^;]+);`))
  assert.ok(m, `Token ${name} fehlt`)
  return m[1].trim()
}

/** Token der Palette (`--jet-…: r g b`) aus globals.css, auch wenn ein semantisches Token darauf zeigt. */
function palette(name: string): Farbe {
  return kanaele(wertAus(globals, `--jet-${name}`))
}

function semantisch(block: string, name: string): Farbe {
  const wert = wertAus(block, name)
  const verweis = wert.match(/^var\(--jet-([a-z0-9-]+)\)$/)
  return verweis ? palette(verweis[1]) : kanaele(wert)
}

function block(quelle: string, kopf: string): string {
  const start = quelle.indexOf(kopf)
  assert.ok(start >= 0, `Block fehlt: ${kopf}`)
  return quelle.slice(start, quelle.indexOf('}', start))
}

test('Auswahlfeld hell: Farbpaare der Klasse .jet-wahl erreichen 4,5 : 1 und die Kontur 3 : 1', () => {
  const hell = block(weissMint, '[data-white-mint="home"],\n.workspace-shell[data-workspace-theme="light"] {')
  const karte = kanaele(wertAus(hell, '--card'))
  const gedaempft = kanaele(wertAus(hell, '--muted'))
  const text = kanaele(wertAus(hell, '--muted-foreground'))
  const primaer = semantisch(globals, '--primary')
  const primaerText = semantisch(globals, '--primary-foreground')
  const kante = hex(wertAus(weissMint, '--white-mint-control'))
  assert.ok(kontrast(text, karte) >= 4.5, 'ungewählt auf Karte')
  assert.ok(kontrast(text, gedaempft) >= 4.5, 'ungewählt beim Zeigen')
  assert.ok(kontrast(primaerText, primaer) >= 4.5, 'gewählt')
  assert.ok(kontrast(primaer, karte) >= 3, 'gewählte Fläche gegen Karte (nicht nur Farbe)')
  assert.ok(kontrast(kante, karte) >= 3, 'Kontur gegen Karte')
  assert.match(hell, /--steuerkante: var\(--white-mint-control\)/)
})

test('Auswahlfeld dunkel: Farbpaare und Kontur erreichen die Grenzen auf Panel, Grund und Weich', () => {
  const dunkel = block(flaechen, 'html[data-workspace-theme="dark"] .workspace-shell,')
  const panel = hex(wertAus(dunkel, '--workspace-panel'))
  const grund = hex(wertAus(dunkel, '--workspace-bg'))
  const weich = hex(wertAus(dunkel, '--workspace-soft'))
  const karte = kanaele(wertAus(dunkel, '--card'))
  const gedaempft = kanaele(wertAus(dunkel, '--muted'))
  const text = kanaele(wertAus(dunkel, '--muted-foreground'))
  const primaer = kanaele(wertAus(dunkel, '--primary'))
  const primaerText = kanaele(wertAus(dunkel, '--primary-foreground'))
  const kante = hex(wertAus(dunkel, '--workspace-control'))
  assert.ok(kontrast(text, karte) >= 4.5, 'ungewählt auf Karte')
  assert.ok(kontrast(text, gedaempft) >= 4.5, 'ungewählt beim Zeigen')
  assert.ok(kontrast(primaerText, primaer) >= 4.5, 'gewählt')
  assert.ok(kontrast(primaer, panel) >= 3, 'gewählte Fläche gegen Panel (nicht nur Farbe)')
  for (const [name, flaeche] of [['Panel', panel], ['Grund', grund], ['Weich', weich]] as const) {
    assert.ok(kontrast(kante, flaeche) >= 3, `Kontur gegen ${name}`)
  }
  assert.deepEqual(kanaele(wertAus(dunkel, '--input')), [...kante], 'Eingabekontur nimmt die Steuerkante')
  assert.match(dunkel, /--steuerkante: var\(--workspace-control\)/)
})

test('Zentrale Klasse .jet-wahl: semantisches Paar je Zustand, Häkchen, Kontrastmodus, keine Paletten-Utilities', () => {
  const klasse = globals.slice(globals.indexOf('.jet-wahl {')).replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(klasse, /--wahl-text: rgb\(var\(--muted-foreground\)\)/)
  assert.match(klasse, /--wahl-grund: rgb\(var\(--primary\)\)/)
  assert.match(klasse, /--wahl-text: rgb\(var\(--primary-foreground\)\)/)
  assert.match(klasse, /\[aria-pressed="true"\], \[aria-selected="true"\], \[aria-checked="true"\], \[aria-current\]:not\(\[aria-current="false"\]\)\)::before/)
  assert.match(klasse, /border-left: 0\.14em solid currentColor/)
  assert.match(klasse, /@media \(forced-colors: active\)/)
  assert.match(klasse, /--wahl-grund: Highlight/)
  assert.doesNotMatch(klasse, /text-ink-|text-brand-|bg-brand-|bg-white|!important/, 'Regeln ohne Paletten-Utilities und ohne !important')
})

function dateien(ordner: string): string[] {
  const liste: string[] = []
  for (const name of readdirSync(ordner)) {
    const pfad = join(ordner, name)
    if (statSync(pfad).isDirectory()) liste.push(...dateien(pfad))
    else if (pfad.endsWith('.tsx')) liste.push(pfad)
  }
  return liste
}

test('Zustandsvarianten färben nur mit semantischen Tokens, nie mit Paletten-Utilities der Themenabbildung', () => {
  const verboten = /aria-(?:(?:pressed|selected|checked|current)|\[(?:pressed|selected|checked|current)(?:=[a-z]+)?\]):(?:bg|text|border)-(?:white|black|brand|ink|surface|line|citrus|night|danger|red|green|emerald|amber)(?:-|\b)/g
  const treffer: string[] = []
  for (const datei of [...dateien('components'), ...dateien('app')]) {
    const inhalt = lesen(datei)
    for (const m of inhalt.matchAll(verboten)) treffer.push(`${datei}: ${m[0]}`)
  }
  assert.deepEqual(treffer, [], 'Die helle Shell färbt text-brand-/text-ink- um, die dunkle bg-white/bg-surface-: ein Variantenstil wie aria-pressed:text-white verliert dagegen. Auswahlfelder nutzen jet-wahl.')
})

test('Die Auswahlfelder von Meine Reisen, Einreise, Karte und 12Go nutzen die zentrale Klasse', () => {
  for (const datei of [
    'components/trips/MyTripsCollection.tsx',
    'components/readiness/EinreiseLaenderpruefer.tsx',
    'components/trips/reisekarte/ParisKartenSuche.tsx',
    'components/trips/TwelveGoTimetable.tsx',
  ]) {
    assert.match(lesen(datei), /className="jet-wahl[ "]/, datei)
  }
  const sammlung = lesen('components/trips/MyTripsCollection.tsx')
  assert.match(sammlung, /aria-pressed=\{auswahl === eintrag\.wert\}/, 'programmatische Auswahl bleibt')
  assert.match(sammlung, /min-h-11/, 'Mindestgrösse 44 px bleibt')
})

test('Fokus: zweifarbiger Ring in der hellen Shell, Reisekopf-Regeln gewinnen gegen die allgemeine Regel', () => {
  assert.match(weissMint, /\.workspace-shell\[data-workspace-theme="light"\] :where\(a, button, summary, input, select, textarea\):focus-visible \{\s*outline: 3px solid var\(--white-mint-ink\);\s*outline-offset: 3px;\s*box-shadow: 0 0 0 6px var\(--white-mint-focus-halo\);/)
  assert.match(flaechen, /\.workspace-content \.bildnachweis-knopf:focus-visible \{[^}]*outline: 3px solid #e8fa91/)
  assert.doesNotMatch(flaechen, /^\.bildnachweis-knopf:focus-visible/m)
})

test('Schriftgrösse und Hydration: Kopfzeile über dem Reisekopf, Ring der Navigation, dunkle Tinte auf Limette vor der Hydration', () => {
  const kopfzeile = lesen('components/workspace/workspace.css')
  assert.match(kopfzeile, /\.workspace-header\[data-flow="true"\] \{ position: relative; \}/)
  assert.doesNotMatch(kopfzeile, /\.workspace-header\[data-flow="true"\] \{ position: static; \}/)
  assert.match(flaechen, /:where\(\[data-workspace-theme="dark"\]\) :where\(\.workspace-nav-link, \.workspace-open-trip\):focus-visible \{\s*outline-offset: 1px;/)
  const spiegel = /html\[data-workspace-theme="dark"\] \.workspace-shell\[data-workspace-theme="light"\] \.workspace-content :is\(\.bg-citrus-400, \.bg-citrus-400\\\/55\)(?:,|\s*\{)/
  assert.match(flaechen, spiegel)
  const textRegel = flaechen.indexOf('.workspace-content :is(.text-brand-600, .text-brand-700')
  const limette = flaechen.search(spiegel)
  assert.ok(textRegel >= 0 && limette > textRegel, 'Die Limetten-Regel muss nach der Text-Spiegelung stehen, damit sie bei gleichem Gewicht gewinnt')
})

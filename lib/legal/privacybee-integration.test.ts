// lib/legal/privacybee-integration.test.ts
//
// Host lock, reviewed activation, vendor DOM signals, fallback markup and
// route boundaries for PrivacyBee integration 1. No request to PrivacyBee.

import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PrivacyBeeAnsicht } from '@/components/legal/PrivacyBeeEinbettung'
import { SITEMAP_OEFFENTLICHE_PFADE } from '@/lib/seo/index-grenze'
import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'
import {
  PRIVACYBEE_BEREITSCHAFT_MS,
  PRIVACYBEE_DATENSCHUTZ_SKRIPT,
  PRIVACYBEE_DATENSCHUTZ_URL,
  PRIVACYBEE_ELEMENT,
  PRIVACYBEE_FEHLER_TEXT,
  PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG,
  PRIVACYBEE_IMPRESSUM_SKRIPT,
  PRIVACYBEE_KONTAKT,
  PRIVACYBEE_KILL_SWITCH_AUS,
  PRIVACYBEE_LADE_TEXT,
  PRIVACYBEE_LIZENZ_HOST,
  PRIVACYBEE_WEBSITE_ID,
  hostnameAusHostHeader,
  browserHostIstLizenziert,
  hostIstLizenziert,
  privacyBeeDomSignal,
  privacyBeeEinbettungErlaubt,
  privacyBeeAktivierungWirksam,
  skriptEinfuegen,
  type PrivacyBeeDomSchnappschuss,
  type PrivacyBeeFlaeche,
  type SkriptLage,
} from '@/lib/legal/privacybee-vertrag'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function dateienSammeln(verzeichnis: string, gefunden: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    if (eintrag.name === 'node_modules' || eintrag.name.startsWith('.')) continue
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) {
      dateienSammeln(pfad, gefunden)
      continue
    }
    if (/\.(ts|tsx|js|mjs)$/.test(eintrag.name) && !eintrag.name.endsWith('.test.ts')) {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

const leer: PrivacyBeeDomSchnappschuss = {
  text: '',
  ueberschriften: [],
  hatDatenschutzFehlerAbsatz: false,
  hatImpressumFehlerAbsatz: false,
}

describe('PrivacyBee Host und Aktivierung', () => {
  test('geprüfte Aktivierung ist an; fehlender Kill-Switch lässt sie gelten', () => {
    assert.equal(PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG, true)
    assert.equal(privacyBeeAktivierungWirksam(undefined), true)
    assert.equal(privacyBeeAktivierungWirksam(null), true)
    assert.equal(privacyBeeAktivierungWirksam(''), true)
    assert.equal(privacyBeeAktivierungWirksam('true'), true)
  })

  test('nur der exakte Kill-Switch-Wert aus schaltet ab', () => {
    assert.equal(privacyBeeAktivierungWirksam(PRIVACYBEE_KILL_SWITCH_AUS), false)
    assert.equal(privacyBeeAktivierungWirksam(' aus '), false)
    assert.equal(privacyBeeAktivierungWirksam('AUS'), true)
    assert.equal(privacyBeeAktivierungWirksam(undefined, false), false)
    assert.equal(privacyBeeAktivierungWirksam(null, false), false)
  })

  test('Scripts nur auf exakt jetnity.com', () => {
    const erlaubt = [
      'jetnity.com',
      'JETNITY.COM',
      'jetnity.com:443',
      ' jetnity.com ',
    ]
    const verboten = [
      null,
      '',
      'www.jetnity.com',
      'localhost',
      'localhost:3000',
      '127.0.0.1:3000',
      'jetnity-app.vercel.app',
      'jetnity-app-git-feat.vercel.app',
      'preview.example.com',
      'jetnity.com.evil.com',
      'eviljetnity.com',
      'notjetnity.com',
      'jetnity.ch',
      'jetnity.com.',
      'https://jetnity.com',
      'jetnity.com/privacy',
      'user@jetnity.com',
      '[::1]',
    ]
    for (const host of erlaubt) {
      assert.equal(hostIstLizenziert(host), true, host)
      assert.equal(
        privacyBeeEinbettungErlaubt({ hostHeader: host, killSwitch: undefined }),
        true,
        host,
      )
    }
    for (const host of verboten) {
      assert.equal(hostIstLizenziert(host), false, String(host))
      assert.equal(
        privacyBeeEinbettungErlaubt({ hostHeader: host, killSwitch: undefined }),
        false,
        String(host),
      )
    }
    assert.equal(hostnameAusHostHeader('jetnity.com:443'), PRIVACYBEE_LIZENZ_HOST)
    assert.equal(browserHostIstLizenziert('jetnity.com'), true)
    assert.equal(browserHostIstLizenziert('www.jetnity.com'), false)
    assert.equal(browserHostIstLizenziert('localhost'), false)
    assert.equal(
      privacyBeeEinbettungErlaubt({ hostHeader: 'jetnity.com', killSwitch: 'aus' }),
      false,
    )
  })

  test('Remount fügt das offizielle Script nicht ein zweites Mal ein', () => {
    const lage: SkriptLage = { elementDefiniert: false, skriptVorhanden: false }
    assert.equal(skriptEinfuegen(lage), true)
    lage.skriptVorhanden = true
    assert.equal(skriptEinfuegen(lage), false)
    lage.skriptVorhanden = false
    lage.elementDefiniert = true
    assert.equal(skriptEinfuegen(lage), false)
    lage.elementDefiniert = true
    lage.skriptVorhanden = true
    assert.equal(skriptEinfuegen(lage), false)
  })
})

describe('PrivacyBee Vendor-DOM-Signale', () => {
  test('Loading und leeres Element sind kein Erfolg', () => {
    assert.equal(privacyBeeDomSignal('datenschutz', { ...leer, text: PRIVACYBEE_LADE_TEXT.datenschutz }), 'laden')
    assert.equal(privacyBeeDomSignal('impressum', { ...leer, text: PRIVACYBEE_LADE_TEXT.impressum }), 'laden')
    assert.equal(privacyBeeDomSignal('datenschutz', leer), 'leer')
    assert.equal(privacyBeeDomSignal('impressum', leer), 'leer')
    assert.equal(privacyBeeDomSignal('datenschutz', { ...leer, text: '   ' }), 'leer')
  })

  test('bekannte Vendor-Fehler und leerer Fehlerabsatz sind Fehler', () => {
    assert.equal(
      privacyBeeDomSignal('datenschutz', {
        ...leer,
        text: PRIVACYBEE_FEHLER_TEXT.datenschutz[1] ?? '',
      }),
      'fehler',
    )
    assert.equal(
      privacyBeeDomSignal('datenschutz', {
        ...leer,
        text: 'Es gab ein Problem beim Laden der Datenschutzerklärung, bitte versuchen Sie es später nochmals',
      }),
      'fehler',
    )
    assert.equal(
      privacyBeeDomSignal('datenschutz', {
        ...leer,
        hatDatenschutzFehlerAbsatz: true,
        text: 'Unbekannter Vendor-Fehler',
      }),
      'fehler',
    )
    assert.equal(
      privacyBeeDomSignal('impressum', {
        ...leer,
        text: 'Fehler beim Laden des Impressums Impressum konnte nicht geladen werden',
        ueberschriften: ['Fehler beim Laden des Impressums'],
        hatImpressumFehlerAbsatz: true,
      }),
      'fehler',
    )
    assert.equal(
      privacyBeeDomSignal('impressum', {
        ...leer,
        hatImpressumFehlerAbsatz: true,
        text: 'Netzwerkfehler ohne Überschrift',
      }),
      'fehler',
    )
  })

  test('Vendor-Überschrift gilt als bereit, Script-onload ersetzt das nicht', () => {
    assert.equal(
      privacyBeeDomSignal('datenschutz', {
        ...leer,
        text: 'Datenschutzerklärung für jetnity.com. Langer Vendor-Text.',
        ueberschriften: ['Datenschutzerklärung'],
      }),
      'bereit',
    )
    assert.equal(
      privacyBeeDomSignal('impressum', {
        ...leer,
        text: 'Impressum Jetnity',
        ueberschriften: ['Impressum'],
      }),
      'bereit',
    )
    const lang = 'a'.repeat(240)
    assert.equal(privacyBeeDomSignal('datenschutz', { ...leer, text: lang }), 'bereit')
    assert.equal(privacyBeeDomSignal('datenschutz', { ...leer, text: 'kurz' }), 'laden')
  })
})

function enthaeltHref(html: string, url: string): boolean {
  return html.includes(url.replaceAll('&', '&amp;'))
}

function markup(flaeche: PrivacyBeeFlaeche, props: Partial<Parameters<typeof PrivacyBeeAnsicht>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(PrivacyBeeAnsicht, {
      flaeche,
      einbetten: false,
      phase: 'aus',
      vendorHatUeberschrift: false,
      ...props,
    }),
  )
}

describe('PrivacyBee Oberfläche', () => {
  test('ohne Lizenzhost kein Script, kein Vendor-Element, ehrlicher Fallback', () => {
    const privacy = markup('datenschutz')
    const impressum = markup('impressum')
    assert.equal(privacy.includes(PRIVACYBEE_DATENSCHUTZ_SKRIPT), false)
    assert.equal(privacy.includes(PRIVACYBEE_IMPRESSUM_SKRIPT), false)
    assert.equal(privacy.includes('<privacybee-widget'), false)
    assert.equal(enthaeltHref(privacy, PRIVACYBEE_DATENSCHUTZ_URL), true)
    assert.equal(privacy.includes('übernimmt die Datenschutzerklärung nicht'), true)
    assert.equal(privacy.includes('<h1'), true)
    assert.equal(impressum.includes('<imprint-widget'), false)
    assert.equal(impressum.includes(`mailto:${PRIVACYBEE_KONTAKT}`), true)
    assert.equal(impressum.includes('gerade nicht verfügbar'), true)
    assert.equal(privacy.includes('cookie-banner'), false)
    assert.equal(impressum.includes('cookie-banner'), false)
  })

  test('Lizenzhost zeigt das Vendor-Element ohne Script und den noscript-Fallback', () => {
    const slotRef = createRef<HTMLElement>()
    const html = markup('datenschutz', { einbetten: true, phase: 'laden', slotRef })
    assert.equal(html.includes('<noscript>'), true)
    assert.equal(enthaeltHref(html, PRIVACYBEE_DATENSCHUTZ_URL), true)
    assert.equal(html.includes('<privacybee-widget'), true)
    assert.equal(html.includes(PRIVACYBEE_DATENSCHUTZ_SKRIPT), false)
    assert.equal(html.includes('wird geladen'), true)
    const sichtbar = html.replace(/<noscript>[\s\S]*<\/noscript>/, '')
    assert.equal(sichtbar.includes('data-privacybee-fallback'), false)
    assert.match(html, /<h1[^>]*>Datenschutzerklärung<\/h1>/)
  })

  test('Laden, Fehler und bereit trennen Überschrift, Fallback und Vendor-Attribute', () => {
    const slotRef = createRef<HTMLElement>()
    const laden = markup('datenschutz', {
      einbetten: true,
      phase: 'laden',
      slotRef,
    })
    assert.equal(laden.includes('wird geladen'), true)
    assert.equal(laden.includes(`website-id="${PRIVACYBEE_WEBSITE_ID}"`), true)
    assert.equal(laden.includes('type="dsgvo"'), true)
    assert.equal(laden.includes('lang="de"'), true)
    assert.equal(laden.includes('<privacybee-widget'), true)
    assert.equal(laden.includes(PRIVACYBEE_DATENSCHUTZ_SKRIPT), false)
    const sichtbar = laden.replace(/<noscript>[\s\S]*<\/noscript>/, '')
    assert.equal(sichtbar.includes(PRIVACYBEE_DATENSCHUTZ_URL), false)

    const fehler = markup('impressum', {
      einbetten: true,
      phase: 'fehler',
      vendorHatUeberschrift: true,
      slotRef,
    })
    assert.equal(fehler.includes('<h1'), false)
    assert.equal(fehler.includes('konnte hier nicht angezeigt werden'), true)
    assert.equal(fehler.includes(`mailto:${PRIVACYBEE_KONTAKT}`), true)
    assert.equal(fehler.includes('<imprint-widget'), true)
    assert.equal(fehler.includes('type="dsgvo"'), false)

    const bereit = markup('datenschutz', {
      einbetten: true,
      phase: 'bereit',
      vendorHatUeberschrift: true,
      slotRef,
    })
    assert.equal(bereit.includes('<h1'), false)
    assert.equal(bereit.includes('<privacybee-widget'), true)
    const bereitSichtbar = bereit.replace(/<noscript>[\s\S]*<\/noscript>/, '')
    assert.equal(bereitSichtbar.includes('data-privacybee-fallback'), false)
  })

  test('Einbettung prüft den Browser-Host und die Bereitschaftsgrenze, bevor sie lädt', () => {
    const text = quelle('components/legal/PrivacyBeeEinbettung.tsx')
    assert.equal(text.includes('browserHostIstLizenziert'), true)
    assert.equal(text.includes('skriptEinfuegen'), true)
    assert.equal(text.includes('privacyBeeDomSignal'), true)
    assert.equal(text.includes('PRIVACYBEE_BEREITSCHAFT_MS'), true)
    assert.equal(text.includes('cookie-banner'), false)
    assert.equal(PRIVACYBEE_BEREITSCHAFT_MS >= 8_000, true)
    assert.equal(PRIVACYBEE_ELEMENT.datenschutz, 'privacybee-widget')
    assert.equal(PRIVACYBEE_ELEMENT.impressum, 'imprint-widget')
  })
})

describe('PrivacyBee Routengrenze', () => {
  test('Seiten, Canonical, noindex und kein Banner', () => {
    for (const [pfad, titel, pfadEnde] of [
      ['app/(public)/privacy/page.tsx', 'Datenschutzerklärung', '/privacy'],
      ['app/(public)/impressum/page.tsx', 'Impressum', '/impressum'],
    ] as const) {
      const text = quelle(pfad)
      assert.equal(existsSync(join(wurzel, pfad)), true)
      assert.equal(text.includes(`title: '${titel}'`), true)
      assert.equal(text.includes(`\${KANONISCHE_PUBLIC_ORIGIN}${pfadEnde}`), true)
      assert.equal(`${KANONISCHE_PUBLIC_ORIGIN}${pfadEnde}`, `https://jetnity.com${pfadEnde}`)
      assert.equal(text.includes('index: false'), true)
      assert.equal(text.includes('follow: false'), true)
      assert.equal(text.includes("dynamic = 'force-dynamic'"), true)
      assert.equal(text.includes('cookie-banner'), false)
      assert.equal(text.includes('app.privacybee.io'), false)
    }
    assert.equal(existsSync(join(wurzel, 'app/(public)/terms/page.tsx')), true)
    assert.equal(existsSync(join(wurzel, 'app/(public)/datenschutz/page.tsx')), false)
    assert.deepEqual([...SITEMAP_OEFFENTLICHE_PFADE], ['/', '/planen'])
  })

  test('Vendor-URLs bleiben auf die Legal-Module begrenzt', () => {
    const treffer: string[] = []
    const einbettung: string[] = []
    for (const datei of ['app', 'components', 'lib'].flatMap((name) => dateienSammeln(join(wurzel, name)))) {
      const relativ = relative(wurzel, datei).replaceAll('\\', '/')
      const text = readFileSync(datei, 'utf8')
      if (text.includes('app.privacybee.io') || text.includes('cookie-banner.js')) {
        treffer.push(relativ)
      }
      if (text.includes("from '@/components/legal/PrivacyBeeEinbettung'")) {
        einbettung.push(relativ)
      }
    }
    assert.deepEqual(treffer, ['lib/legal/privacybee-vertrag.ts'])
    assert.deepEqual(einbettung.sort(), [
      'app/(public)/impressum/page.tsx',
      'app/(public)/privacy/page.tsx',
    ])
    const footer = quelle('components/layout/Footer.tsx')
    assert.equal(footer.includes('href="/privacy"'), true)
    assert.equal(footer.includes('href="/impressum"'), true)
    assert.equal(footer.includes('href="/terms"'), true)
    assert.equal(quelle('app/robots.ts').includes('app.privacybee.io'), false)
  })
})

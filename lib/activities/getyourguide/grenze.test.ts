import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../../..')

function quelle(name: string): string {
  return readFileSync(join(wurzel, name), 'utf8')
}

describe('GetYourGuide-Grenze', () => {
  test('der Elternbereich lädt kein Anbieterskript und bestätigt nur das Ziel', () => {
    const flaeche = quelle('components/trips/GetYourGuideAktivitaeten.tsx')
    const bereich = quelle('components/trips/AktivitaetenBereich.tsx')
    const layouts = [
      'app/layout.tsx',
      'app/(public)/layout.tsx',
      'app/account/layout.tsx',
      'app/(admin)/layout.tsx',
      'app/(admin)/admin/layout.tsx',
    ].map(quelle)
    for (const text of [flaeche, bereich, ...layouts]) {
      assert.equal(text.includes('pa.umd.production.min.js'), false)
      assert.equal(text.includes('widget.getyourguide.com'), false)
    }
    for (const text of [flaeche, bereich]) {
      assert.equal(text.includes('localStorage'), false)
      assert.equal(text.includes('sessionStorage'), false)
      assert.equal(text.includes('document.cookie'), false)
    }
    assert.equal(flaeche.includes('dangerouslySetInnerHTML'), false)
    assert.equal(flaeche.includes('ortBestaetigen(id, \'ziel\')'), true)
    assert.equal(flaeche.includes('process.env'), false)
    assert.equal(flaeche.includes('NEXT_PUBLIC'), false)
    assert.equal(bereich.includes('GetYourGuidePruefFlaeche'), false)
    assert.equal(bereich.includes('activitySucheVomClient'), true)
    assert.equal(bereich.includes('Jetnity empfiehlt'), false)
    assert.equal(quelle('lib/activities/getyourguide/kontext.ts').includes('.region'), false)
    assert.equal(quelle('lib/activities/getyourguide/kontext.ts').includes('oeffentlichenBezugBauen'), false)
  })

  test('Analyzer und Partner bleiben im Einbettungsdokument fest', () => {
    const dokument = quelle('lib/activities/getyourguide/dokument.ts')
    const route = quelle('app/embed/getyourguide/route.ts')
    assert.match(dokument, /https:\/\/widget\.getyourguide\.com\/dist\/pa\.umd\.production\.min\.js/)
    assert.match(dokument, /2MQHT6Z/)
    assert.equal(dokument.includes('allow-same-origin'), false)
    assert.match(quelle('lib/activities/getyourguide/renderer.ts'), /credentialless/)
    assert.equal(route.includes('cookies('), false)
    assert.equal(route.includes('createServer'), false)
    assert.match(route, /embedAntwort/)
    const datenschutz = quelle('app/(public)/privacy/page.tsx')
    assert.equal(datenschutz.includes('pa.umd.production.min.js'), false)
    assert.match(datenschutz, /Datenschutzhinweise von GetYourGuide/)
    assert.equal(datenschutz.includes('zertifiziert'), false)
  })
})
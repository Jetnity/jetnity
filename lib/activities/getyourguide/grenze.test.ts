import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(name: string): string {
  return readFileSync(join(hier, name), 'utf8')
}

describe('GetYourGuide-Grenze', () => {
  test('Anwendungscode ruft keinen Anbieter, kein Markup und keine Ortsbestätigung auf', () => {
    const text = [
      quelle('freigabe.ts'),
      quelle('widget.ts'),
      quelle('kontext.ts'),
      quelle('lebenszyklus.ts'),
      quelle('aufloesung.ts'),
      readFileSync(join(hier, '../../../components/trips/GetYourGuideAktivitaeten.tsx'), 'utf8'),
      readFileSync(join(hier, '../../../components/trips/AktivitaetenBereich.tsx'), 'utf8'),
    ].join('\n')
    for (const verboten of [
      'ortBestaetigen',
      'dangerouslySetInnerHTML',
      'getyourguide.com',
      'localStorage',
      'sessionStorage',
      'document.cookie',
      'process.env',
      'NEXT_PUBLIC',
      'Jetnity empfiehlt',
      'partner2MQHT6Z',
    ]) {
      assert.equal(text.includes(verboten), false, verboten)
    }
    const bereich = readFileSync(join(hier, '../../../components/trips/AktivitaetenBereich.tsx'), 'utf8')
    assert.equal(bereich.includes('GetYourGuidePruefFlaeche'), false)
    assert.equal(bereich.includes('activitySucheVomClient'), true)
  })
})

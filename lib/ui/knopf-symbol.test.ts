import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

import { Button } from '@/components/ui/button'

const WURZEL = join(__dirname, '..', '..')

function tsxDateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name)
    if (statSync(pfad).isDirectory()) return name === 'node_modules' ? [] : tsxDateien(pfad)
    return pfad.endsWith('.tsx') ? [pfad] : []
  })
}

/**
 * `Button` legt seine Aufschrift in ein `span`. Ein Symbol als Kind landet mit
 * `svg { display: block }` aus Tailwinds Preflight über dem Text statt daneben.
 * Symbole gehören deshalb in `leftIcon`/`rightIcon` (DESIGN_SYSTEM 6.21).
 */
test('kein Button trägt ein Symbol als Kind neben der Aufschrift', () => {
  const funde: string[] = []
  for (const datei of [...tsxDateien(join(WURZEL, 'components')), ...tsxDateien(join(WURZEL, 'app'))]) {
    const text = readFileSync(datei, 'utf8')
    if (!text.includes("from '@/components/ui/button'")) continue
    const quelle = ts.createSourceFile(datei, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const besuchen = (knoten: ts.Node) => {
      if (ts.isJsxElement(knoten) && knoten.openingElement.tagName.getText() === 'Button') {
        const kinder = knoten.children.filter((kind) => !(ts.isJsxText(kind) && !kind.text.trim()))
        const symbol = kinder.some((kind) => {
          const element = ts.isJsxElement(kind) ? kind.openingElement : ts.isJsxSelfClosingElement(kind) ? kind : null
          return element !== null && /^[A-Z]/.test(element.tagName.getText())
        })
        if (symbol && kinder.length > 1) {
          const zeile = quelle.getLineAndCharacterOfPosition(knoten.getStart()).line + 1
          funde.push(`${relative(WURZEL, datei).split(sep).join('/')}:${zeile}`)
        }
      }
      ts.forEachChild(knoten, besuchen)
    }
    besuchen(quelle)
  }
  assert.deepEqual(funde, [], `Symbol in leftIcon/rightIcon verschieben: ${funde.join(', ')}`)
})

test('leftIcon steht in einem eigenen inline-flex-Rahmen vor der Aufschrift', () => {
  const html = renderToStaticMarkup(
    createElement(Button, { leftIcon: createElement('svg', { 'data-symbol': '' }) }, 'Speichern'),
  )
  assert.match(html, /<span class="mr-2 inline-flex"><svg data-symbol=""><\/svg><\/span><span>Speichern<\/span>/)
})

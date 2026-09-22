// lib/ui/checkbox-interaction.test.ts
//
// Structural lock for the registration consent checkbox. Hydrated
// pointer/keyboard proof lives in
// docs/evidence/registration-consent-interaction-1/interact.mjs.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Checkbox } from '@/components/ui/checkbox'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

describe('Checkbox consent interaction contract', () => {
  test('exposes one native checkbox and no custom role=checkbox', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { id: 'terms', defaultChecked: false }),
    )
    assert.equal((html.match(/type="checkbox"/g) || []).length, 1)
    assert.equal(html.includes('role="checkbox"'), false)
    assert.equal(html.includes('data-checkbox-hit'), true)
    assert.equal(html.includes('sr-only'), false)
    assert.equal(html.includes('id="terms"'), true)
    assert.equal(html.includes('opacity-0'), true)
  })

  test('uncontrolled markup starts from defaultChecked', () => {
    const unchecked = renderToStaticMarkup(
      createElement(Checkbox, { id: 'a', defaultChecked: false }),
    )
    const checked = renderToStaticMarkup(
      createElement(Checkbox, { id: 'b', defaultChecked: true }),
    )
    assert.equal(unchecked.includes('data-state="unchecked"'), true)
    assert.equal(checked.includes('data-state="checked"'), true)
  })

  test('controlled indeterminate renders mixed visual state', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { id: 'mixed', checked: 'indeterminate' }),
    )
    assert.equal(html.includes('data-state="indeterminate"'), true)
    assert.equal(html.includes('type="checkbox"'), true)
  })

  test('optional label uses a single htmlFor association', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { id: 'with-label', label: 'Mit Label-Text' }),
    )
    assert.equal(html.includes('for="with-label"'), true)
    assert.equal(html.includes('Mit Label-Text'), true)
    assert.equal(html.includes('role="checkbox"'), false)
  })
})

describe('RegisterForm consent wiring remains explicit', () => {
  const register = quelle('components/auth/RegisterForm.tsx')

  test('default consent stays unchecked and submit stays gated', () => {
    assert.equal(register.includes('const [accept, setAccept] = React.useState(false)'), true)
    assert.equal(register.includes('disabled={loading || !accept}'), true)
    assert.equal(register.includes("...(!accept ? { terms: 'Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.' } : {})"), true)
    assert.equal(register.includes('id="terms"'), true)
    assert.equal(register.includes('checked={accept}'), true)
  })

  test('legal links keep destinations and do not activate the label', () => {
    assert.equal(register.includes('href="/terms"'), true)
    assert.equal(register.includes('href="/privacy"'), true)
    assert.equal(register.includes('Nutzungsbedingungen'), true)
    assert.equal(register.includes('Datenschutzerklärung'), true)
    assert.equal(register.includes('event.stopPropagation()'), true)
  })
})

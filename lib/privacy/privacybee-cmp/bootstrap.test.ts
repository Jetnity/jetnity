import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'

import { buildBootstrapSource, productionBootstrapSource } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { CMP_BANNER_SRC } from '@/lib/privacy/privacybee-cmp/vertrag'

function ausfuehren(source: string, hostname: string) {
  const scripts: { src: string }[] = []
  const listeners: string[] = []
  const sandbox: Record<string, unknown> = {
    location: { hostname },
    __jetnityOptionalCalls: 0,
    __jetnityOptionalSawBanner: false,
    __jetnityOptionalStart() {
      sandbox.__jetnityOptionalCalls = Number(sandbox.__jetnityOptionalCalls) + 1
      sandbox.__jetnityOptionalSawBanner = scripts.length > 0
      sandbox.__jetnityListenersAtAttempt = listeners.length
      return true
    },
    document: {
      addEventListener(type: string) { listeners.push(type) },
      querySelector() { return null },
      createElement() {
        const el: { src: string; async: boolean; setAttribute: () => void } = {
          src: '',
          async: true,
          setAttribute() {},
        }
        return el
      },
      head: { appendChild(el: { src: string }) { scripts.push(el) } },
      documentElement: { appendChild(el: { src: string }) { scripts.push(el) } },
    },
  }
  sandbox.window = sandbox
  runInNewContext(source, sandbox)
  const root = sandbox.__jetnityCmp as {
    phase?: string
    scripts?: number
    booted?: number
    order?: string
    optionalAttempt?: string
    listeners?: number
  }
  return {
    scripts,
    listeners,
    root,
    calls: sandbox.__jetnityOptionalCalls,
    sawBanner: sandbox.__jetnityOptionalSawBanner,
    listenersAtAttempt: sandbox.__jetnityListenersAtAttempt,
  }
}

describe('cmp bootstrap ausfuehrung', () => {
  test('Freigabe wahr und Kill-Switch aus setzt auf jetnity.com kein Skript', () => {
    const text = buildBootstrapSource({ release: true, killDenied: true })
    const lauf = ausfuehren(text, 'jetnity.com')
    assert.equal(lauf.scripts.length, 0)
    assert.equal(lauf.root.phase, 'denied')
    assert.equal(lauf.listeners.includes('privacybee:ready'), true)
    assert.equal(lauf.calls, 1)
    assert.equal(lauf.root.optionalAttempt, 'blocked')
    assert.equal(lauf.root.order, 'listeners-before-optional')
    assert.equal(lauf.listenersAtAttempt, 2)
    assert.equal(lauf.sawBanner, false)
    assert.equal(text.includes('optionalAttempt="ran"'), false)
    assert.equal(text.includes('acceptAll'), false)
    assert.equal(text.indexOf('addEventListener') < text.indexOf('__jetnityOptionalStart'), true)
    assert.equal(text.indexOf('__jetnityOptionalStart') < text.indexOf('createElement'), true)
  })

  test('Freigabe falsch, Kill aus, und unlizenzierte Hosts bleiben ohne Skript', () => {
    assert.equal(ausfuehren(buildBootstrapSource({ release: false, killDenied: false }), 'jetnity.com').scripts.length, 0)
    assert.equal(ausfuehren(buildBootstrapSource({ release: true, killDenied: false }), 'www.jetnity.com').scripts.length, 0)
    assert.equal(ausfuehren(buildBootstrapSource({ release: true, killDenied: false }), 'widgets.jetnity.com').scripts.length, 0)
    assert.equal(ausfuehren(buildBootstrapSource({ release: true, killDenied: false }), '127.0.0.1').scripts.length, 0)
    const prod = productionBootstrapSource('aus')
    const prodLauf = ausfuehren(prod, 'jetnity.com')
    assert.equal(prodLauf.scripts.length, 0)
    assert.equal(prodLauf.calls, 1)
    assert.equal(prodLauf.root.optionalAttempt, 'blocked')
    assert.equal(prod.includes('true===true'), true)
    const offen = ausfuehren(productionBootstrapSource(null), 'jetnity.com')
    assert.equal(offen.scripts.length, 1)
    assert.equal(offen.scripts[0]?.src, CMP_BANNER_SRC)
    assert.equal(offen.root.booted, 1)
    assert.equal(offen.calls, 1)
    assert.equal(offen.root.order, 'listeners-before-optional')
    assert.equal(offen.listenersAtAttempt, 2)
    assert.equal(offen.sawBanner, false)
  })

  test('nur Freigabe wahr, Kill an, und jetnity.com setzen genau ein Skript; der zweite Lauf nicht noch eins', () => {
    const text = buildBootstrapSource({ release: true, killDenied: false })
    const sandbox: Record<string, unknown> = {
      location: { hostname: 'jetnity.com' },
      document: {
        addEventListener() {},
        querySelector() { return null },
        createElement() {
          return { src: '', async: true, setAttribute() {} }
        },
        head: { appendChild(el: { src: string }) { (sandbox.scripts as { src: string }[]).push(el) } },
        documentElement: { appendChild() {} },
      },
      scripts: [] as { src: string }[],
    }
    sandbox.window = sandbox
    runInNewContext(text, sandbox)
    runInNewContext(text, sandbox)
    const scripts = sandbox.scripts as { src: string }[]
    assert.equal(scripts.length, 1)
    assert.equal(scripts[0]?.src, CMP_BANNER_SRC)
  })
})

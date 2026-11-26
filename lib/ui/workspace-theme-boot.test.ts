import assert from 'node:assert/strict'
import { test } from 'node:test'
import vm from 'node:vm'

import { WORKSPACE_THEME_BOOT, WORKSPACE_THEME_KEY } from '@/lib/ui/workspace-theme-boot'

function lauf(anfang: 'throw' | Record<string, string>) {
  const store = anfang === 'throw' ? null : { ...anfang }
  const attrs: Record<string, string> = {}
  const localStorage = anfang === 'throw'
    ? { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
    : {
      getItem(key: string) { return store![key] ?? null },
      setItem(key: string, value: string) { store![key] = value },
    }
  vm.runInNewContext(WORKSPACE_THEME_BOOT, {
    localStorage,
    document: {
      documentElement: {
        setAttribute(key: string, value: string) { attrs[key] = value },
      },
    },
  })
  return { thema: attrs['data-workspace-theme'] ?? null, store }
}

test('gespeichertes Dunkel steht vor der Hydration, Grün wird Dunkel, Hell und blockierter Speicher bleiben hell', () => {
  assert.equal(WORKSPACE_THEME_KEY, 'jetnity:workspace-theme:v1')
  assert.equal(lauf({ [WORKSPACE_THEME_KEY]: 'dark' }).thema, 'dark')
  const gruen = lauf({ [WORKSPACE_THEME_KEY]: 'green' })
  assert.equal(gruen.thema, 'dark')
  assert.equal(gruen.store?.[WORKSPACE_THEME_KEY], 'dark')
  assert.equal(lauf({}).thema, null)
  assert.equal(lauf({ [WORKSPACE_THEME_KEY]: 'light' }).thema, null)
  assert.equal(lauf('throw').thema, null)
  assert.doesNotMatch(WORKSPACE_THEME_BOOT, /fetch|cookie|document\.write|eval\(/)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cmsInternalNavigation } from './navigation'

const base = { currentHref: 'https://dev.example/admin/content/editor?entry=geonames%3A1650535', href: '/admin/settings',
  target: null, download: false, button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }

test('internal Next Link, query and keyboard destinations are guarded; nonleaving actions are separate', () => {
  for (const href of ['/admin/settings', '/admin/content', '?entry=geonames%3A2267057', 'https://dev.example/admin/marketing', '']) {
    assert.equal(cmsInternalNavigation({ ...base, href }), true, href)
  }
  for (const patch of [{ target: '_blank' }, { target: 'other-window' }, { href: '#preview' }, { href: null },
    { href: 'https://external.example/' }, { download: true }, { button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) {
    assert.equal(cmsInternalNavigation({ ...base, ...patch }), false, JSON.stringify(patch))
  }
  assert.equal(cmsInternalNavigation({ ...base, target: '_SELF' }), true)
})

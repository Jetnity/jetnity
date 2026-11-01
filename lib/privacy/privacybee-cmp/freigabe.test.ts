import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { CMP_BANNER_SRC, CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { cmpProductionBannerAllowed, killSwitchDeniesCmp, planBannerInsert, serverReleaseAllowsCmp } from '@/lib/privacy/privacybee-cmp/freigabe'

describe('cmp freigabe', () => {
  test('die Produktionsfreigabe gilt auf dem Lizenzhost und der Kill bleibt zu', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, true)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'jetnity.com', killSwitch: null }), true)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'jetnity.com', killSwitch: undefined }), true)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'jetnity.com', killSwitch: 'aus' }), false)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'JETNITY.COM' }), true)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'www.jetnity.com' }), false)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'jetnity.com.evil.test' }), false)
  })

  test('Serverfreigabe prüft Release und Kill-Switch und keinen Host', () => {
    assert.equal(serverReleaseAllowsCmp(undefined), true)
    assert.equal(serverReleaseAllowsCmp(null), true)
    assert.equal(serverReleaseAllowsCmp('aus'), false)
    assert.equal(serverReleaseAllowsCmp(' aus '), false)
    assert.equal(serverReleaseAllowsCmp('aus', true), false)
    assert.equal(serverReleaseAllowsCmp(' aus ', true), false)
    assert.equal(serverReleaseAllowsCmp(undefined, false), false)
    assert.equal(serverReleaseAllowsCmp(undefined, true), true)
    assert.equal(serverReleaseAllowsCmp(null, true), true)
    assert.equal(serverReleaseAllowsCmp('an', true), true)
  })

  test('Kill-Switch aus verweigert, ein fehlender Schalter nicht von sich aus', () => {
    assert.equal(killSwitchDeniesCmp('aus'), true)
    assert.equal(killSwitchDeniesCmp(' aus '), true)
    assert.equal(killSwitchDeniesCmp(undefined), false)
    assert.equal(killSwitchDeniesCmp(null), false)
    assert.equal(killSwitchDeniesCmp(''), false)
    assert.equal(planBannerInsert({ release: true, hostname: 'jetnity.com', killSwitch: 'aus' }).request, false)
  })

  test('nur der exakte Lizenz-Host darf im reinen Plan ein Banner vorsehen', () => {
    assert.deepEqual(planBannerInsert({ release: true, hostname: 'jetnity.com' }), {
      request: true,
      src: CMP_BANNER_SRC,
    })
    for (const hostname of [
      'www.jetnity.com',
      'widgets.jetnity.com',
      'localhost',
      '127.0.0.1',
      'jetnity-app.vercel.app',
      'jetnity.com.evil.test',
      'notjetnity.com',
      null,
      '',
    ]) {
      assert.equal(planBannerInsert({ release: true, hostname }).request, false, String(hostname))
    }
    assert.equal(planBannerInsert({ release: false, hostname: 'jetnity.com' }).request, false)
  })
})

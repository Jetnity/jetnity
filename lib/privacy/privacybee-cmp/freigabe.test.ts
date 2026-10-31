import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { CMP_BANNER_SRC, CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { cmpProductionBannerAllowed, killSwitchDeniesCmp, planBannerInsert } from '@/lib/privacy/privacybee-cmp/freigabe'

describe('cmp freigabe', () => {
  test('die Produktionsfreigabe bleibt falsch, auch auf jetnity.com ohne Kill-Switch', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, false)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'jetnity.com', killSwitch: null }), false)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'jetnity.com', killSwitch: undefined }), false)
    assert.equal(cmpProductionBannerAllowed({ hostname: 'JETNITY.COM' }), false)
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

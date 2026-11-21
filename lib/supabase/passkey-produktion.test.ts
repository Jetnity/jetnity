import { test } from 'node:test'
import assert from 'node:assert/strict'
import { passkeyProduktionEntscheid } from '@/lib/supabase/passkey-produktion'

const basis = {
  site_url: 'https://jetnity.com',
  uri_allow_list: 'https://jetnity.com/auth/callback**,https://jetnity.com/auth/update-password',
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  mfa_allow_low_aal: false,
  mfa_web_authn_enroll_enabled: false,
  passkey_enabled: false,
}

test('Production-Passkey wird nur bei unverändertem TOTP gesetzt', () => {
  assert.equal(passkeyProduktionEntscheid(basis).tun, 'setzen')
  assert.equal(passkeyProduktionEntscheid({ ...basis, passkey_enabled: true }).tun, 'schon_an')
  assert.equal(passkeyProduktionEntscheid({ ...basis, mfa_totp_verify_enabled: false }).tun, 'abbruch')
  assert.equal(passkeyProduktionEntscheid({ ...basis, site_url: 'http://localhost:3000' }).tun, 'abbruch')
  assert.equal(passkeyProduktionEntscheid({ ...basis, uri_allow_list: 'https://dev.jetnity.com/**' }).tun, 'abbruch')
  assert.equal(passkeyProduktionEntscheid({ ...basis, mfa_web_authn_enroll_enabled: true }).tun, 'abbruch')
})

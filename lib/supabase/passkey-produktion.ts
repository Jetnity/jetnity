// Entscheid für den einen Production-Passkey-Schalter. Schreibt nichts.

export type PasskeyProduktionEntscheid =
  | { tun: 'setzen' }
  | { tun: 'schon_an' }
  | { tun: 'abbruch'; grund: string }

const TOTP = {
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  mfa_allow_low_aal: false,
} as const

export function passkeyProduktionEntscheid(live: Record<string, unknown>): PasskeyProduktionEntscheid {
  if (live.site_url !== 'https://jetnity.com') return { tun: 'abbruch', grund: 'site_url' }
  const allow = typeof live.uri_allow_list === 'string' ? live.uri_allow_list : ''
  if (!allow.includes('https://jetnity.com')) return { tun: 'abbruch', grund: 'uri_allow_list' }
  if (/dev\.jetnity\.com|vercel\.app|localhost/i.test(allow)) return { tun: 'abbruch', grund: 'uri_allow_list_fremd' }
  for (const [key, wert] of Object.entries(TOTP)) {
    if (live[key] !== wert) return { tun: 'abbruch', grund: key }
  }
  if (live.mfa_web_authn_enroll_enabled === true || live.mfa_web_authn_verify_enabled === true) {
    return { tun: 'abbruch', grund: 'mfa_webauthn' }
  }
  if (live.passkey_enabled === true) return { tun: 'schon_an' }
  if (live.passkey_enabled === false) return { tun: 'setzen' }
  return { tun: 'abbruch', grund: 'passkey_enabled' }
}

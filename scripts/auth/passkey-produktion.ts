// Ein Schalter am Production-Auth-Server. Kein config push, keine Redirect-Änderung.
//
//   node --import tsx scripts/auth/passkey-produktion.ts --produktion --projekt-ref qscbgcdmivbbnzrcyegn --setzen
//   node --import tsx scripts/auth/passkey-produktion.ts --produktion --projekt-ref qscbgcdmivbbnzrcyegn --aus

import { passkeyProduktionEntscheid } from '@/lib/supabase/passkey-produktion'
import { productionAuthSnapshotAusKonfiguration, productionAuthSnapshotText } from '@/lib/supabase/auth-produktion-lesen'

import { authKonfiguration, authKonfigurationSetzen, produktionsZiel } from './ziel'

const REF = 'qscbgcdmivbbnzrcyegn'

function felder(live: Record<string, unknown>) {
  return {
    passkey_enabled: live.passkey_enabled,
    site_url: live.site_url,
    uri_allow_list: live.uri_allow_list,
    webauthn_rp_id: live.webauthn_rp_id,
    webauthn_rp_origins: live.webauthn_rp_origins,
    mfa_totp_enroll_enabled: live.mfa_totp_enroll_enabled,
    mfa_totp_verify_enabled: live.mfa_totp_verify_enabled,
    mfa_allow_low_aal: live.mfa_allow_low_aal,
    mfa_web_authn_enroll_enabled: live.mfa_web_authn_enroll_enabled,
    mfa_web_authn_verify_enabled: live.mfa_web_authn_verify_enabled,
  }
}

async function aus(ziel: Awaited<ReturnType<typeof produktionsZiel>>) {
  const nachher = await authKonfigurationSetzen(ziel, { passkey_enabled: false })
  console.log(JSON.stringify({ passkey_enabled: nachher.passkey_enabled, rueckweg: true }))
  return nachher
}

async function main() {
  const setzen = process.argv.includes('--setzen')
  const zurueck = process.argv.includes('--aus')
  if (setzen === zurueck) throw new Error('Genau eines von --setzen oder --aus. Abgebrochen.')
  if (!process.argv.includes('--produktion') || !process.argv.includes(REF)) {
    throw new Error('Nur --produktion --projekt-ref qscbgcdmivbbnzrcyegn. Abgebrochen.')
  }
  const ziel = await produktionsZiel(REF)
  const vorher = await authKonfiguration(ziel)
  console.log(productionAuthSnapshotText(productionAuthSnapshotAusKonfiguration(vorher)))
  console.log(JSON.stringify(felder(vorher)))
  if (zurueck) {
    await aus(ziel)
    return
  }
  const entscheid = passkeyProduktionEntscheid(vorher)
  console.log(JSON.stringify(entscheid))
  if (entscheid.tun === 'abbruch') throw new Error(`Abbruch: ${entscheid.grund}`)
  if (entscheid.tun === 'schon_an') return
  let nachher: Record<string, unknown>
  try {
    nachher = await authKonfigurationSetzen(ziel, { passkey_enabled: true })
  } catch (fehler) {
    await aus(ziel).catch(() => undefined)
    throw fehler
  }
  const totpGleich = nachher.mfa_totp_enroll_enabled === true
    && nachher.mfa_totp_verify_enabled === true
    && nachher.mfa_allow_low_aal === false
    && nachher.site_url === 'https://jetnity.com'
    && nachher.passkey_enabled === true
  console.log(JSON.stringify(felder(nachher)))
  if (!totpGleich) {
    await aus(ziel)
    throw new Error('Nach dem Setzen stimmt Passwort-Umgebung oder TOTP nicht. Schalter ist wieder aus.')
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

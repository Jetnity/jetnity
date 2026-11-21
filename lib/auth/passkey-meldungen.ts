import type { SicherheitTextSchluessel } from '@/lib/localization/account-security-texte'

import type { PasskeyFehlerCode } from '@/lib/auth/passkey-port'

const SCHLUESSEL: Record<PasskeyFehlerCode, SicherheitTextSchluessel> = {
  geschlossen: 'passkey.login.closed',
  abgebrochen: 'passkey.error.abgebrochen',
  challenge_abgelaufen: 'passkey.error.challenge',
  bereits_vorhanden: 'passkey.error.exists',
  unbekanntes_credential: 'passkey.error.unknownCredential',
  server_aus: 'passkey.error.server',
  origin: 'passkey.error.origin',
  sdk_fehlt: 'passkey.error.sdk',
  konto_nicht_bestaetigt: 'passkey.error.account',
  zu_viele: 'passkey.error.tooMany',
  name_ungueltig: 'passkey.error.name',
  nicht_gelistet: 'passkey.error.notListed',
  nicht_erlaubt: 'passkey.error.denied',
  aal_unbekannt: 'passkey.error.aal',
  netz: 'passkey.error.network',
  pruefung: 'passkey.error.verification',
  unbekannt: 'passkey.error.unknown',
}

export function passkeyFehlerSchluessel(code: PasskeyFehlerCode): SicherheitTextSchluessel {
  return SCHLUESSEL[code]
}

// A strict compatibility contract for the already approved Development target.
// This does not learn expected settings from the live service and writes nothing.
import { tomlWert, type TomlTabelle } from '@/lib/supabase/config-toml'

const DEV_REF = 'yfvbxvijcorffwxbxahl'
const CALLBACK =
  'https://jetnity-app-git-feat-dev-security-event-0ab098-jetnity-e1b93c82.vercel.app/auth/callback\\?next=%2Freisen'
const PASSWORT_ZIEL =
  'https://jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app/auth/update-password'
const REDIRECTS = [CALLBACK, PASSWORT_ZIEL] as const
const GERAETETEST_REDIRECT = 'https://dev.jetnity.com/**'

const HERKUNFT = Object.freeze({
  vertrag: 'jetnity.dev-auth-redirects.2026-11-15',
  projektRef: DEV_REF,
  freigabeDatum: '2026-11-13',
  sourcePr: 1197,
  sourceCommit: '70a3cb09204e74f6bcd4a5b481e942e526a6102f',
  sourceDateien: ['supabase/config.toml', 'docs/AUTH.md'] as const,
  quelle: 'supabase/config.toml + lib/supabase/auth-dev-konfiguration.ts',
})

const PASSKEY_HERKUNFT = Object.freeze({
  vertrag: 'jetnity.dev-auth-passkeys.2026-11-21',
  projektRef: DEV_REF,
  freigabeDatum: '2026-11-21',
  sourcePr: 1240,
  enabled: true,
  quelle: 'Owner-Freigabe 2026-11-21 (#1240) + lib/supabase/auth-dev-konfiguration.ts; nur Dev-Leseprüfung',
})

const GERAETETEST_REDIRECT_HERKUNFT = Object.freeze({
  vertrag: 'jetnity.dev-auth-device-redirects.2026-11-21',
  projektRef: DEV_REF,
  sourcePr: 1240,
  zusaetzlicheUrl: GERAETETEST_REDIRECT,
  quelle: 'Owner-bestätigter Dev-Gerätetest (#1240), Dev-Dashboard-Lesung 2026-11-21 + lib/supabase/auth-dev-konfiguration.ts; nur Dev-Leseprüfung',
})

/**
 * Only the two reviewed raw states are accepted. All other Auth expectations
 * remain the caller's original values and are still compared with the service.
 * The remote branch-identity guard in scripts/auth/ziel.ts must run first.
 */
export function devAuthKonfiguration(config: TomlTabelle, ref: string) {
  if (ref !== DEV_REF) {
    throw new Error('Der Dev-Auth-Redirect-Vertrag gilt ausschließlich für den bestätigten Develop-Branch.')
  }

  const roh = tomlWert(config, 'auth.additional_redirect_urls')
  const alt = Array.isArray(roh) && roh.length === 1 && roh[0] === CALLBACK
  const integriert =
    Array.isArray(roh) && roh.length === REDIRECTS.length &&
    roh.every((adresse, index) => adresse === REDIRECTS[index])
  if (!alt && !integriert) {
    throw new Error(
      'Die rohe Dev-Redirect-Liste entspricht weder dem historischen Callback noch dem exakt freigegebenen integrierten Stand. Abgebrochen.',
    )
  }

  const effektiv = structuredClone(config)
  const auth = effektiv.auth as TomlTabelle
  auth.additional_redirect_urls = [...REDIRECTS]

  return {
    config: effektiv,
    roheKonfigurationVollstaendig: integriert,
    herkunft: HERKUNFT,
  }
}

/** Read-only expectations for the Owner-approved Dev passkey device test. */
export function devAuthPruefkonfiguration(config: TomlTabelle, ref: string) {
  const dev = devAuthKonfiguration(config, ref)
  // Der Button liest genau diesen Rohwert. Andere Werte bleiben ungültig.
  if (tomlWert(dev.config, 'auth.passkey.enabled') !== true) {
    throw new Error('Der Dev-Passkey-Prüfvertrag verlangt auth.passkey.enabled = true in der unveränderten Rohkonfiguration.')
  }
  const auth = dev.config.auth as TomlTabelle
  ;(auth.passkey as TomlTabelle).enabled = true
  auth.additional_redirect_urls = [...REDIRECTS, GERAETETEST_REDIRECT]
  return {
    ...dev,
    passkeyHerkunft: PASSKEY_HERKUNFT,
    geraetetestRedirectHerkunft: GERAETETEST_REDIRECT_HERKUNFT,
  }
}

/** The CLI reads raw TOML: never let it remove the already active extra URL. */
export function devAuthPushKonfiguration(config: TomlTabelle, ref: string) {
  const effektiv = devAuthKonfiguration(config, ref)
  if (!effektiv.roheKonfigurationVollstaendig) {
    throw new Error(
      'Auth-Anwendung gesperrt: Die rohe config.toml enthält die bereits freigegebene Dev-Passwort-Weiterleitung aus #1197 noch nicht. Kein config push und kein PATCH ausgeführt. Erst den zuständigen integrierten Konfigurationsstand übernehmen.',
    )
  }
  return effektiv
}

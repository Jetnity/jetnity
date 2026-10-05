// lib/auth/oauth-anbieter.ts
//
// OAuth-Schaltflächen folgen der belegten Aktivierung in config.toml.
// Ein vorhandener Env-Name oder ein fehlender Wert ist kein Enablement.
// Diese Datei bleibt frei von Dateisystemzugriff, damit die Client-UI
// nur die bereits gelesene Freigabe sichtbar macht.

import { tomlWert, type TomlTabelle } from '@/lib/supabase/config-toml'

export type OauthAnbieter = 'google' | 'apple'

export type OauthFreigabe = Record<OauthAnbieter, boolean>

const OAUTH_ANBIETER: readonly OauthAnbieter[] = ['google', 'apple']

export function oauthAnbieterAktiv(config: TomlTabelle, anbieter: OauthAnbieter): boolean {
  return tomlWert(config, `auth.external.${anbieter}.enabled`) === true
}

export function oauthFreigabeAusToml(config: TomlTabelle): OauthFreigabe {
  return {
    google: oauthAnbieterAktiv(config, 'google'),
    apple: oauthAnbieterAktiv(config, 'apple'),
  }
}

export function sichtbareOauthAnbieter(freigabe: OauthFreigabe): OauthAnbieter[] {
  return OAUTH_ANBIETER.filter((anbieter) => freigabe[anbieter] === true)
}

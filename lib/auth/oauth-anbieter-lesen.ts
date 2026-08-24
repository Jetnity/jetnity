// lib/auth/oauth-anbieter-lesen.ts
//
// Liest die belegte OAuth-Aktivierung serverseitig aus config.toml.
// Fail-closed: fehlende Datei oder unklarer Wert = keine Schaltfläche.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml } from '@/lib/supabase/config-toml'
import { oauthFreigabeAusToml, type OauthFreigabe } from '@/lib/auth/oauth-anbieter'

export function oauthFreigabeLesen(): OauthFreigabe {
  try {
    const config = leseToml(readFileSync(join(process.cwd(), 'supabase', 'config.toml'), 'utf8'))
    return oauthFreigabeAusToml(config)
  } catch {
    return { google: false, apple: false }
  }
}

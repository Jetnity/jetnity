// lib/auth/account-security-passkeys-lesen.ts
//
// Liest die Passkey-Server-Freigabe aus config.toml. Fail-closed:
// fehlende Datei oder unklarer Wert = nicht unterstützt.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml } from '@/lib/supabase/config-toml'
import { passkeysServerAktiviertAusToml } from '@/lib/auth/account-security-lage'

export function passkeysServerAktiviertLesen(): boolean {
  try {
    const config = leseToml(readFileSync(join(process.cwd(), 'supabase', 'config.toml'), 'utf8'))
    return passkeysServerAktiviertAusToml(config)
  } catch {
    return false
  }
}

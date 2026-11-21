// scripts/auth/pruefen.ts
//
// Vergleicht die Auth-Konfiguration des Development-Branches mit dem, was das
// Repository über sie sagt.
//
// Phase 1.4 hat für das Schema beendet, was hier für die Auth-Ebene nachgeholt
// wird: Ein Zustand, den niemand aus dem Repository ableiten kann, ist kein
// Zustand, auf den man sich verlassen kann. `supabase/config.toml` beschreibt
// jetzt den Branch – diese Prüfung sagt, ob die Beschreibung noch stimmt.
//
// Aufruf:
//   npm run auth:pruefen
//   npm run auth:pruefen -- --json
//
// Der Lauf endet mit Code 1, sobald etwas auseinanderläuft. Hier steht nur der
// Weg zum Branch; welche Fragen gestellt werden und was die Ausgabe über einen
// unbekannten Schlüssel sagen darf, steht in `lib/supabase/auth-bericht.ts`.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml } from '@/lib/supabase/config-toml'
import { alsJson, befund, bericht } from '@/lib/supabase/auth-bericht'
import { devAuthPruefkonfiguration } from '@/lib/supabase/auth-dev-konfiguration'

import { authKonfiguration, ziel } from './ziel'

const CONFIG = join(process.cwd(), 'supabase', 'config.toml')

async function main() {
  const z = await ziel()
  const dev = devAuthPruefkonfiguration(leseToml(readFileSync(CONFIG, 'utf8')), z.ref)
  const live = await authKonfiguration(z)

  const ergebnis = befund(dev.config, live)
  ergebnis.abweichungen = ergebnis.abweichungen.map((abweichung) => {
    if (abweichung.api === 'uri_allow_list') return { ...abweichung, quelle: dev.herkunft.quelle }
    if (abweichung.api === 'passkey_enabled') return { ...abweichung, quelle: dev.passkeyHerkunft.quelle }
    return abweichung
  })
  const mitHerkunft = {
    ...ergebnis,
    devRedirectVertrag: {
      ...dev.herkunft,
      roheKonfigurationVollstaendig: dev.roheKonfigurationVollstaendig,
    },
    devPasskeyVertrag: dev.passkeyHerkunft,
  }

  if (process.argv.includes('--json')) {
    process.stdout.write(`${alsJson(mitHerkunft)}\n`)
  } else {
    console.log(`Dev-Redirect-Vertrag: ${dev.herkunft.vertrag}; Ziel ${dev.herkunft.projektRef}; Quelle #${dev.herkunft.sourcePr}@${dev.herkunft.sourceCommit}.`)
    console.log(`Dev-Passkey-Vertrag: ${dev.passkeyHerkunft.vertrag}; enabled=true; Owner-Freigabe ${dev.passkeyHerkunft.freigabeDatum}, #${dev.passkeyHerkunft.sourcePr}.`)
    console.log(bericht(ergebnis))
  }

  if (!ergebnis.sauber) process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

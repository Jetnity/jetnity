// scripts/auth/anwenden.ts
//
// Bringt den Development-Branch auf den Stand, den das Repository beschreibt.
//
// Zwei Wege, weil es zwei Arten von Werten gibt:
//
//   · Was `supabase/config.toml` ausdrücken kann, überträgt `supabase config
//     push` – das offizielle Werkzeug. Es liest denselben Abschnitt, den
//     `npm run auth:pruefen` als Sollwert benutzt, und rührt eine Einstellung
//     nicht an, die schon stimmt.
//   · Was die CLI-Konfiguration nicht kennt – voran der Schutz vor
//     kompromittierten Passwörtern –, setzt ein PATCH auf
//     `/v1/projects/{ref}/config/auth`. Diese Schlüssel stehen mit Begründung
//     in `OHNE_TOML_SCHLUESSEL`; erfunden wird hier keiner.
//
// Aufruf:
//   npm run auth:anwenden            # anwenden
//   npm run auth:anwenden -- --zeigen  # nur sagen, was sich ändern würde
//
// Das Ziel ist immer der Branch aus `SUPABASE_PROJECT_REF`, und `ziel()` bricht
// ab, wenn dahinter ein eigenständiges Projekt steht. Production wird von hier
// aus nicht verwaltet.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml } from '@/lib/supabase/config-toml'
import { OHNE_TOML_SCHLUESSEL, erwarteteAuthKonfiguration } from '@/lib/supabase/auth-erwartung'

import { authKonfiguration, authKonfigurationSetzen, ziel } from './ziel'

const CONFIG = join(process.cwd(), 'supabase', 'config.toml')

async function main() {
  const nurZeigen = process.argv.includes('--zeigen')
  const z = await ziel()

  // Erst lesen: Ohne den Stand davor wäre nicht zu sagen, was der Lauf bewirkt
  // hat und was schon vorher stimmte.
  const vorher = await authKonfiguration(z)

  const offen = OHNE_TOML_SCHLUESSEL.filter((e) => vorher[e.api] !== e.wert)

  console.log(nurZeigen ? 'Es würde sich ändern:' : 'Es wird angewendet:')
  console.log(`\n  config.toml über \`supabase config push\`:`)
  if (nurZeigen) {
    console.log('      (nicht ausgeführt – der Push sagt selbst, was er ändert)')
  }

  console.log(`\n  Schlüssel ohne CLI-Entsprechung: ${offen.length} von ${OHNE_TOML_SCHLUESSEL.length} abweichend`)
  for (const e of offen) {
    console.log(`      ${e.api}: ${JSON.stringify(vorher[e.api])} → ${JSON.stringify(e.wert)}`)
    console.log(`        ${e.grund ?? ''}`)
  }

  if (nurZeigen) return

  // `--yes` beantwortet die Rückfrage je Abschnitt. Sie ist dafür gedacht, ein
  // kostenpflichtiges Zusatzprodukt nicht versehentlich einzuschalten; die
  // beiden, die dieses Projekt anbieten würde – MFA per SMS und WebAuthn –
  // stehen in config.toml ausdrücklich auf `false`.
  console.log('\n– supabase config push –')
  const ausgabe = execFileSync(
    'npx',
    ['--yes', 'supabase@2.114.0', 'config', 'push', '--project-ref', z.ref, '--yes'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  process.stdout.write(ausgabe)

  if (offen.length > 0) {
    console.log('\n– PATCH /config/auth –')
    const werte = Object.fromEntries(offen.map((e) => [e.api, e.wert]))
    const nachher = await authKonfigurationSetzen(z, werte)

    for (const e of offen) {
      const wirkt = nachher[e.api] === e.wert
      console.log(`  ${wirkt ? '✓' : '✗'} ${e.api} = ${JSON.stringify(nachher[e.api])}`)
      if (!wirkt) {
        throw new Error(
          `${e.api} steht nach dem Schreiben auf ${JSON.stringify(nachher[e.api])}, erwartet war ` +
            `${JSON.stringify(e.wert)}. Die Einstellung ist auf diesem Plan möglicherweise nicht verfügbar.`,
        )
      }
    }
  }

  // Die Gegenprobe gehört zum Anwenden: Ein Lauf, der nicht sagt, ob er
  // gewirkt hat, ist keine Zusage.
  const config = leseToml(readFileSync(CONFIG, 'utf8'))
  const erwartungen = erwarteteAuthKonfiguration(config)
  const jetzt = await authKonfiguration(z)
  const rest = erwartungen.filter((e) => jetzt[e.api] !== e.wert)

  if (rest.length === 0) {
    console.log(`\nAlle ${erwartungen.length} erwarteten Werte stehen am Branch.`)
    return
  }

  console.log(`\n${rest.length} Wert(e) stehen weiterhin anders:`)
  for (const e of rest) console.log(`  ${e.api}: ${JSON.stringify(jetzt[e.api])} statt ${JSON.stringify(e.wert)}`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

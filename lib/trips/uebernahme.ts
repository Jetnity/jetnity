// lib/trips/uebernahme.ts
//
// Der Vorgang „Entwurf im Browser → Reise im Konto“.
//
// Bewusst ohne React: Die Reihenfolge – senden, Antwort abwarten, erst dann
// löschen – ist die Stelle, an der ein Entwurf verloren gehen kann. Sie gehört
// in ein Modul, das ein Test ohne Browser durchspielen kann.
// `components/trips/GastreiseBruecke.tsx` ist nur noch die Anzeige dazu.
//
// ---------------------------------------------------------------------------
// Die Reihenfolge und warum sie so ist
// ---------------------------------------------------------------------------
//
//   1. `zurUebernahme()` liefert alles, was im Browser liegt: die aktive
//      Gastreise und die Warteschlange aus der Fassung vor Phase 1.5.
//   2. Je Entwurf ein Aufruf. Erst wenn der Server die Kennung der Reise
//      gemeldet hat, verschwindet dieser eine Entwurf aus dem Browser.
//   3. Beim ersten Fehler bricht der Vorgang ab. Der Grund ist fast immer die
//      Sitzung oder die Erreichbarkeit der Datenbank, und dann scheitert jeder
//      weitere Entwurf genauso. Was noch im Browser liegt, bleibt liegen.
//
// Alles auf einmal zu löschen wäre die Annahme, es habe alles geklappt. Ein
// Entwurf, der nach einem Abbruch gelöscht ist, ohne im Konto zu liegen, ist
// verlorene Arbeit – und niemand könnte sie rekonstruieren.
//
// ---------------------------------------------------------------------------
// Warum ein zweiter Durchlauf nichts kaputt macht
// ---------------------------------------------------------------------------
//
// `public.reise_anlegen()` ist über `unique (user_id, client_ref)` idempotent:
// Dieselbe Gastreise ergibt pro Konto genau eine Reise. Reload, doppelter
// Request, zweiter Login und zwei offene Tabs führen zum selben Ergebnis.
//
// Der Riegel unten ist deshalb nicht für die Datenbank da, sondern für den
// Browserspeicher: Zwei gleichzeitige Durchläufe würden sich beim Aufräumen die
// Liste gegenseitig unter den Füssen wegziehen.

import { readinessAlsUebernahme } from '@/lib/readiness/uebernahme'
import { alsNutzlast } from '@/lib/trips/abbildung'
import { uebernommenStreichen, zurUebernahme } from '@/lib/trips/gastspeicher'
import type { ReiseNutzlast } from '@/lib/trips/schema'

/** Wie ein Aufruf ausgegangen ist – dieselbe Form wie in `lib/trips/aktionen.ts`. */
export type Uebernahmeantwort = { ok: true; wert: string } | { ok: false; meldung: string }

export type Uebernahmebericht =
  /** Es lag nichts im Browser. Der Normalfall bei jedem Seitenaufruf. */
  | { art: 'nichts' }
  /** Ein Durchlauf ist bereits unterwegs. */
  | { art: 'laeuft' }
  | { art: 'fertig'; uebernommen: number }
  | { art: 'fehler'; meldung: string; uebernommen: number; offen: number }

let laeuft = false

/**
 * Überträgt alle Entwürfe dieses Browsers in das angemeldete Konto.
 *
 * `senden` ist die Server Action. Sie wird übergeben statt importiert, damit
 * der Test den Vorgang ohne Netz und ohne Datenbank durchspielen kann – und
 * damit dieses Modul nichts über `'use server'` wissen muss.
 */
export async function gastreisenUebernehmen(
  senden: (nutzlast: ReiseNutzlast) => Promise<Uebernahmeantwort>,
  beginn?: (anzahl: number) => void,
  readinessSenden?: (
    tripId: string,
    items: ReturnType<typeof readinessAlsUebernahme>,
  ) => Promise<Uebernahmeantwort>,
): Promise<Uebernahmebericht> {
  if (laeuft) return { art: 'laeuft' }

  const entwuerfe = zurUebernahme()
  if (entwuerfe.length === 0) return { art: 'nichts' }

  // Erst jetzt, wo es etwas zu tun gibt. Der Hinweis „Deine Reise wird
  // übernommen" bei jedem Seitenaufruf – auch ohne Entwurf – wäre eine
  // Meldung über nichts.
  beginn?.(entwuerfe.length)

  laeuft = true
  let uebernommen = 0

  try {
    for (const entwurf of entwuerfe) {
      const ergebnis = await senden(alsNutzlast(entwurf))

      if (!ergebnis.ok) {
        return {
          art: 'fehler',
          meldung: ergebnis.meldung,
          uebernommen,
          offen: entwuerfe.length - uebernommen,
        }
      }

      const readiness = readinessAlsUebernahme(entwurf)
      if (readinessSenden && readiness.length > 0) {
        const sync = await readinessSenden(ergebnis.wert, readiness)
        if (!sync.ok) {
          return {
            art: 'fehler',
            meldung: sync.meldung,
            uebernommen,
            offen: entwuerfe.length - uebernommen,
          }
        }
      }

      uebernommen += 1
      uebernommenStreichen(entwurf.clientRef ?? entwurf.id)
    }

    return { art: 'fertig', uebernommen }
  } finally {
    // Auch wenn `senden` wirft: Ohne das Zurücksetzen bliebe der Riegel zu und
    // ein „Erneut versuchen" wäre wirkungslos.
    laeuft = false
  }
}

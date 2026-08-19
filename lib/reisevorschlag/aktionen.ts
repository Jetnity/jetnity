// lib/reisevorschlag/aktionen.ts
//
// Die beiden Vorgänge, die der Browser auslösen darf.
//
//   · `vorschlagErzeugen()` – kostet Geld, speichert nichts.
//   · `vorschlagUebernehmen()` – speichert, kostet nichts.
//
// Die Trennung ist die Anforderung: Ohne ausdrückliche Freigabe entsteht keine
// Reise. Ein Vorschlag ist ein Vorschlag, solange niemand „Übernehmen“ gedrückt
// hat, und er liegt bis dahin im Browser – nicht in der Datenbank, nicht im
// Gastspeicher, nicht in einem Zwischentisch.
//
// Beide sind Server Actions und damit öffentliche HTTP-Endpunkte. Kein Layout
// und keine Middleware schützt sie; jede prüft selbst, was sie prüfen muss:
//
//   · `vorschlagErzeugen()` ist bewusst auch ohne Konto erreichbar – ein Gast
//     darf Jetnity benutzen (ADR-0042). Statt Anmeldung schützt ihn die
//     Kostenschranke in der Datenbank, mit einem eigenen, kleineren
//     Tageskontingent für Gäste (ADR-0052).
//   · `vorschlagUebernehmen()` schreibt in ein Konto und verlangt deshalb eines.
//     Der Gastweg schreibt nicht hier, sondern im Browser
//     (`gastreiseAblegen()`); dort gibt es keinen Server, der etwas prüfen
//     könnte, und deshalb auch nichts, was ein Gast serverseitig anrichten kann.
//
// Diese Datei ist die einzige Stelle mit echten Verbindungen. Der Ablauf selbst
// steht in `lib/reisevorschlag/erzeugen.ts` und ist dort ohne Verbindung
// prüfbar.

'use server'

import { kontingentBeanspruchen, nutzungAbschliessen } from '@/lib/modell/kontingent'
import { modellAufrufen } from '@/lib/modell/aufruf'
import { modellZustand } from '@/lib/modell/konfiguration'
import { reisevorschlagErzeugen, type Vorschlagsergebnis } from '@/lib/reisevorschlag/erzeugen'
import { vorschlagAlsNutzlast } from '@/lib/reisevorschlag/abbildung'
import { uebernahmeSchema } from '@/lib/reisevorschlag/schema'
import { reiseAusNutzlastAnlegen, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { ersteMeldung } from '@/lib/trips/schema'

/** Heute in UTC. Reicht für „nächsten Sommer“ und braucht keine Zeitzone des Browsers. */
function heute(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Erzeugt einen Reisevorschlag aus einer freien Beschreibung.
 *
 * Speichert nichts. Die Rückgabe geht in die Vorschau, und dort entscheidet der
 * Mensch.
 */
export async function vorschlagErzeugen(freitext: unknown): Promise<Vorschlagsergebnis> {
  const zustand = modellZustand()

  return reisevorschlagErzeugen(freitext, {
    zustand,
    // `zustand.modell` gibt es nur im aktiven Fall. Im abgeschalteten kommt der
    // Ablauf nie bis zum Kontingent – diese Funktion wird dann nicht gerufen.
    beanspruchen: () =>
      zustand.aktiv
        ? kontingentBeanspruchen('reisevorschlag', zustand.modell)
        : Promise.resolve({ ok: false as const, meldung: 'Die intelligente Planung ist abgeschaltet.' }),
    abschliessen: nutzungAbschliessen,
    aufrufen: modellAufrufen,
    heute: heute(),
  })
}

/**
 * Übernimmt einen freigegebenen Vorschlag in das Konto des Aufrufers.
 *
 * Der Vorschlag kommt aus dem Browser zurück und wird deshalb vollständig neu
 * geprüft – mit demselben Schema wie die Modellantwort. Was zwischenzeitlich im
 * Browser daran geändert wurde, ändert nichts an den Grenzen: Ein Vorschlag mit
 * 400 Tagen, einem Preis im Titel oder einer fremden Kennung kommt hier nicht
 * durch.
 *
 * Idempotent über `clientRef`: Derselbe Aufruf ergibt dieselbe Reise, weil
 * `public.reise_anlegen()` über `unique (user_id, client_ref)` geht. Doppelklick
 * und Retry sind damit ein Vorgang. Ein Reload während einer nicht übernommenen
 * Vorschau verwirft den Vorschlag bewusst – er lebt nur im Komponentenzustand
 * (ADR-0050). Eine zweite Persistenz für Modellreisen entsteht nicht.
 */
export async function vorschlagUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<string>> {
  const geprueft = uebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  return reiseAusNutzlastAnlegen(
    vorschlagAlsNutzlast(geprueft.data.vorschlag, geprueft.data.clientRef),
  )
}

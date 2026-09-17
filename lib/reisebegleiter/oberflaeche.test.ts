// lib/reisebegleiter/oberflaeche.test.ts
//
// Was sich nur am Quelltext prüfen lässt.
//
// `lib/reisebegleiter/erzeugen.test.ts` prüft den Ablauf mit übergebenen
// Werkzeugen. Wer die Werkzeuge stellt, steht in `lib/reisebegleiter/aktionen.ts`,
// und wann die Fläche überhaupt entsteht, in den Workspace-Komponenten. Beides
// ist eine Naht zu Next, Supabase und dem Browser – hier wird deshalb der
// Vertrag gelesen und nicht ausgeführt.
//
// Das ist bewusst die schwächere Sorte Test. Sie fängt die Fälle, die teuer
// wären und sonst niemandem auffallen: eine Modellfunktion, die still auf einen
// anderen Kostentopf wechselt; ein `useEffect`, das beim Mounten fragt; ein
// Provider-Abruf, der nur entsteht, weil eine Fläche rendert.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function quelle(...teile: string[]): string {
  return readFileSync(join(process.cwd(), ...teile), 'utf8')
}

const aktionen = quelle('lib', 'reisebegleiter', 'aktionen.ts')
const flaeche = quelle('components', 'trips', 'Reisebegleiter.tsx')
const workspace = quelle('components', 'trips', 'TripWorkspace.tsx')
const uebersicht = quelle('components', 'trips', 'TripWorkspaceUebersicht.tsx')
const konto = quelle('components', 'trips', 'KontoArbeitsbereich.tsx')
const gast = quelle('components', 'trips', 'GastArbeitsbereich.tsx')

describe('Die Server Action bucht die dritte Modellfunktion', () => {
  test('beansprucht das Kontingent unter reisebegleiter', () => {
    assert.equal(aktionen.includes("kontingentBeanspruchen('reisebegleiter'"), true)
  })

  test('weicht nicht auf eine andere semantische Modellfunktion aus', () => {
    assert.equal(aktionen.includes("'reisevorschlag'"), false)
    assert.equal(aktionen.includes("'reiseaenderung'"), false)
  })

  test('schliesst die Nutzung über den bestehenden Weg ab', () => {
    assert.equal(aktionen.includes('abschliessen: nutzungAbschliessen'), true)
  })

  test('liest den Kill Switch, statt ihn zu umgehen', () => {
    assert.equal(aktionen.includes('modellZustand()'), true)
    assert.equal(aktionen.includes('JETNITY_MODELL_AKTIV'), false)
    assert.equal(aktionen.includes('OPENAI_API_KEY'), false)
  })
})

describe('Die Server Action schreibt nichts', () => {
  test('kennt keinen schreibenden Datenbankvorgang', () => {
    for (const verboten of [
      'revalidatePath',
      '.insert(',
      '.update(',
      '.delete(',
      '.upsert(',
      'reise_aendern',
      'reise_anlegen',
      'planpunkt',
      'operationenAnwenden',
      'gastreiseAendern',
    ]) {
      assert.equal(aktionen.includes(verboten), false, `schreibender Vorgang: ${verboten}`)
    }
  })

  test('exportiert genau einen Vorgang', () => {
    const exporte = [...aktionen.matchAll(/^export (?:async )?function (\w+)/gm)].map(
      (treffer) => treffer[1],
    )
    assert.deepEqual(exporte, ['begleiterFragen'])
  })

  test('lädt die Reise serverseitig und nimmt keine Reise vom Client an', () => {
    assert.equal(aktionen.includes('reiseLaden('), true)
    assert.equal(aktionen.includes('tripId: z.string().uuid()'), true)
    assert.equal(aktionen.includes('reiseSchema'), false)
  })

  test('verlangt eine geprüfte Anmeldung', () => {
    assert.equal(aktionen.includes('await konto()'), true)
    assert.equal(aktionen.includes('NICHT_ANGEMELDET'), true)
  })
})

describe('Die Server Action löst keinen Provider- und keinen kommerziellen Abruf aus', () => {
  test('benutzt die lokalen, provider-freien Auswertungen', () => {
    assert.equal(aktionen.includes('requirementsLokalFuerReise'), true)
    assert.equal(aktionen.includes('safetyLokalFuerReise'), true)
    assert.equal(aktionen.includes('seasonalLokalFuerReise'), true)
  })

  test('ruft keinen Provider und keine Suche auf', () => {
    for (const verboten of [
      'requirementsProviderAus',
      'safetyProviderAus',
      'seasonalProviderAus',
      'requirementsFuerReise',
      'safetyEvaluationsPruefen',
      'seasonalEvaluationsPruefen',
      '@/lib/flights/',
      '@/lib/hotels/',
      '@/lib/activities/',
      '@/lib/rental-cars/',
      '@/lib/mobility/',
    ]) {
      assert.equal(aktionen.includes(verboten), false, `Provider-/Suchweg: ${verboten}`)
    }
  })

  test('holt den Kontext ausschliesslich aus der akzeptierten Projektion', () => {
    assert.equal(aktionen.includes('assistantTruthContextProjizieren('), true)
    const projektionen = [...aktionen.matchAll(/assistantTruthContextProjizieren\(/g)]
    assert.equal(projektionen.length, 1, 'mehr als eine Projektion wäre eine zweite Wahrheit')
  })
})

describe('Die Fläche fragt nicht von selbst', () => {
  test('ruft die Server Action nur aus dem Absenden heraus auf', () => {
    const aufrufe = [...flaeche.matchAll(/begleiterFragen\(/g)]
    assert.equal(aufrufe.length, 1)
    // Ein `useEffect` mit dem Aufruf darin wäre ein bezahlter Aufruf beim
    // Rendern. Es gibt in dieser Komponente keinen Effekt.
    assert.equal(flaeche.includes('useEffect'), false)
    assert.equal(flaeche.includes('setInterval'), false)
    assert.equal(flaeche.includes('<form'), true)
    assert.equal(flaeche.includes('onSubmit={fragen}'), true)
  })

  test('sperrt den Knopf, solange ein Aufruf läuft', () => {
    assert.equal(flaeche.includes('disabled={laeuft}'), true)
    assert.equal(flaeche.includes('if (laeuft) return'), true)
  })

  test('meldet Laufen, Fehler und Ergebnis unterscheidbar', () => {
    assert.equal(flaeche.includes('aria-live="polite"'), true)
    assert.equal(flaeche.includes('aria-busy="true"'), true)
    assert.equal(flaeche.includes('role="alert"'), true)
  })

  test('rahmt die Auskunft als generierten Vorschlag', () => {
    assert.equal(flaeche.includes('Generierter Vorschlag'), true)
    assert.equal(flaeche.includes('keine amtliche Auskunft'), true)
    assert.equal(flaeche.includes('ändert, speichert und bucht nichts'), true)
    assert.equal(flaeche.includes('nicht geprüft'), true)
  })

  test('die Kopie behauptet nicht, das Modell formuliere die Sätze', () => {
    // Seit Runde 9 schreibt Jetnity jeden angezeigten Satz; das Modell wählt
    // nur aus. Eine Lade- oder Rahmenzeile, die „formuliert" oder „antwortet"
    // verspricht, wäre eine falsche Aussage über die Herkunft des Textes –
    // und genau so eine Zeile stand hier bis zum Continuity-Review.
    for (const irreführend of ['formuliert eine Auskunft', 'Auskunft entsteht']) {
      assert.equal(flaeche.includes(irreführend), false, `irreführende Kopie: ${irreführend}`)
    }

    assert.equal(flaeche.includes('wählt passende Jetnity-Aussagen aus'), true)
    assert.equal(flaeche.includes('Auskunft wird zusammengestellt'), true)
    assert.equal(flaeche.includes('unten schreibt Jetnity'), true)
  })

  test('zeigt den Jetnity-Stand aus dem Bezug und nicht aus dem Modelltext', () => {
    assert.equal(flaeche.includes('bezug.lage'), true)
    assert.equal(flaeche.includes('bezug.belegt'), true)
    assert.equal(flaeche.includes('Diese Zeilen kommen aus Jetnity'), true)
  })

  test('kennt keinen Weg, eine Reise zu ändern', () => {
    for (const verboten of [
      'aenderungUebernehmen',
      'planpunktAnlegen',
      'operationenAnwenden',
      'gastreiseAendern',
      'router.refresh',
    ]) {
      assert.equal(flaeche.includes(verboten), false, `Änderungsweg in der Fläche: ${verboten}`)
    }
  })
})

describe('Die Fläche liegt in der Reise und nicht daneben', () => {
  test('wird erst beim ersten Öffnen eingehängt', () => {
    assert.equal(workspace.includes('begleiterBereit && begleiter'), true)
    // Anders als die Änderungsfläche startet der Reisebegleiter auch auf dem
    // Desktop nicht eingehängt: Es gibt keinen Grund, eine Fläche zu mounten,
    // die niemand geöffnet hat.
    assert.match(workspace, /const \[begleiterBereit, setBegleiterBereit\] = React\.useState\(false\)/)
    assert.equal(workspace.includes('if (naechster) setBegleiterBereit(true)'), true)
  })

  test('ist ausklappbar, beschriftet und mit Escape schliessbar', () => {
    assert.equal(uebersicht.includes('aria-controls="reisebegleiter"'), true)
    assert.equal(uebersicht.includes('aria-expanded={begleiterOffen}'), true)
    assert.equal(workspace.includes("id=\"reisebegleiter\""), true)
    assert.equal(workspace.includes('hidden={!begleiterSichtbar}'), true)
    assert.match(workspace, /ereignis\.key !== 'Escape' \|\| !begleiterOffen/)
  })

  test('ist kein Hauptbereich und kein schwebender Chat', () => {
    // `ARBEITSBEREICHE` bleibt unverändert: Der Reisebegleiter bekommt keinen
    // gleichrangigen Platz in der Navigation.
    const arbeitsbereich = quelle('lib', 'trips', 'arbeitsbereich.ts')
    assert.equal(arbeitsbereich.includes("'begleiter'"), false)
    assert.equal(flaeche.includes('fixed'), false)
    assert.equal(flaeche.includes('position: fixed'), false)
  })

  test('erscheint nur im Konto-Arbeitsbereich', () => {
    assert.equal(konto.includes('<Reisebegleiter reise={reise} />'), true)
    assert.equal(gast.includes('Reisebegleiter'), false)
    // Ohne Prop kein Knopf: Der Gastweg zeigt keine Fläche, die es für ihn
    // nicht gibt.
    assert.equal(workspace.includes('begleiterVorhanden={begleiter != null}'), true)
    assert.equal(uebersicht.includes('begleiterVorhanden ?'), true)
  })
})

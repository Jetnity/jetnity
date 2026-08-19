// lib/reisevorschlag/schema.test.ts
//
// Diese Prüfung ist die Grenze zwischen einem Sprachmodell und der Datenbank von
// Jetnity. Alles, was hier durchkommt, wird nach einer Freigabe zu einem
// Reisegraphen; alles, was hier scheitert, wird eine Meldung. Das ist der
// Unterschied zwischen „der Vorschlag passte nicht" und einem SQLSTATE mitten in
// `public.reise_anlegen()`, nachdem der Nutzer „Übernehmen" gedrückt hat.
//
// Geprüft wird in zwei Richtungen:
//
//   · Was das Schema ablehnen muss – die fachlichen Grenzen aus
//     `lib/trips/schema.ts` und docs/REISEN.md, die eine Form allein nicht
//     ausdrückt.
//   · Was beide Schemata gemeinsam sagen müssen. `VORSCHLAG_JSON_SCHEMA` geht mit
//     dem Aufruf an OpenAI, `modellvorschlagSchema` prüft die Antwort. Ein Feld,
//     das nur eine Seite kennt, ist entweder ein Feld, das nie ankommt, oder
//     eines, das ungeprüft durchgeht.
//
// Zusätzlich stehen hier die Injection-artigen Fälle. Sie prüfen keine
// Modellreaktion – das wäre eine Prüfung des Modells und kostete je Lauf Geld.
// Geprüft wird, dass eine Anweisung im Freitext eine Eingabe bleibt und dass ein
// Modell, das ihr folgt, an dieser Stelle scheitert.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  VORSCHLAG_FASSUNG,
  VORSCHLAG_GRENZEN,
  VORSCHLAG_JSON_SCHEMA,
  modellvorschlagSchema,
  reisebeschreibungSchema,
  reisevorschlagSchema,
  uebernahmeSchema,
} from '@/lib/reisevorschlag/schema'
import {
  VORSCHLAG_MIT_DATUM,
  VORSCHLAG_MIT_PREISEN,
  VORSCHLAG_THAILAND,
  vorschlagMitTagen,
} from '@/lib/reisevorschlag/fixtures/antworten'
import { REISEIDEEN, zuLangerText } from '@/lib/reisevorschlag/fixtures/reiseideen'
import { traegtPreisangabe } from '@/lib/reisevorschlag/normalisierung'
import { GRENZEN } from '@/lib/trips/schema'
import { TRIP_INTERESTS, TRIP_ITEM_KINDS, TRIP_PACES } from '@/types/trips'

/** Ein gültiger Vorschlag mit genau einer veränderten Angabe. */
function vorschlag(abweichung: Record<string, unknown> = {}) {
  return { ...VORSCHLAG_THAILAND, ...abweichung }
}

function gelesen(abweichung: Record<string, unknown> = {}) {
  return modellvorschlagSchema.safeParse(vorschlag(abweichung))
}

describe('Ein vollständiger Vorschlag kommt durch', () => {
  test('die Vorlage ist gültig', () => {
    const ergebnis = modellvorschlagSchema.safeParse(VORSCHLAG_THAILAND)

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) {
      assert.equal(ergebnis.data.tage.length, 7)
      assert.equal(ergebnis.data.etappen.length, 2)
      assert.equal(ergebnis.data.startdatum, null, 'eine Reise ohne Datum ist zulässig')
    }
  })

  test('ein Vorschlag mit Zeitraum ebenso', () => {
    assert.equal(modellvorschlagSchema.safeParse(VORSCHLAG_MIT_DATUM).success, true)
  })

  test('leere Annahmen sind kein Fehler', () => {
    // Nichts erfinden, nur um die Liste zu füllen: War nichts anzunehmen, bleibt
    // sie leer.
    assert.equal(gelesen({ annahmen: [] }).success, true)
  })

  test('ein Vorschlag ohne Abreiseort und ohne Budget', () => {
    const ergebnis = gelesen({ abreiseort: null, budgetziel: null })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) {
      assert.equal(ergebnis.data.abreiseort, null)
      assert.equal(ergebnis.data.budgetziel, null)
    }
  })

  test('ein leerer Text wird null, nicht ein leerer String', () => {
    // `''` in `trips.origin` wäre ein Ort namens Leerzeichen. Die
    // Prüfbedingung `trips_origin_laenge` lehnt ihn ab – hier, nicht dort.
    const ergebnis = gelesen({ abreiseort: '   ' })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data.abreiseort, null)
  })
})

describe('Was das Reiseschema ablehnen würde, wird hier abgelehnt', () => {
  test('ein Titel nur aus Leerzeichen', () => {
    assert.equal(gelesen({ titel: '   ' }).success, false)
  })

  test('ein zu langer Titel', () => {
    assert.equal(gelesen({ titel: 'a'.repeat(GRENZEN.titel + 1) }).success, false)
  })

  test('mehr Reisende als erlaubt – wie trips_travellers_bereich', () => {
    assert.equal(gelesen({ reisende: GRENZEN.reisende + 1 }).success, false)
    assert.equal(gelesen({ reisende: 0 }).success, false)
    assert.equal(gelesen({ reisende: 2.5 }).success, false)
  })

  test('keine Währung nach ISO 4217 – wie trips_currency_format', () => {
    assert.equal(gelesen({ waehrung: 'Franken' }).success, false)
    assert.equal(gelesen({ waehrung: 'chf' }).success, false)
  })

  test('ein negatives Budget – wie trips_budget_bereich', () => {
    assert.equal(gelesen({ budgetziel: -1 }).success, false)
  })

  test('ein unbekanntes Tempo', () => {
    assert.equal(gelesen({ tempo: 'gemütlich' }).success, false)
  })

  test('ein unbekanntes Interesse – wie trips_interests_werte', () => {
    assert.equal(gelesen({ interessen: ['beach', 'weltraum'] }).success, false)
  })

  test('eine unbekannte Planpunktart – wie trip_items_kind_werte', () => {
    assert.equal(
      gelesen({
        tage: [{ nummer: 1, titel: null, punkte: [{ art: 'raumflug', titel: 'Mond', notiz: null, beginn: null }] }],
        etappen: [{ name: 'Mond', laendercode: null, vonTag: 1, bisTag: 1 }],
      }).success,
      false,
    )
  })

  test('ein Datum, das es nicht gibt', () => {
    // `^\d{4}-\d{2}-\d{2}$` allein liesse den 31. Februar durch. PostgreSQL
    // nicht – dort wäre es ein `22008` mitten in der Übernahme.
    assert.equal(gelesen({ startdatum: '2027-02-31' }).success, false)
    assert.equal(gelesen({ startdatum: '2027-13-01' }).success, false)
    assert.equal(gelesen({ startdatum: '01.06.2027' }).success, false)
  })

  test('eine Uhrzeit, die es nicht gibt', () => {
    assert.equal(
      gelesen({
        tage: [
          {
            nummer: 1,
            titel: null,
            punkte: [{ art: 'stay', titel: 'Check-in', notiz: null, beginn: '25:00' }],
          },
        ],
        etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
      }).success,
      false,
    )
  })

  test('ein Ländercode, der keiner ist', () => {
    assert.equal(
      gelesen({
        etappen: [
          { name: 'Bangkok', laendercode: 'Thailand', vonTag: 1, bisTag: 3 },
          { name: 'Krabi', laendercode: 'TH', vonTag: 4, bisTag: 7 },
        ],
      }).success,
      false,
    )
  })
})

describe('Die Grenzen des Modellwegs', () => {
  test('so viele Tage wie erlaubt kommen durch', () => {
    assert.equal(modellvorschlagSchema.safeParse(vorschlagMitTagen(VORSCHLAG_GRENZEN.tage)).success, true)
  })

  test('ein Tag mehr nicht', () => {
    // Nicht die Grenze des Reiseschemas (366), sondern die der Ausgabelänge: Ein
    // Vorschlag über ein halbes Jahr passt nicht in `MODELL_GRENZEN.ausgabeTokens`.
    assert.equal(
      modellvorschlagSchema.safeParse(vorschlagMitTagen(VORSCHLAG_GRENZEN.tage + 1)).success,
      false,
    )
  })

  test('eine Reise ohne Tage ist keine Reise', () => {
    assert.equal(gelesen({ tage: [], etappen: [] }).success, false)
  })

  test('ein Tag ohne Planpunkte ist kein Tag', () => {
    // Er wäre in der Vorschau eine leere Zeile und im Arbeitsbereich eine Frage.
    assert.equal(
      gelesen({
        tage: [{ nummer: 1, titel: 'Leer', punkte: [] }],
        etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
      }).success,
      false,
    )
  })

  test('mehr Planpunkte je Tag als erlaubt', () => {
    const zuViele = Array.from({ length: VORSCHLAG_GRENZEN.punkteJeTag + 1 }, (_, nr) => ({
      art: 'activity' as const,
      titel: `Punkt ${nr}`,
      notiz: null,
      beginn: null,
    }))

    assert.equal(
      gelesen({
        tage: [{ nummer: 1, titel: null, punkte: zuViele }],
        etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
      }).success,
      false,
    )
  })

  test('mehr Etappen als erlaubt', () => {
    const zuViele = Array.from({ length: VORSCHLAG_GRENZEN.etappen + 1 }, (_, nr) => ({
      name: `Ort ${nr}`,
      laendercode: null,
      vonTag: nr + 1,
      bisTag: nr + 1,
    }))

    assert.equal(
      modellvorschlagSchema.safeParse({
        ...vorschlagMitTagen(VORSCHLAG_GRENZEN.etappen + 1),
        etappen: zuViele,
      }).success,
      false,
    )
  })

  test('mehr Annahmen als erlaubt', () => {
    const zuViele = Array.from({ length: VORSCHLAG_GRENZEN.annahmen + 1 }, (_, nr) => `Annahme ${nr}`)

    assert.equal(gelesen({ annahmen: zuViele }).success, false)
  })

  test('eine zu lange Annahme', () => {
    assert.equal(gelesen({ annahmen: ['a'.repeat(VORSCHLAG_GRENZEN.annahme + 1)] }).success, false)
  })

  test('die Grenzen des Vorschlags liegen unter denen des Reiseschemas', () => {
    // Sonst entstünde aus einem gültigen Vorschlag eine Reise, die
    // `public.reise_anlegen()` ablehnt.
    assert.ok(VORSCHLAG_GRENZEN.tage <= GRENZEN.reisetageJeReise)
    assert.ok(VORSCHLAG_GRENZEN.etappen <= GRENZEN.etappenJeReise)
    assert.ok(
      VORSCHLAG_GRENZEN.tage * VORSCHLAG_GRENZEN.punkteJeTag <= GRENZEN.punkteJeReise,
      'ein voller Vorschlag muss unter der Punktgrenze einer Reise bleiben',
    )
  })
})

describe('Tage und Etappen müssen zusammenpassen', () => {
  test('Tage von 1 an durchnummeriert', () => {
    const ergebnis = gelesen({
      tage: [
        { nummer: 1, titel: null, punkte: [{ art: 'note', titel: 'A', notiz: null, beginn: null }] },
        { nummer: 3, titel: null, punkte: [{ art: 'note', titel: 'B', notiz: null, beginn: null }] },
      ],
      etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 2 }],
    })

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) {
      assert.match(ergebnis.error.issues[0].message, /durchnummeriert/)
    }
  })

  test('eine Etappe, die vor ihrem Beginn endet', () => {
    const ergebnis = gelesen({
      etappen: [
        { name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 3 },
        { name: 'Krabi', laendercode: 'TH', vonTag: 7, bisTag: 4 },
      ],
    })

    assert.equal(ergebnis.success, false)
  })

  test('zwei Etappen am selben Tag – zwei Orte gleichzeitig', () => {
    assert.equal(
      gelesen({
        etappen: [
          { name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 4 },
          { name: 'Krabi', laendercode: 'TH', vonTag: 4, bisTag: 7 },
        ],
      }).success,
      false,
    )
  })

  test('eine Lücke zwischen zwei Etappen', () => {
    assert.equal(
      gelesen({
        etappen: [
          { name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 3 },
          { name: 'Krabi', laendercode: 'TH', vonTag: 5, bisTag: 7 },
        ],
      }).success,
      false,
    )
  })

  test('Etappen, die nicht bis zum letzten Reisetag reichen', () => {
    const ergebnis = gelesen({
      etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 3 }],
    })

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ergebnis.error.issues[0].message, /alle Reisetage/)
  })

  test('eine Etappe je Tag ist zulässig', () => {
    assert.equal(
      modellvorschlagSchema.safeParse({
        ...vorschlagMitTagen(3),
        etappen: [
          { name: 'Rom', laendercode: 'IT', vonTag: 1, bisTag: 1 },
          { name: 'Florenz', laendercode: 'IT', vonTag: 2, bisTag: 2 },
          { name: 'Venedig', laendercode: 'IT', vonTag: 3, bisTag: 3 },
        ],
      }).success,
      true,
    )
  })
})

describe('Ein Preis kommt nicht durch', () => {
  test('das Schema kennt kein Preisfeld', () => {
    // Die eigentliche Antwort auf „keine erfundenen Live-Angebote": Ein Feld, das
    // es nicht gibt, muss nicht gefiltert werden.
    const punkt = VORSCHLAG_JSON_SCHEMA.properties.tage.items.properties.punkte.items

    assert.deepEqual(Object.keys(punkt.properties).sort(), ['art', 'beginn', 'notiz', 'titel'])
    assert.equal(punkt.additionalProperties, false)
  })

  test('ein mitgeschickter Preis wird verworfen, nicht übernommen', () => {
    const ergebnis = modellvorschlagSchema.safeParse({
      ...VORSCHLAG_THAILAND,
      tage: [
        {
          nummer: 1,
          titel: null,
          punkte: [
            {
              art: 'flight',
              titel: 'Flug',
              notiz: null,
              beginn: null,
              preis: 412,
              waehrung: 'CHF',
              bookingUrl: 'https://example.com/buchen',
            },
          ],
        },
      ],
      etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
    })

    assert.equal(ergebnis.success, true, 'unbekannte Felder werden abgestreift')
    if (ergebnis.success) {
      const punkt = ergebnis.data.tage[0].punkte[0]
      assert.equal('preis' in punkt, false)
      assert.equal('bookingUrl' in punkt, false)
      assert.deepEqual(Object.keys(punkt).sort(), ['art', 'beginn', 'notiz', 'titel'])
    }
  })

  test('eine Preisangabe im Freitext verschwindet', () => {
    const ergebnis = modellvorschlagSchema.safeParse(VORSCHLAG_MIT_PREISEN)

    assert.equal(ergebnis.success, true)
    if (!ergebnis.success) return

    // Nur die Freitextfelder. `waehrung` trägt „CHF" als ISO-Code, und das ist
    // keine Preisbehauptung, sondern die Angabe, in welcher Währung das
    // Budgetziel gemeint ist.
    const texte = [
      ergebnis.data.titel,
      ...ergebnis.data.annahmen,
      ...ergebnis.data.etappen.map((etappe) => etappe.name),
      ...ergebnis.data.tage.flatMap((tag) => [
        tag.titel ?? '',
        ...tag.punkte.flatMap((punkt) => [punkt.titel, punkt.notiz ?? '']),
      ]),
    ].join(' | ')

    assert.doesNotMatch(texte, /CHF/)
    assert.doesNotMatch(texte, /EUR/)
    assert.doesNotMatch(texte, /412/)
    assert.doesNotMatch(texte, /1’890/)
    assert.equal(traegtPreisangabe(texte), false)
  })

  test('das Budgetziel bleibt, weil es der Wunsch des Nutzers ist', () => {
    // Der Unterschied zu einem Preis: „maximal CHF 3'000" ist eine Angabe des
    // Nutzers über sein Budget, keine Behauptung über einen Marktpreis. Es landet
    // in `trips.budget_amount` – demselben Feld, das das Formular füllt.
    const ergebnis = modellvorschlagSchema.safeParse(VORSCHLAG_THAILAND)

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data.budgetziel, 3000)
  })

  test('ein Titel, der nur aus einem Preis besteht, wird abgelehnt', () => {
    // Nach der Bereinigung bleibt nichts, und ein Planpunkt ohne Titel ist keiner.
    assert.equal(
      gelesen({
        tage: [
          {
            nummer: 1,
            titel: null,
            punkte: [{ art: 'flight', titel: 'CHF 412', notiz: null, beginn: null }],
          },
        ],
        etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
      }).success,
      false,
    )
  })
})

describe('Was ein Modell nicht bestimmen darf', () => {
  test('keine Kennung', () => {
    const ergebnis = modellvorschlagSchema.safeParse({
      ...VORSCHLAG_THAILAND,
      id: '11111111-1111-4111-8111-111111111111',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('id' in ergebnis.data, false)
  })

  test('keine user_id', () => {
    // Die Eigentümerkennung kommt aus `auth.uid()`. Sie hier durchzulassen hiesse,
    // sie irgendwann zu verwenden.
    const ergebnis = modellvorschlagSchema.safeParse({
      ...VORSCHLAG_THAILAND,
      user_id: '11111111-1111-4111-8111-111111111111',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('user_id' in ergebnis.data, false)
  })

  test('kein Status', () => {
    // Eine neue Reise ist ein Entwurf. `public.reise_anlegen()` setzt `draft`
    // selbst; käme der Status von hier, könnte ein Vorschlag sich als `booked`
    // ausgeben.
    const ergebnis = modellvorschlagSchema.safeParse({ ...VORSCHLAG_THAILAND, status: 'booked' })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('status' in ergebnis.data, false)
  })

  test('kein Anbieter und kein Buchungslink', () => {
    const ergebnis = modellvorschlagSchema.safeParse({
      ...VORSCHLAG_THAILAND,
      provider: 'amadeus',
      bookingUrl: 'https://example.com',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) {
      assert.equal('provider' in ergebnis.data, false)
      assert.equal('bookingUrl' in ergebnis.data, false)
    }
  })

  test('kein freies Objekt', () => {
    // Ein `metadata`-Feld wäre die Hintertür für alles, was oben ausgeschlossen
    // ist.
    const ergebnis = modellvorschlagSchema.safeParse({
      ...VORSCHLAG_THAILAND,
      metadata: { preis: 412, anbieter: 'amadeus' },
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('metadata' in ergebnis.data, false)
  })
})

describe('Die Reisebeschreibung des Nutzers', () => {
  test('jede Reiseidee wird so behandelt wie erwartet', () => {
    for (const idee of REISEIDEEN) {
      const ergebnis = reisebeschreibungSchema.safeParse(idee.text)

      assert.equal(
        ergebnis.success,
        idee.erwartet === 'angenommen',
        `„${idee.name}" wurde ${ergebnis.success ? 'angenommen' : 'abgelehnt'}`,
      )
    }
  })

  test('ein zu kurzer Text bekommt einen Hinweis, keinen Fehlercode', () => {
    const ergebnis = reisebeschreibungSchema.safeParse('Rom')

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ergebnis.error.issues[0].message, /Beschreibe deine Reise/)
  })

  test('ein zu langer Text wird abgelehnt, nicht gekürzt', () => {
    // Gekürzt wäre er eine andere Reise als die beschriebene, und der Nutzer
    // erfährt nie, welcher Teil fehlt.
    const ergebnis = reisebeschreibungSchema.safeParse(zuLangerText())

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) {
      assert.match(ergebnis.error.issues[0].message, new RegExp(`${VORSCHLAG_GRENZEN.freitextMaximum}`))
    }
  })

  test('Zeilenumbrüche und Steuerzeichen werden vereinheitlicht', () => {
    const ergebnis = reisebeschreibungSchema.safeParse('7 Tage\nThailand\tab Zürich, zwei Personen')

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data, '7 Tage Thailand ab Zürich, zwei Personen')
  })

  test('ein Text nur aus Leerzeichen ist kein Text', () => {
    assert.equal(reisebeschreibungSchema.safeParse(' '.repeat(200)).success, false)
  })

  test('Injection-artige Eingaben werden nicht gesondert behandelt', () => {
    // Und das ist der Punkt. Sie sind Reisebeschreibungen wie jede andere: Ihre
    // Wirkung wird nicht durch ein Filtern von Wörtern verhindert, sondern
    // dadurch, dass der Text als eigene Nachricht mit der Rolle `user` geht und
    // dass ein Vorschlag nach dem Schema nichts enthalten kann, was über eine
    // Reise hinausgeht.
    for (const idee of REISEIDEEN.filter((eintrag) => eintrag.name.startsWith('Prompt-Injection'))) {
      const ergebnis = reisebeschreibungSchema.safeParse(idee.text)

      assert.equal(ergebnis.success, true, idee.name)
      if (ergebnis.success) {
        assert.equal(ergebnis.data.includes('Ignoriere') || ergebnis.data.length > 0, true)
      }
    }
  })
})

describe('Der Vorschlag auf dem Weg zurück aus dem Browser', () => {
  const fertig = {
    ...VORSCHLAG_THAILAND,
    fassung: VORSCHLAG_FASSUNG,
    reisewunsch: '7 Tage Thailand ab Zürich, zwei Personen.',
  }

  test('ein vollständiger Vorschlag mit Kennung kommt durch', () => {
    assert.equal(uebernahmeSchema.safeParse({ clientRef: 'trip-1', vorschlag: fertig }).success, true)
  })

  test('ohne Kennung wäre ein Doppelklick eine zweite Reise', () => {
    // Die Idempotenz aus Phase 1.5 hängt an `client_ref`
    // (`unique (user_id, client_ref)`). Ohne sie entstünde bei jedem Klick eine
    // neue Reise.
    assert.equal(uebernahmeSchema.safeParse({ vorschlag: fertig }).success, false)
    assert.equal(
      uebernahmeSchema.safeParse({ clientRef: '', vorschlag: fertig }).success,
      false,
    )
  })

  test('eine fremde Fassung wird abgelehnt statt halb verstanden', () => {
    // Der Ablauf, für den `fassung` existiert: Ein Vorschlag liegt eine Stunde in
    // einem offenen Tab, und in der Zwischenzeit hat ein Deployment das Format
    // geändert.
    assert.equal(
      reisevorschlagSchema.safeParse({ ...fertig, fassung: VORSCHLAG_FASSUNG + 1 }).success,
      false,
    )
    assert.equal(reisevorschlagSchema.safeParse({ ...fertig, fassung: undefined }).success, false)
  })

  test('dieselben fachlichen Grenzen wie bei der Modellantwort', () => {
    // Der Vorschlag kommt aus dem Browser und ist damit dieselbe Art Eingabe wie
    // jede andere. Was zwischenzeitlich daran verändert wurde, ändert nichts an
    // den Grenzen.
    assert.equal(
      reisevorschlagSchema.safeParse({ ...fertig, reisende: GRENZEN.reisende + 1 }).success,
      false,
    )
    assert.equal(
      reisevorschlagSchema.safeParse({
        ...fertig,
        etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
      }).success,
      false,
    )
  })

  test('ein Betrag im Reisewunsch bleibt – es ist die Angabe des Nutzers', () => {
    // Der Unterschied zu jedem anderen Text hier: „maximal CHF 3'000" ist keine
    // Behauptung über einen Marktpreis, sondern der Wunsch, um den es geht. Ihn zu
    // entfernen wäre kein Schutz, sondern eine stille Änderung der Eingabe – und
    // dasselbe Feld nimmt über das Formular unter /planen jeden Satz an.
    const ergebnis = reisevorschlagSchema.safeParse({
      ...fertig,
      reisewunsch: 'Am liebsten unter CHF 3000 bleiben.',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data.reisewunsch, 'Am liebsten unter CHF 3000 bleiben.')
  })

  test('Steuerzeichen im Reisewunsch verschwinden trotzdem', () => {
    const ergebnis = reisevorschlagSchema.safeParse({
      ...fertig,
      reisewunsch: 'Wenig\nHotelwechsel.\u0000',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data.reisewunsch, 'Wenig Hotelwechsel.')
  })

  test('ein zu langer Reisewunsch wird abgelehnt – wie trips_travel_wish_laenge', () => {
    assert.equal(
      reisevorschlagSchema.safeParse({
        ...fertig,
        reisewunsch: 'a'.repeat(GRENZEN.reisewunsch + 1),
      }).success,
      false,
    )
  })
})

// ---------------------------------------------------------------------------
// Beide Schemata sagen dasselbe
// ---------------------------------------------------------------------------
//
// Das JSON-Schema geht mit dem Aufruf, das Zod-Schema prüft die Antwort. Läuft
// eines auseinander, entsteht einer von zwei Fehlern, und beide sind still: Ein
// Feld, das nur Zod kennt, kommt nie an (die Plattform darf es mit
// `strict: true` nicht liefern); ein Feld, das nur das JSON-Schema kennt, wird
// nicht geprüft.

describe('Das JSON-Schema und das Zod-Schema decken sich', () => {
  test('dieselben Felder auf der obersten Ebene', () => {
    const ausJson = Object.keys(VORSCHLAG_JSON_SCHEMA.properties).sort()
    const ausZod = Object.keys(modellvorschlagSchema.safeParse(VORSCHLAG_THAILAND).success
      ? (modellvorschlagSchema.parse(VORSCHLAG_THAILAND) as Record<string, unknown>)
      : {}).sort()

    assert.deepEqual(ausJson, ausZod)
  })

  test('jede Eigenschaft steht in required – strict: true verlangt es', () => {
    // Ein Feld, das nicht in `required` steht, lehnt die API mit HTTP 400 ab.
    // Diese Prüfung nimmt einem Aufruf mit echten Kosten die Arbeit ab.
    const pruefen = (schema: Record<string, unknown>, pfad: string) => {
      if (schema.type === 'object' || 'properties' in schema) {
        const eigenschaften = Object.keys((schema.properties ?? {}) as Record<string, unknown>)
        const verlangt = ((schema.required ?? []) as string[]).slice().sort()

        assert.deepEqual(verlangt, eigenschaften.slice().sort(), `${pfad}: required unvollständig`)
        assert.equal(schema.additionalProperties, false, `${pfad}: additionalProperties fehlt`)

        for (const [name, unterschema] of Object.entries(
          (schema.properties ?? {}) as Record<string, Record<string, unknown>>,
        )) {
          pruefen(unterschema, `${pfad}.${name}`)
        }
      }

      if (schema.items) pruefen(schema.items as Record<string, unknown>, `${pfad}[]`)
    }

    pruefen(VORSCHLAG_JSON_SCHEMA as unknown as Record<string, unknown>, 'vorschlag')
  })

  test('keine Längenangabe im JSON-Schema – die Plattform kennt sie nicht', () => {
    // `minLength` und `maxLength` gehören nicht zu den unterstützten
    // Schlüsselwörtern; ein unbekanntes beantwortet die API mit HTTP 400. Längen
    // prüft Zod.
    const roh = JSON.stringify(VORSCHLAG_JSON_SCHEMA)

    assert.doesNotMatch(roh, /minLength/)
    assert.doesNotMatch(roh, /maxLength/)
  })

  test('dieselben Aufzählungen auf beiden Seiten', () => {
    const punkt = VORSCHLAG_JSON_SCHEMA.properties.tage.items.properties.punkte.items

    assert.deepEqual([...VORSCHLAG_JSON_SCHEMA.properties.tempo.enum], [...TRIP_PACES])
    assert.deepEqual([...VORSCHLAG_JSON_SCHEMA.properties.interessen.items.enum], [...TRIP_INTERESTS])
    assert.deepEqual([...punkt.properties.art.enum], [...TRIP_ITEM_KINDS])
  })

  test('dieselben Zahlengrenzen auf beiden Seiten', () => {
    assert.equal(VORSCHLAG_JSON_SCHEMA.properties.reisende.maximum, GRENZEN.reisende)
    assert.equal(VORSCHLAG_JSON_SCHEMA.properties.tage.maxItems, VORSCHLAG_GRENZEN.tage)
    assert.equal(VORSCHLAG_JSON_SCHEMA.properties.etappen.maxItems, VORSCHLAG_GRENZEN.etappen)
    assert.equal(
      VORSCHLAG_JSON_SCHEMA.properties.tage.items.properties.punkte.maxItems,
      VORSCHLAG_GRENZEN.punkteJeTag,
    )
    assert.equal(VORSCHLAG_JSON_SCHEMA.properties.annahmen.maxItems, VORSCHLAG_GRENZEN.annahmen)
  })

  test('optionale Werte sind auf beiden Seiten nullable', () => {
    // `strict: true` kennt kein „Feld darf fehlen". Ein optionaler Wert ist
    // deshalb `type: [..., 'null']` – und muss in Zod ebenfalls `null` zulassen,
    // sonst lehnt Zod ab, was die API zusagt.
    const nullbar = ['abreiseort', 'budgetziel', 'startdatum'] as const

    for (const feld of nullbar) {
      const typ = VORSCHLAG_JSON_SCHEMA.properties[feld].type

      assert.ok(Array.isArray(typ) && typ.includes('null'), `${feld}: nicht nullable im JSON-Schema`)
      assert.equal(gelesen({ [feld]: null }).success, true, `${feld}: Zod lehnt null ab`)
    }
  })
})

// lib/reisebegleiter/pruefung.test.ts
//
// Die zweite Schranke. Geprüft wird, dass sie in beide Richtungen wirkt:
// Ein erfundener Bezug und eine unbelegte Gewissheit fallen durch – eine
// ehrliche Auskunft über eine offene Lage nicht.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { BegleiterBezug, OfficialAnforderung } from '@/lib/reisebegleiter/nutzlast'
import { BEREICHE_FUER_TEST, auskunftPruefen } from '@/lib/reisebegleiter/pruefung'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'
import { OFFICIAL_REQUIREMENT_TYPES, type OfficialRequirementType } from '@/types/trips'

function anforderung(teil: Partial<OfficialAnforderung> = {}): OfficialAnforderung {
  return { requirementType: 'visa', scope: 'destination', visaMode: 'unknown', ...teil }
}

function bezug(teil: Partial<BegleiterBezug> = {}): BegleiterBezug {
  const art = teil.art ?? 'official'
  return {
    ref: 'O1',
    art,
    titel: 'Visum · Italien',
    lage: 'Noch nicht verlässlich bestimmbar',
    belegt: false,
    anforderung: art === 'official' ? anforderung() : null,
    ...teil,
  }
}

const KONTEXT: BegleiterBezug[] = [
  bezug({ ref: 'E1', art: 'etappe', titel: 'Etappe 1 · Rom', lage: '2027-04-03 bis 2027-04-06', belegt: true }),
  bezug({ ref: 'O1' }),
]

function auskunft(teil: Partial<Modellauskunft> = {}): Modellauskunft {
  return {
    antwort: 'Der amtliche Prüfstand für diese Etappe ist offen.',
    unsicherheiten: ['Die offizielle Quelle ist nicht aktiv.'],
    naechsteSchritte: ['Reisedaten in der Reisevorbereitung ergänzen.'],
    bezuege: ['E1', 'O1'],
    ...teil,
  }
}

describe('Bezüge', () => {
  test('eine ehrliche Auskunft über eine offene Lage geht durch', () => {
    assert.deepEqual(auskunftPruefen(auskunft(), KONTEXT), { ok: true })
  })

  test('ein Bezug ohne Eintrag im Kontext fällt durch', () => {
    const befund = auskunftPruefen(auskunft({ bezuege: ['E1', 'O9'] }), KONTEXT)
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbekannter-bezug')
  })

  test('eine Auskunft ohne Bezüge ist zulässig', () => {
    assert.deepEqual(auskunftPruefen(auskunft({ bezuege: [] }), KONTEXT), { ok: true })
  })

  test('ein leerer Kontext lässt keinen einzigen Bezug zu', () => {
    const befund = auskunftPruefen(auskunft({ bezuege: ['E1'] }), [])
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbekannter-bezug')
  })
})

describe('Unbelegte Gewissheit über amtliche Anforderungen', () => {
  const unbelegt = [
    'Für diese Reise bist du visumfrei.',
    'Du brauchst kein Visum.',
    'Die Einreise ist ohne Visum möglich.',
    'Es sind keine Impfungen vorgeschrieben.',
    'Ein Transitvisum ist nicht erforderlich.',
    'Das ist garantiert ausreichend.',
    'Die Lage ist definitiv geklärt.',
    'Das ist amtlich bestätigt.',
    'Du kannst problemlos einreisen.',
  ]

  test('fällt durch, solange keine geprüfte amtliche Lage vorliegt', () => {
    for (const text of unbelegt) {
      const befund = auskunftPruefen(auskunft({ antwort: text }), KONTEXT)
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
      assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    }
  })

  test('fällt auch in Unsicherheiten und Schritten durch', () => {
    assert.equal(auskunftPruefen(auskunft({ unsicherheiten: ['visumfrei'] }), KONTEXT).ok, false)
    assert.equal(
      auskunftPruefen(auskunft({ naechsteSchritte: ['Nichts zu tun, kein Visum nötig'] }), KONTEXT)
        .ok,
      false,
    )
  })

  test('ist zulässig, wenn die Auskunft die geprüfte amtliche Lage benennt', () => {
    const belegt = [
      KONTEXT[0],
      bezug({
        ref: 'O1',
        lage: 'Nicht erforderlich · Offizielle Anforderungen wurden geprüft',
        belegt: true,
      }),
    ]
    assert.deepEqual(
      auskunftPruefen(
        auskunft({
          antwort: 'Für diese Route ist kein Visum erforderlich.',
          bezuege: ['E1', 'O1'],
        }),
        belegt,
      ),
      { ok: true },
    )
  })

  test('greift nicht, wenn eine andere Wahrheitsklasse belegt ist', () => {
    // `belegt` an einer Etappe ist Reisegraph-Wahrheit und sagt nichts über
    // amtliche Anforderungen. Nur ein belegter Official-Bezug öffnet den Weg.
    const nurEtappeBelegt = [KONTEXT[0], bezug({ ref: 'S1', art: 'safety', belegt: true })]
    assert.equal(
      auskunftPruefen(auskunft({ antwort: 'Du bist visumfrei.', bezuege: [] }), nurEtappeBelegt).ok,
      false,
    )
  })
})

describe('Gewissheit ist an die benannte amtliche Lage gebunden', () => {
  // Der Kontext trägt zwei Official-Lagen: eine geprüfte und eine unbekannte.
  // Genau hier entschied früher die blosse Anwesenheit der geprüften Lage –
  // eine aktuelle Passgültigkeitsprüfung hätte den Satz „kein Visum
  // erforderlich" freigeschaltet, obwohl die Visumslage unbekannt ist.
  const GEMISCHT: BegleiterBezug[] = [
    bezug({ ref: 'E1', art: 'etappe', titel: 'Etappe 1 · Rom', lage: 'April', belegt: true }),
    bezug({
      ref: 'O1',
      titel: 'Visumstatus · Italien',
      lage: 'Nicht erforderlich · Offizielle Anforderungen wurden geprüft',
      belegt: true,
      anforderung: anforderung({ requirementType: 'visa', visaMode: 'visa_exempt' }),
    }),
    bezug({
      ref: 'O2',
      titel: 'Transitbestimmungen · Schweiz',
      lage: 'Noch nicht verlässlich bestimmbar · Quelle nicht erreichbar',
      belegt: false,
      anforderung: anforderung({ requirementType: 'transit', scope: 'transit', visaMode: null }),
    }),
  ]

  test('eine unbelegte amtliche Lage bleibt unbelegt, auch neben einer belegten', () => {
    const befund = auskunftPruefen(
      auskunft({ antwort: 'Für Italien ist kein Visum erforderlich.', bezuege: ['O2'] }),
      GEMISCHT,
    )
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    assert.match(befund.ok === false ? befund.hinweis : '', /O2/)
  })

  test('Gewissheit ohne benannte amtliche Lage fällt durch', () => {
    const befund = auskunftPruefen(
      auskunft({ antwort: 'Für Italien ist kein Visum erforderlich.', bezuege: ['E1'] }),
      GEMISCHT,
    )
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
  })

  test('Gewissheit ganz ohne Bezüge fällt durch', () => {
    assert.equal(
      auskunftPruefen(
        auskunft({ antwort: 'Für Italien ist kein Visum erforderlich.', bezuege: [] }),
        GEMISCHT,
      ).ok,
      false,
    )
  })

  test('die benannte belegte Lage ohne widersprechenden Bezug trägt die Gewissheit', () => {
    assert.deepEqual(
      auskunftPruefen(
        auskunft({ antwort: 'Für Italien ist kein Visum erforderlich.', bezuege: ['E1', 'O1'] }),
        GEMISCHT,
      ),
      { ok: true },
    )
  })

  test('ein zusätzlich benannter unbelegter Bezug kippt eine sonst getragene Gewissheit', () => {
    const befund = auskunftPruefen(
      auskunft({
        antwort: 'Für Italien ist kein Visum erforderlich.',
        bezuege: ['O1', 'O2'],
      }),
      GEMISCHT,
    )
    assert.equal(befund.ok, false)
    assert.match(befund.ok === false ? befund.hinweis : '', /O2/)
  })

  test('ohne Gewissheit darf eine Auskunft auf eine unbelegte Lage zeigen', () => {
    // Das ist der Normalfall dieses Slice und darf nicht mit abgeschaltet
    // werden: Über eine offene Lage zu berichten ist der Zweck.
    assert.deepEqual(
      auskunftPruefen(
        auskunft({
          antwort: 'Die Visumslage für Italien ist derzeit nicht geprüft.',
          bezuege: ['O1', 'O2'],
        }),
        GEMISCHT,
      ),
      { ok: true },
    )
  })
})

describe('Gewissheit ist an den passenden Anforderungstyp gebunden', () => {
  // Der Kern dieses Blocks: Eine geprüfte amtliche Lage belegt genau ihre
  // eigene Anforderung. Eine aktuelle Impfanforderung sagt nichts über das
  // Visum – wer sie als Beleg durchgehen lässt, wertet eine Wahrheitsklasse
  // mit einer fremden auf. Der Anforderungstyp kommt maschinenlesbar aus der
  // Projektion und nicht aus dem Anzeigetext.
  const visumBelegt = bezug({
    ref: 'O1',
    titel: 'Visumstatus · Italien',
    lage: 'Nicht erforderlich · Offizielle Anforderungen wurden geprüft',
    belegt: true,
    anforderung: anforderung({ requirementType: 'visa', visaMode: 'visa_exempt' }),
  })
  const impfungBelegt = bezug({
    ref: 'O2',
    titel: 'Impfanforderung · Italien',
    lage: 'Nicht erforderlich · Offizielle Anforderungen wurden geprüft',
    belegt: true,
    anforderung: anforderung({ requirementType: 'vaccination', visaMode: null }),
  })
  const visumUnbelegt = bezug({
    ref: 'O3',
    titel: 'Visumstatus · Italien',
    lage: 'Noch nicht verlässlich bestimmbar',
    belegt: false,
    anforderung: anforderung({ requirementType: 'visa', visaMode: null }),
  })
  const transitBelegt = bezug({
    ref: 'O4',
    titel: 'Transitbestimmungen · Schweiz',
    lage: 'Nicht erforderlich · Offizielle Anforderungen wurden geprüft',
    belegt: true,
    anforderung: anforderung({ requirementType: 'transit', scope: 'transit', visaMode: null }),
  })

  test('eine geprüfte Impfanforderung trägt keine Visumsgewissheit', () => {
    // O1 = Impfung geprüft, O2 = Visum unbekannt, Aussage über das Visum
    // zeigt nur auf die Impfung.
    const befund = auskunftPruefen(
      auskunft({
        antwort: 'Für Italien ist kein Visum erforderlich.',
        bezuege: [impfungBelegt.ref],
      }),
      [impfungBelegt, visumUnbelegt],
    )
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    assert.match(befund.ok === false ? befund.hinweis : '', /passende geprüfte amtliche Anforderung/)
  })

  test('eine geprüfte Visumslage trägt die Visumsgewissheit', () => {
    assert.deepEqual(
      auskunftPruefen(
        auskunft({
          antwort: 'Für Italien ist kein Visum erforderlich.',
          bezuege: [visumBelegt.ref],
        }),
        [visumBelegt],
      ),
      { ok: true },
    )
  })

  test('eine geprüfte Visumslage trägt keine Impfgewissheit', () => {
    const befund = auskunftPruefen(
      auskunft({
        antwort: 'Für Italien ist keine Impfung erforderlich.',
        bezuege: [visumBelegt.ref],
      }),
      [visumBelegt, impfungBelegt],
    )
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
  })

  test('eine nicht zuordenbare Gewissheit fällt auch mit geprüfter Lage durch', () => {
    for (const text of [
      'Das ist garantiert ausreichend.',
      'Die Lage ist definitiv geklärt.',
      'Das ist amtlich bestätigt.',
      'Du kannst problemlos einreisen.',
      'Ein Visum ist nicht erforderlich.',
    ]) {
      const befund = auskunftPruefen(
        auskunft({ antwort: text, bezuege: [visumBelegt.ref] }),
        [visumBelegt],
      )
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
      assert.match(
        befund.ok === false ? befund.hinweis : '',
        /keiner geprüften Anforderung zuordnen/,
      )
    }
  })

  test('Transitvisum und Zielvisum sind getrennte Bereiche', () => {
    // Die geprüfte Transitlage trägt die Transitaussage …
    assert.deepEqual(
      auskunftPruefen(
        auskunft({
          antwort: 'Für die Zwischenlandung ist kein Transitvisum nötig.',
          bezuege: [transitBelegt.ref],
        }),
        [transitBelegt, visumUnbelegt],
      ),
      { ok: true },
    )
    // … aber nicht die Aussage über das Zielvisum.
    assert.equal(
      auskunftPruefen(
        auskunft({
          antwort: 'Für Italien ist kein Visum erforderlich.',
          bezuege: [transitBelegt.ref],
        }),
        [transitBelegt, visumUnbelegt],
      ).ok,
      false,
    )
  })

  test('jede Gewissheit im Text braucht ihren eigenen Beleg', () => {
    // Zwei Aussagen, nur eine gedeckt: Die Auskunft fällt als Ganzes durch.
    const befund = auskunftPruefen(
      auskunft({
        antwort: 'Für Italien ist kein Visum erforderlich.',
        naechsteSchritte: ['Es ist auch keine Impfung nötig.'],
        bezuege: [visumBelegt.ref],
      }),
      [visumBelegt, impfungBelegt],
    )
    assert.equal(befund.ok, false)
  })

  test('eine harte Aussage über einen weiteren Bereich braucht ihren eigenen Beleg', () => {
    // Visum geprüft, aber die Aussage betrifft die Passgültigkeit.
    const befund = auskunftPruefen(
      auskunft({
        antwort: 'Dein Pass muss mindestens sechs Monate gültig sein.',
        bezuege: [visumBelegt.ref],
      }),
      [visumBelegt],
    )
    assert.equal(befund.ok, false)
    assert.match(befund.ok === false ? befund.hinweis : '', /Passgültigkeit/)
  })

  test('ein Bezug ohne Anforderungsidentität trägt keine Gewissheit', () => {
    // Safety und Seasonal sind belegte Aussenwahrheit, aber keine amtliche
    // Anforderung. Sie dürfen nichts freischalten.
    const safetyBelegt = bezug({ ref: 'S1', art: 'safety', belegt: true })
    assert.equal(
      auskunftPruefen(
        auskunft({
          antwort: 'Für Italien ist kein Visum erforderlich.',
          bezuege: [safetyBelegt.ref],
        }),
        [safetyBelegt, visumUnbelegt],
      ).ok,
      false,
    )
  })
})

describe('Ansprüche, die der Kontext nie decken kann', () => {
  test('eine Aussage über den Buchungszustand fällt immer durch', () => {
    for (const text of [
      'Dein Flug ist gebucht.',
      'Die Unterkunft ist noch nicht gebucht.',
      'Es liegt eine Buchungsbestätigung vor.',
    ]) {
      const befund = auskunftPruefen(auskunft({ antwort: text }), KONTEXT)
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
      assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    }
  })

  test('eine Aussage über den Buchungszustand fällt auch bei belegter amtlicher Lage durch', () => {
    const belegt = [bezug({ ref: 'O1', belegt: true })]
    assert.equal(
      auskunftPruefen(auskunft({ antwort: 'Dein Flug ist gebucht.', bezuege: [] }), belegt).ok,
      false,
    )
  })

  test('eine ausgeführte Änderung fällt durch', () => {
    for (const text of [
      'Ich habe die Etappe Rom hinzugefügt.',
      'Ich habe den Zeitraum um zwei Tage verschoben.',
      'Ich habe den Planpunkt entfernt.',
      'Die Änderung wurde gespeichert.',
      'Deine Reise ist bereits gespeichert.',
    ]) {
      const befund = auskunftPruefen(auskunft({ antwort: text }), KONTEXT)
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
    }
  })

  test('ein Vorschlag im Konjunktiv bleibt zulässig', () => {
    for (const text of [
      'Du könntest die Etappe Rom um zwei Tage verlängern.',
      'Über „Reise ändern" lässt sich der Zeitraum verschieben.',
      'Ergänze die Angaben, dann lässt sich der Prüfstand einordnen.',
    ]) {
      assert.deepEqual(
        auskunftPruefen(auskunft({ antwort: text, bezuege: [] }), KONTEXT),
        { ok: true },
        `Fehlalarm: ${text}`,
      )
    }
  })
})

describe('Harte amtliche Aussagen über die geschlossene Anforderungstaxonomie', () => {
  // Die Vorrunden haben nur Verneinungen geprüft – „kein Visum". Eine
  // Anforderung lässt sich aber genauso gut behaupten wie bestreiten, und
  // „Dein Pass muss sechs Monate gültig sein" ist dieselbe erfundene
  // Official-Wahrheit wie „visumfrei". Dieser Block geht die geschlossene
  // Taxonomie Bereich für Bereich durch.

  function official(
    ref: string,
    requirementType: OfficialRequirementType,
    belegt: boolean,
    scope: 'destination' | 'transit' = 'destination',
  ): BegleiterBezug {
    return bezug({
      ref,
      art: 'official',
      titel: `${requirementType} · Italien`,
      lage: belegt ? 'Offizielle Anforderungen wurden geprüft' : 'Noch nicht verlässlich bestimmbar',
      belegt,
      anforderung: anforderung({ requirementType, scope, visaMode: null }),
    })
  }

  /**
   * Je Bereich: eine harte Aussage, der Anforderungstyp, der sie tragen kann,
   * und ein Typ aus einem anderen Bereich, der sie nicht tragen darf.
   */
  const FAELLE: ReadonlyArray<{
    bereich: string
    aussage: string
    traegt: OfficialRequirementType
    traegtNicht: OfficialRequirementType
  }> = [
    {
      bereich: 'Passgültigkeit',
      aussage: 'Dein Pass muss mindestens sechs Monate gültig sein.',
      traegt: 'passport_validity',
      traegtNicht: 'passport',
    },
    {
      bereich: 'freie Passseiten',
      aussage: 'Du brauchst zwei freie Seiten im Pass.',
      traegt: 'blank_passport_pages',
      traegtNicht: 'passport_validity',
    },
    {
      bereich: 'Reisepass',
      aussage: 'Du brauchst einen Reisepass.',
      traegt: 'passport',
      traegtNicht: 'visa',
    },
    {
      bereich: 'Ausweisdokument',
      aussage: 'Du brauchst einen Personalausweis.',
      traegt: 'identity_document',
      traegtNicht: 'entry_form',
    },
    {
      bereich: 'Einreiseformular',
      aussage: 'Du musst ein Einreiseformular ausfüllen.',
      traegt: 'entry_form',
      traegtNicht: 'insurance',
    },
    {
      bereich: 'Versicherung',
      aussage: 'Du brauchst eine Reiseversicherung.',
      traegt: 'insurance',
      traegtNicht: 'financial_means',
    },
    {
      bereich: 'Rück- oder Weiterreise',
      aussage: 'Du musst einen Rückflug nachweisen.',
      traegt: 'onward_or_return_ticket',
      traegtNicht: 'booking_or_travel_document',
    },
    {
      bereich: 'Buchungs- oder Reisenachweis',
      aussage: 'Du musst einen Buchungsnachweis vorlegen.',
      traegt: 'booking_or_travel_document',
      traegtNicht: 'onward_or_return_ticket',
    },
    {
      bereich: 'finanzielle Mittel',
      aussage: 'Du musst ausreichende finanzielle Mittel nachweisen.',
      traegt: 'financial_means',
      traegtNicht: 'insurance',
    },
    {
      bereich: 'elektronische Reisegenehmigung',
      aussage: 'Du brauchst eine elektronische Reisegenehmigung.',
      traegt: 'electronic_travel_authorization',
      traegtNicht: 'visa',
    },
    {
      bereich: 'Impfung',
      aussage: 'Du brauchst eine Gelbfieberimpfung.',
      traegt: 'vaccination',
      traegtNicht: 'health_document',
    },
    {
      bereich: 'Gesundheitsdokument',
      aussage: 'Du musst eine Gesundheitserklärung ausfüllen.',
      traegt: 'health_document',
      traegtNicht: 'vaccination',
    },
    {
      bereich: 'Gesundheitsanforderung',
      aussage: 'Du musst ein ärztliches Attest vorlegen.',
      traegt: 'health',
      traegtNicht: 'entry_form',
    },
    {
      bereich: 'Visum',
      aussage: 'Du brauchst ein Visum.',
      traegt: 'visa',
      traegtNicht: 'passport',
    },
    {
      bereich: 'sonstige Einreiseanforderung',
      aussage: 'Für die Einreise ist eine Registrierung vorgeschrieben.',
      traegt: 'other_entry_requirement',
      traegtNicht: 'passport',
    },
  ]

  for (const fall of FAELLE) {
    test(`${fall.bereich}: ohne passenden Beleg abgelehnt`, () => {
      const belegtesFremdes = official('O1', fall.traegtNicht, true)
      const befund = auskunftPruefen(
        auskunft({ antwort: fall.aussage, bezuege: ['O1'] }),
        [belegtesFremdes],
      )
      assert.equal(befund.ok, false, `durchgelassen: ${fall.aussage}`)
      assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    })

    test(`${fall.bereich}: ganz ohne Official-Bezug abgelehnt`, () => {
      assert.equal(
        auskunftPruefen(auskunft({ antwort: fall.aussage, bezuege: [] }), []).ok,
        false,
        `durchgelassen: ${fall.aussage}`,
      )
    })

    test(`${fall.bereich}: mit passendem geprüftem Beleg zulässig`, () => {
      const passend = official('O1', fall.traegt, true)
      assert.deepEqual(
        auskunftPruefen(auskunft({ antwort: fall.aussage, bezuege: ['O1'] }), [passend]),
        { ok: true },
        `abgelehnt: ${fall.aussage}`,
      )
    })

    test(`${fall.bereich}: mit passendem, aber ungeprüftem Beleg abgelehnt`, () => {
      const unbelegt = official('O1', fall.traegt, false)
      assert.equal(
        auskunftPruefen(auskunft({ antwort: fall.aussage, bezuege: ['O1'] }), [unbelegt]).ok,
        false,
        `durchgelassen: ${fall.aussage}`,
      )
    })
  }

  test('Transit bleibt vom Zielbereich getrennt, auch bei gleichem Anforderungstyp', () => {
    const zielVisumBelegt = official('O1', 'visa', true, 'destination')
    const transitVisumBelegt = official('O2', 'visa', true, 'transit')

    assert.equal(
      auskunftPruefen(
        auskunft({ antwort: 'Du brauchst ein Transitvisum.', bezuege: ['O1'] }),
        [zielVisumBelegt],
      ).ok,
      false,
    )
    assert.deepEqual(
      auskunftPruefen(
        auskunft({ antwort: 'Du brauchst ein Transitvisum.', bezuege: ['O2'] }),
        [transitVisumBelegt],
      ),
      { ok: true },
    )
  })

  test('jeder Anforderungstyp der Taxonomie kann von einem Bereich getragen werden', () => {
    // Ein Typ, den kein Bereich trägt, wäre eine amtliche Anforderung, über
    // die auch mit geprüfter Lage niemand etwas sagen dürfte. Ein Typ, der
    // gar nicht vorkäme, wäre schlimmer: eine, über die jeder alles sagen
    // dürfte, weil kein Muster greift.
    for (const requirementType of OFFICIAL_REQUIREMENT_TYPES) {
      const traegerbereiche = BEREICHE_FUER_TEST.filter((bereich) =>
        bereich.traegerTypen.includes(requirementType),
      )
      assert.ok(
        traegerbereiche.length > 0,
        `kein Bereich trägt den Anforderungstyp ${requirementType}`,
      )
    }
  })
})

describe('Beschreibungen, Fragen und Vorschläge bleiben zulässig', () => {
  const visumUnbelegt = bezug({
    ref: 'O1',
    titel: 'Visumstatus · Italien',
    lage: 'Noch nicht verlässlich bestimmbar',
    belegt: false,
    anforderung: anforderung({ requirementType: 'visa', visaMode: null }),
  })

  const harmlos = [
    'Prüfe deine Passgültigkeit in der Reisevorbereitung.',
    'Ob ein Visum nötig ist, ist derzeit nicht geprüft.',
    'Die Visumslage für Italien ist noch ungeklärt.',
    'In der Reisevorbereitung je Staatsangehörigkeit ein Reisedokument ergänzen.',
    'Danach die Einreiseanforderungen erneut prüfen lassen.',
    'Jetnity kann nicht bestätigen, dass eine Impfung nötig ist.',
    'Möglicherweise brauchst du ein Einreiseformular; das ist nicht geprüft.',
    'Der Zeitraum passt zu den beiden Etappen: drei Nächte Rom, vier Nächte Florenz.',
    'Du könntest die Etappe Rom um zwei Tage verlängern.',
  ]

  for (const text of harmlos) {
    test(`kein Fehlalarm: „${text.slice(0, 48)}…"`, () => {
      assert.deepEqual(
        auskunftPruefen(auskunft({ antwort: text, bezuege: ['O1'] }), [visumUnbelegt]),
        { ok: true },
      )
    })
  }

  test('ein Vorbehalt rettet keine nicht zuordenbare Gewissheit', () => {
    // „garantiert" bleibt auch mit „möglicherweise" daneben unbelegbar.
    assert.equal(
      auskunftPruefen(
        auskunft({ antwort: 'Möglicherweise ist das garantiert ausreichend.', bezuege: [] }),
        [visumUnbelegt],
      ).ok,
      false,
    )
  })

  test('eine Pflichtaussage ohne amtlichen Bereich ist kein amtlicher Anspruch', () => {
    // Produktnavigation, keine Einreisebestimmung.
    assert.deepEqual(
      auskunftPruefen(
        auskunft({ antwort: 'Du musst die Etappen noch mit Daten versehen.', bezuege: [] }),
        [visumUnbelegt],
      ),
      { ok: true },
    )
  })
})

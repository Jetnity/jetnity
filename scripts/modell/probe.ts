#!/usr/bin/env node
// Ein einziger echter Modellaufruf – von Hand, nie in der CI.
//
// Alles andere am Modellweg ist ohne bezahlten Aufruf geprüft: Grenzen, Schema,
// Abbildung, Fehlerklassen und Kostenschranke laufen in `npm test` und
// `npm run db:kontingent` gegen Fixtures und gegen die echte Datenbank. Was dort
// grundsätzlich nicht geprüft werden kann, ist die Gegenseite:
//
//   · Nimmt die Responses API dieses JSON-Schema mit `strict: true` an?
//   · Liefert das Modell darin eine Reise, die Jetnitys Grenzen einhält?
//   · Lässt sich diese Antwort auf das Phase-1.5-Domainmodell abbilden?
//   · Was kostet ein typischer Aufruf wirklich?
//
// Genau diese vier Fragen beantwortet dieses Skript, und zwar mit einem Aufruf
// je Lauf. Es steht deshalb nicht in `npm test` und in keinem CI-Job: Eine
// Prüfung, die bei jedem Push Geld kostet, ist eine Rechnung und keine Prüfung.
//
// ---------------------------------------------------------------------------
// Was der Lauf gemeinsam mit der Anwendung benutzt
// ---------------------------------------------------------------------------
//
// Den Anfragekörper (`lib/modell/anfrage.ts`), die Systemregeln, das JSON-Schema,
// die Antwortauswertung (`lib/modell/antwort.ts`), die Schemaprüfung und die
// Abbildung. Ein Nachweis mit einer eigenen, ähnlichen Anfrage sagt nichts über
// den Weg, den ein Reisender nimmt.
//
// Auch das Kontingent ist dasselbe: Der Lauf beansprucht es über die echte RPC
// und schliesst es ab. Ein Aufruf, der am Tagesbudget vorbeigeht, wäre ein Loch
// in genau der Schranke, die er belegen soll.
//
// Aufruf:
//   npm run modell:probe                      # Idee 1 des festen Satzes
//   npm run modell:probe -- --idee 4          # eine andere Idee
//   npm run modell:probe -- --text "…"        # eigener Text
//   npm run modell:probe -- --liste           # nur die Ideen zeigen, nichts aufrufen
//
// Voraussetzungen: `OPENAI_API_KEY` und `JETNITY_MODELL_AKTIV=true` in der
// Umgebung dieses Laufs, dazu `SUPABASE_ACCESS_TOKEN` und
// `SUPABASE_PROJECT_REF` für das Kontingent. Fehlt etwas, sagt der Lauf welches
// und ruft nichts auf.

import { ENDPUNKT, anfragekoerper } from '@/lib/modell/anfrage'
import { rohergebnisAus } from '@/lib/modell/antwort'
import { modellZustand, timeoutMsFuer } from '@/lib/modell/konfiguration'
import { alsUsd, kostenMikroUsd } from '@/lib/modell/preise'
import { vorschlagAlsNutzlast } from '@/lib/reisevorschlag/abbildung'
import { REISEIDEEN } from '@/lib/reisevorschlag/fixtures/reiseideen'
import { systemregeln } from '@/lib/reisevorschlag/regeln'
import {
  VORSCHLAG_FASSUNG,
  VORSCHLAG_JSON_SCHEMA,
  VORSCHLAG_SCHEMA_NAME,
  modellvorschlagSchema,
  reisebeschreibungSchema,
} from '@/lib/reisevorschlag/schema'
import { GRENZEN, ersteMeldung, reiseNutzlastSchema } from '@/lib/trips/schema'

import { runSql } from '../db/sql.mjs'

function argument(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

/** Nur die Anwesenheit zählt, nie der Wert. */
function fehlendeVariablen(): string[] {
  return ['OPENAI_API_KEY', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF'].filter(
    (name) => !process.env[name]?.trim(),
  )
}

async function main() {
  if (process.argv.includes('--liste')) {
    for (const [i, idee] of REISEIDEEN.entries()) {
      console.log(`${String(i + 1).padStart(2)}  ${idee.erwartet.padEnd(10)} ${idee.name}`)
      console.log(`    ${idee.text.slice(0, 120)}${idee.text.length > 120 ? '…' : ''}`)
    }
    return
  }

  const fehlend = fehlendeVariablen()
  if (fehlend.length > 0) {
    console.error(
      `Dieser Lauf braucht ${fehlend.join(', ')} in der Umgebung.\n` +
        'Ohne Schlüssel gibt es keinen Aufruf – und keinen erfundenen Ersatz.',
    )
    process.exit(1)
  }

  // Derselbe Kill Switch wie in der Anwendung. Ein Nachweis, der ihn umgeht,
  // beweist einen Weg, den es in Produktion nicht gibt.
  const zustand = modellZustand()
  if (!zustand.aktiv) {
    console.error(
      `Der Modellweg ist nicht aktiv (${zustand.grund}).\n` +
        'Für diesen Lauf JETNITY_MODELL_AKTIV=true setzen – nur lokal, nicht in Production.',
    )
    process.exit(1)
  }

  const eigener = argument('text')
  const nummer = Number(argument('idee') ?? 1)
  const idee = eigener ?? REISEIDEEN[nummer - 1]?.text
  if (!idee) {
    console.error(`Keine Idee ${nummer}. --liste zeigt die vorhandenen.`)
    process.exit(1)
  }

  const beschreibung = reisebeschreibungSchema.safeParse(idee)
  if (!beschreibung.success) {
    // Kein Fehlschlag des Laufs: Zwei Ideen des Satzes sind genau dafür da, und
    // die Eingabeprüfung vor dem Aufruf ist die billigste Kostenkontrolle.
    console.log(`Die Eingabe kommt nicht durch: ${ersteMeldung(beschreibung.error)}`)
    console.log('Kein Aufruf, keine Kosten.')
    return
  }

  console.log(`Modell ${zustand.modell}, Denkaufwand ${zustand.aufwand}`)
  console.log(`Idee: ${beschreibung.data.slice(0, 160)}${beschreibung.data.length > 160 ? '…' : ''}\n`)

  // Kontingent über denselben Weg wie die Anwendung, als Gast.
  const kennung = `probe-${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`
  let id: string
  try {
    const rows = await runSql(`begin;
select set_config('role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select public.modell_kontingent_beanspruchen('reisevorschlag', '${zustand.modell}', '${kennung}')::text as id;
commit;`)
    id = rows[0].id
  } catch (fehler) {
    console.error(
      `Kein Kontingent: ${fehler instanceof Error ? fehler.message : String(fehler)}\n` +
        'Kein Aufruf. Das ist der beabsichtigte Ausgang, wenn das Tagesbudget erschöpft ist.',
    )
    process.exit(1)
  }

  const heute = new Date().toISOString().slice(0, 10)
  const beginn = Date.now()

  const antwort = await fetch(ENDPUNKT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
      'content-type': 'application/json',
    },
    body: anfragekoerper({
      modell: zustand.modell,
      aufwand: zustand.aufwand,
      systemregeln: systemregeln(heute),
      nutzertext: beschreibung.data,
      schemaName: VORSCHLAG_SCHEMA_NAME,
      jsonSchema: VORSCHLAG_JSON_SCHEMA,
    }),
    signal: AbortSignal.timeout(timeoutMsFuer(zustand.modell)),
  })

  const laufzeitMs = Date.now() - beginn
  const ergebnis = rohergebnisAus(antwort.status, await antwort.json().catch(() => null))

  const nutzung = ergebnis.nutzung
  const kosten = nutzung ? kostenMikroUsd(zustand.modell, nutzung) : null
  const klasse = ergebnis.ok ? 'erfolg' : ergebnis.klasse

  console.log(`Laufzeit ${laufzeitMs} ms, Klasse ${klasse}`)
  if (nutzung) {
    console.log(
      `Tokens: ${nutzung.eingabeTokens} ein (davon ${nutzung.gecachteTokens} gecacht), ` +
        `${nutzung.ausgabeTokens} aus`,
    )
    console.log(`Kosten: ${kosten} µ$ = ${alsUsd(kosten ?? 0)} USD`)
  } else {
    console.log('Die API hat keine Tokens berichtet – die Reservierung bleibt stehen.')
  }

  const abschliessen = (ergebnisklasse: string) =>
    runSql(`begin;
select set_config('role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select public.modell_nutzung_abschliessen(
  '${id}', '${ergebnisklasse}',
  ${nutzung ? nutzung.eingabeTokens : 'null'},
  ${nutzung ? nutzung.gecachteTokens : 'null'},
  ${nutzung ? nutzung.ausgabeTokens : 'null'},
  ${laufzeitMs});
commit;`)

  if (!ergebnis.ok) {
    await abschliessen(ergebnis.klasse)
    console.error(`\nKein Vorschlag: ${ergebnis.hinweis}`)
    process.exit(1)
  }

  const roh: unknown = (() => {
    try {
      return JSON.parse(ergebnis.text) as unknown
    } catch {
      return null
    }
  })()

  if (roh === null) {
    await abschliessen('ungueltige-antwort')
    console.error('\nDie Antwort war kein JSON.')
    process.exit(1)
  }

  const geprueft = modellvorschlagSchema.safeParse(roh)
  if (!geprueft.success) {
    await abschliessen('schema')
    console.error(`\nDie Antwort verletzt Jetnitys Grenzen: ${ersteMeldung(geprueft.error)}`)
    console.error(JSON.stringify(roh, null, 2))
    process.exit(1)
  }

  await abschliessen('erfolg')

  const vorschlag = {
    ...geprueft.data,
    fassung: VORSCHLAG_FASSUNG as typeof VORSCHLAG_FASSUNG,
    reisewunsch: beschreibung.data.slice(0, GRENZEN.reisewunsch) || null,
  }

  // Die eigentliche Frage dieses Laufs: Passt die Antwort auf das Domainmodell?
  // Ein Vorschlag, den `public.reise_anlegen()` ablehnen würde, ist kein
  // Vorschlag – er wäre eine Enttäuschung nach dem Klick auf „Übernehmen“.
  const nutzlast = reiseNutzlastSchema.safeParse(vorschlagAlsNutzlast(vorschlag, 'probe'))
  if (!nutzlast.success) {
    console.error(`\nDie Abbildung auf das Reiseschema scheitert: ${ersteMeldung(nutzlast.error)}`)
    process.exit(1)
  }

  console.log('\n--- Vorschlag ---')
  console.log(vorschlag.titel)
  console.log(
    [
      vorschlag.abreiseort ? `ab ${vorschlag.abreiseort}` : 'kein Abreiseort',
      `${vorschlag.tage.length} Tage`,
      vorschlag.startdatum ? `ab ${vorschlag.startdatum}` : 'ohne Datum',
      `${vorschlag.reisende} Reisende`,
      vorschlag.budgetziel === null
        ? 'kein Budgetziel'
        : `Budgetziel ${vorschlag.waehrung} ${vorschlag.budgetziel}`,
      `Tempo ${vorschlag.tempo}`,
      vorschlag.interessen.length ? vorschlag.interessen.join('/') : 'keine Interessen',
    ].join(' · '),
  )

  console.log('\n  Etappen')
  for (const etappe of vorschlag.etappen) {
    const land = etappe.laendercode ? ` (${etappe.laendercode})` : ''
    console.log(`    Tag ${etappe.vonTag}–${etappe.bisTag}  ${etappe.name}${land}`)
  }

  for (const tag of vorschlag.tage) {
    console.log(`\n  Tag ${tag.nummer}${tag.titel ? `: ${tag.titel}` : ''}`)
    for (const punkt of tag.punkte) {
      console.log(`    ${(punkt.beginn ?? '  –  ').padEnd(6)} [${punkt.art}] ${punkt.titel}`)
    }
  }

  if (vorschlag.annahmen.length > 0) {
    console.log('\n  Annahmen')
    for (const annahme of vorschlag.annahmen) console.log(`    · ${annahme}`)
  }

  const punkte = vorschlag.tage.reduce((summe, tag) => summe + tag.punkte.length, 0)
  console.log(
    `\nAbbildung auf public.reise_anlegen() geprüft: ${vorschlag.etappen.length} Etappen, ` +
      `${vorschlag.tage.length} Tage, ${punkte} Planpunkte.`,
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

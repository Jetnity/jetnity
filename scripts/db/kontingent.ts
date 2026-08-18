#!/usr/bin/env node
// Nachweis, dass die Kostenschranke der Modellaufrufe hält – gegen die echte
// Datenbank, mit echten Zeilen und echter Parallelität.
//
// Warum ein eigenes Skript neben `db:sicherheit`:
//
// Jener Nachweis läuft vollständig in EINER Transaktion, die am Ende zurückrollt.
// Das ist richtig für Rechte und Policies und blind für alles, was diese Schranke
// ausmacht. Ein Kontingent ist eine Aussage über *mehrere* Aufrufe; in einer
// einzigen Transaktion gibt es keine mehreren Aufrufe. Und die Prüfung ist ein
// Lesen mit anschliessendem Schreiben – ohne echte Gleichzeitigkeit ist der
// Wettlauf, gegen den `pg_advisory_xact_lock` gesetzt wurde, nicht messbar
// (dieselbe Lehre wie in ADR-0049, siehe `db:parallelitaet`).
//
// Was hier bewiesen wird, ist deshalb nicht „die Funktion antwortet", sondern:
//
//   · jede der fünf Grenzen greift genau an ihrem Rand, nicht davor,
//   · eine Grenze lässt den letzten erlaubten Aufruf durch,
//   · Gäste können das Kontingent der Konten nicht aufbrauchen,
//   · unter Gleichzeitigkeit kommt bei einem freien Platz genau einer durch,
//   · ein Abschluss wirkt genau einmal und rechnet die Kosten selbst,
//   · ein angemeldetes Konto kann sich nicht als Gast ausgeben.
//
// Die Zahlen stehen nicht in diesem Skript. Sie kommen aus
// `lib/modell/konfiguration.ts`, und dass die Datenbank dieselben durchsetzt,
// prüft `lib/modell/grenzen-datenbank.test.ts` ohne Datenbank. Eine dritte
// Abschrift hier wäre die Stelle, an der beide Seiten auseinanderlaufen, ohne
// dass es jemand merkt.
//
// Das Skript schreibt echte Zeilen und räumt sie danach auf. Es läuft nur gegen
// den Development-Branch, auf den `SUPABASE_PROJECT_REF` zeigt – wie jedes
// Skript in diesem Verzeichnis.
//
// Aufruf:
//   npm run db:kontingent
//   npm run db:kontingent -- --nur Parallelität   # nur Fälle mit diesem Text im Namen
//
// Der Filter ist für die Gegenprobe da: Wer wissen will, ob ein Nachweis wirklich
// etwas nachweist, nimmt die Sperre aus der Funktion und lässt genau diesen Fall
// laufen. Ohne `pg_advisory_xact_lock` kommen 6 von 6 Sitzungen durch statt 1
// (gemessen, festgehalten in DECISIONS.md ADR-0052).

import { MODELL_GRENZEN, MODELL_VORGABE } from '@/lib/modell/konfiguration'
import { reservierungMikroUsd } from '@/lib/modell/preise'

import { runSql } from './sql.mjs'

const MODELL = MODELL_VORGABE

/** Was ein Aufruf vor dem Aufruf kostet – dieselbe Rechnung wie in der Funktion. */
const RESERVIERUNG = reservierungMikroUsd(
  MODELL,
  MODELL_GRENZEN.eingabeTokensSchaetzung,
  MODELL_GRENZEN.ausgabeTokens,
)

// Ein eigenes Konto, das kein anderer Nachweis benutzt. Die Kennung ist fest,
// damit ein abgebrochener Lauf beim nächsten Mal aufgeräumt wird.
const KONTO = 'ffffffff-0000-4000-8000-00000000f002'
const INSTANCE = '00000000-0000-0000-0000-000000000000'

// Alle Gastkennungen dieses Nachweises tragen dieses Präfix. Ihre Hashes sind
// damit berechenbar, und das Aufräumen trifft ausschliesslich eigene Zeilen.
const PRAEFIX = 'kontingent-nachweis-'
const KENNUNGEN = 80

const SITZUNGEN = 6
const VORLAUF_MS = 2500
const HALTEN_S = 0.8

const gastkennung = (nr: number) => `${PRAEFIX}${nr}`

/** Der Hash, den die Funktion für eine Gastkennung bildet. */
const gastHash = (nr: number) =>
  `encode(sha256(convert_to('gast:${gastkennung(nr)}', 'UTF8')), 'hex')`

const kontoHash = `encode(sha256(convert_to('konto:${KONTO}', 'UTF8')), 'hex')`

/** Rolle und Anspruch so setzen, wie PostgREST es zur Laufzeit tut. */
function alsRolle(konto: string | null): string {
  if (!konto) {
    return `select set_config('role', 'anon', true);
            select set_config('request.jwt.claims', '', true);`
  }
  return `select set_config('role', 'authenticated', true);
          select set_config('request.jwt.claims', '{"sub":"${konto}","role":"authenticated"}', true);`
}

function beanspruchenSql(gast: number | null): string {
  const kennung = gast === null ? 'null' : `'${gastkennung(gast)}'`
  return `select public.modell_kontingent_beanspruchen('reisevorschlag', '${MODELL}', ${kennung})::text as id;`
}

/** Aus dem Fehlertext der Management-API den SQLSTATE herausziehen. */
function sqlstate(fehler: Error): string {
  const treffer = /ERROR:\s+([0-9A-Z]{5}):/.exec(fehler.message)
  return treffer ? treffer[1] : 'unbekannt'
}

type Versuch = { ok: true; id: string } | { ok: false; code: string }

async function beanspruchen(gast: number | null, konto: string | null = null): Promise<Versuch> {
  try {
    const rows = await runSql(`begin;
${alsRolle(konto)}
${beanspruchenSql(gast)}
commit;`)
    return { ok: true, id: rows[0].id }
  } catch (fehler) {
    return { ok: false, code: sqlstate(fehler as Error) }
  }
}

async function aufraeumen(): Promise<void> {
  await runSql(`
delete from public.model_usage
 where kennung_hash = ${kontoHash}
    or kennung_hash in (
      select encode(sha256(convert_to('gast:${PRAEFIX}' || g, 'UTF8')), 'hex')
        from generate_series(1, ${KENNUNGEN}) as g
    );
delete from auth.users where id = '${KONTO}';`)
}

/**
 * Fremde Zeilen im Tagesfenster würden die Tagesgrenzen mitzählen und jeden
 * Rand um genau so viele Plätze verschieben. Ein Nachweis, der das übersieht,
 * behauptet einen Rand, den er nicht gemessen hat.
 */
async function fremdeZeilen(): Promise<number> {
  const rows = await runSql(`
select count(*) as anzahl
  from public.model_usage
 where created_at >= now() - interval '1 day'
   and kennung_hash <> ${kontoHash}
   and kennung_hash not in (
     select encode(sha256(convert_to('gast:${PRAEFIX}' || g, 'UTF8')), 'hex')
       from generate_series(1, ${KENNUNGEN}) as g
   )`)
  return Number(rows[0].anzahl)
}

async function konto(): Promise<void> {
  await runSql(`
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values ('${KONTO}', '${INSTANCE}', 'authenticated', 'authenticated',
          'kontingent@example.invalid', 'x', now(), now(), now())
  on conflict (id) do nothing;`)
}

type Saat = {
  /** Wie viele Zeilen. */
  anzahl: number
  /** Auf welche Kennungen: eine einzige oder je Zeile eine eigene. */
  kennung: 'eine' | 'je-zeile'
  art?: 'gast' | 'konto'
  /** Alter der Zeilen. `'stunde'` liegt im Stundenfenster, `'tag'` darüber. */
  alter?: 'stunde' | 'tag'
  /** Kosten je Zeile in µ$. Ohne Angabe die Reservierung. */
  kostenJeZeile?: number
  /** Erste Kennungsnummer, damit Fälle sich nicht überschneiden. */
  ab?: number
}

/**
 * Legt abgeschlossene Zeilen an, wie sie nach echten Aufrufen dastünden.
 *
 * Festgeschrieben und nicht zurückgerollt: Die Grenzen zählen über
 * Transaktionen hinweg, und gleichzeitige Sitzungen müssen die Saat sehen.
 */
async function saat(s: Saat): Promise<void> {
  const art = s.art ?? 'gast'
  const alter = s.alter === 'tag' ? `interval '2 hours'` : `interval '5 minutes'`
  const kosten = s.kostenJeZeile ?? RESERVIERUNG
  const ab = s.ab ?? 1
  const hash =
    s.kennung === 'eine'
      ? gastHash(ab)
      : `encode(sha256(convert_to('gast:${PRAEFIX}' || (${ab} + g - 1), 'UTF8')), 'hex')`

  await runSql(`
insert into public.model_usage
  (funktion, modell, art, kennung_hash, ergebnis, eingabe_tokens, gecachte_tokens,
   ausgabe_tokens, laufzeit_ms, kosten_mikro_usd, created_at, abgeschlossen_am)
select 'reisevorschlag', '${MODELL}', '${art}', ${hash}, 'erfolg',
       2400, 0, 2900, 8200, ${kosten}, now() - ${alter}, now() - ${alter}
  from generate_series(1, ${s.anzahl}) as g;`)
}

// ---------------------------------------------------------------------------
// Die Fälle
// ---------------------------------------------------------------------------
//
// Jede Grenze zweimal: einmal der letzte erlaubte Aufruf, einmal der erste
// abgelehnte. Eine Schranke, von der nur bekannt ist, dass sie irgendwann
// greift, ist keine Zusage über eine Zahl.

const G = MODELL_GRENZEN

type Fall = {
  name: string
  grund: string
  lauf: () => Promise<{ ok: boolean; detail: string; maengel: string[] }>
}

/** Erwartet einen erfolgreichen Anspruch und prüft die Zeile, die dabei entsteht. */
async function erwarteErfolg(versuch: Versuch, was: string) {
  const maengel: string[] = []
  if (!versuch.ok) {
    maengel.push(`abgelehnt mit ${versuch.code}, erwartet ein Kontingent`)
    return { ok: false, detail: `${was}: ${versuch.code}`, maengel }
  }
  const rows = await runSql(`
select ergebnis, art, kosten_mikro_usd::text as kosten, abgeschlossen_am is null as offen
  from public.model_usage where id = '${versuch.id}'`)
  const zeile = rows[0]
  if (!zeile) maengel.push('keine Zeile zur gelieferten Kennung')
  else {
    if (zeile.ergebnis !== 'reserviert') maengel.push(`Ergebnis ${zeile.ergebnis}, erwartet reserviert`)
    if (Number(zeile.kosten) !== RESERVIERUNG) {
      maengel.push(`reserviert ${zeile.kosten} µ$, erwartet ${RESERVIERUNG} µ$`)
    }
    if (zeile.offen !== true) maengel.push('bereits abgeschlossen')
  }
  return { ok: maengel.length === 0, detail: `${was}: Kontingent erteilt`, maengel }
}

function erwarteAbweisung(versuch: Versuch, was: string) {
  const maengel: string[] = []
  if (versuch.ok) maengel.push('durchgelassen, erwartet 53400')
  else if (versuch.code !== '53400') maengel.push(`Fehlercode ${versuch.code}, erwartet 53400`)
  return {
    ok: maengel.length === 0,
    detail: `${was}: ${versuch.ok ? 'durchgelassen' : versuch.code}`,
    maengel,
  }
}

const FAELLE: Fall[] = [
  {
    name: `Kennung, Stunde: der ${G.jeKennungStunde}. Aufruf`,
    grund: 'Die Grenze darf nicht vor ihrem Rand greifen, sonst ist die Zusage eine andere.',
    lauf: async () => {
      await saat({ anzahl: G.jeKennungStunde - 1, kennung: 'eine', alter: 'stunde' })
      return erwarteErfolg(await beanspruchen(1), `${G.jeKennungStunde}. in der Stunde`)
    },
  },
  {
    name: `Kennung, Stunde: der ${G.jeKennungStunde + 1}. Aufruf`,
    grund: 'Der erste Aufruf über dem Rand wird abgewiesen, und zwar mit 53400.',
    lauf: async () => {
      await saat({ anzahl: G.jeKennungStunde, kennung: 'eine', alter: 'stunde' })
      return erwarteAbweisung(await beanspruchen(1), `${G.jeKennungStunde + 1}. in der Stunde`)
    },
  },
  {
    name: `Kennung, Tag: der ${G.jeKennungTag}. Aufruf`,
    grund:
      'Die Zeilen liegen ausserhalb des Stundenfensters – gemessen wird also die ' +
      'Tagesgrenze und nicht wieder die Stundengrenze.',
    lauf: async () => {
      await saat({ anzahl: G.jeKennungTag - 1, kennung: 'eine', alter: 'tag' })
      return erwarteErfolg(await beanspruchen(1), `${G.jeKennungTag}. am Tag`)
    },
  },
  {
    name: `Kennung, Tag: der ${G.jeKennungTag + 1}. Aufruf`,
    grund: 'Dieselbe Kennung kommt am Tag nicht weiter, auch mit leerem Stundenfenster.',
    lauf: async () => {
      await saat({ anzahl: G.jeKennungTag, kennung: 'eine', alter: 'tag' })
      return erwarteAbweisung(await beanspruchen(1), `${G.jeKennungTag + 1}. am Tag`)
    },
  },
  {
    name: `Gäste, Tag: der ${G.gaesteTag + 1}. Aufruf`,
    grund:
      'Jede Zeile trägt eine eigene Kennung: Der Fall misst den gemeinsamen Topf der ' +
      'Gäste und nicht die Grenze je Kennung. Genau dieser Topf ist die Antwort auf ' +
      'eine wechselbare Gastkennung (ADR-0052).',
    lauf: async () => {
      await saat({ anzahl: G.gaesteTag, kennung: 'je-zeile', alter: 'tag' })
      return erwarteAbweisung(await beanspruchen(G.gaesteTag + 1), 'Gast über dem Topf')
    },
  },
  {
    name: 'Gäste, Tag: ein Konto kommt weiterhin durch',
    grund:
      'Der eigentliche Zweck des Gasttopfs: Rotierende Gastkennungen dürfen die ' +
      'angemeldeten Konten nicht aussperren.',
    lauf: async () => {
      await saat({ anzahl: G.gaesteTag, kennung: 'je-zeile', alter: 'tag' })
      await konto()
      return erwarteErfolg(await beanspruchen(1, KONTO), 'Konto bei vollem Gasttopf')
    },
  },
  {
    name: `insgesamt, Tag: der ${G.gesamtTag}. Aufruf`,
    grund:
      'Die Saat liegt auf der Art konto, damit der Gasttopf nicht zuerst greift. ' +
      'Gemessen wird die Zahl, die den Tagesbetrag garantiert.',
    lauf: async () => {
      await saat({ anzahl: G.gesamtTag - 1, kennung: 'je-zeile', art: 'konto', alter: 'tag' })
      await konto()
      return erwarteErfolg(await beanspruchen(null, KONTO), `${G.gesamtTag}. insgesamt`)
    },
  },
  {
    name: `insgesamt, Tag: der ${G.gesamtTag + 1}. Aufruf`,
    grund: 'Die letzte Schranke vor den Kosten hält.',
    lauf: async () => {
      await saat({ anzahl: G.gesamtTag, kennung: 'je-zeile', art: 'konto', alter: 'tag' })
      await konto()
      return erwarteAbweisung(await beanspruchen(null, KONTO), `${G.gesamtTag + 1}. insgesamt`)
    },
  },
  {
    name: 'Kostendeckel: eine Reservierung passt noch',
    grund:
      'Wenige teure Zeilen statt vieler billiger: Der Deckel wird an der Summe gemessen ' +
      'und nicht an der Zahl der Aufrufe.',
    lauf: async () => {
      // Drei Zeilen, deren Summe genau eine weitere Reservierung offen lässt.
      const jeZeile = Math.floor((G.kostenTagMikroUsd - RESERVIERUNG) / 3)
      await saat({ anzahl: 3, kennung: 'je-zeile', art: 'konto', alter: 'tag', kostenJeZeile: jeZeile })
      await konto()
      return erwarteErfolg(await beanspruchen(null, KONTO), `Stand ${3 * jeZeile} µ$`)
    },
  },
  {
    name: 'Kostendeckel: eine Reservierung passt nicht mehr',
    grund:
      'Drei Zeilen genügen, um abzuweisen – die Zahl der Aufrufe liegt weit unter jeder ' +
      'Zählgrenze. Genau dafür gibt es den Deckel neben ihr.',
    lauf: async () => {
      const jeZeile = Math.floor((G.kostenTagMikroUsd - RESERVIERUNG) / 3) + 1
      await saat({ anzahl: 3, kennung: 'je-zeile', art: 'konto', alter: 'tag', kostenJeZeile: jeZeile })
      await konto()
      return erwarteAbweisung(await beanspruchen(null, KONTO), `Stand ${3 * jeZeile} µ$`)
    },
  },
  {
    name: `Parallelität: ${SITZUNGEN} Sitzungen auf einen freien Platz`,
    grund:
      'Der Kern des Befunds: Ohne globale Serialisierung sehen alle Sitzungen denselben ' +
      'Stand und kommen alle durch. Jede Sitzung nimmt eine eigene Gastkennung, damit ' +
      'nicht die Grenze je Kennung antwortet, sondern die Tagesgrenze.',
    lauf: async () => {
      await saat({ anzahl: G.gesamtTag - 1, kennung: 'je-zeile', art: 'konto', alter: 'tag' })
      const ziel = await treffpunkt()

      const eine = async (nr: number): Promise<Versuch> => {
        try {
          // Die Kennung landet in einer temporären Tabelle, weil die
          // Management-API nur die Zeilen der letzten Anweisung liefert – und die
          // letzte muss das Offenhalten der Transaktion sein, nicht der Anspruch.
          const rows = await runSql(`begin;
${alsRolle(null)}
${warten(ziel)}
create temporary table anspruch on commit drop as
${beanspruchenSql(G.gaesteTag + 10 + nr)}
select pg_sleep(${HALTEN_S});
select id from anspruch;
commit;`)
          return { ok: true, id: rows[0].id }
        } catch (fehler) {
          return { ok: false, code: sqlstate(fehler as Error) }
        }
      }

      const laeufe = await Promise.all(Array.from({ length: SITZUNGEN }, (_, i) => eine(i + 1)))
      const erfolge = laeufe.filter((l) => l.ok)
      const codes = [...new Set(laeufe.filter((l) => !l.ok).map((l) => (l as { code: string }).code))]
      const rows = await runSql(`
select count(*) as anzahl from public.model_usage where created_at >= now() - interval '1 day'`)
      const bestand = Number(rows[0].anzahl)

      const maengel: string[] = []
      if (erfolge.length !== 1) maengel.push(`${erfolge.length} Sitzungen erfolgreich, erwartet 1`)
      if (bestand !== G.gesamtTag) maengel.push(`Bestand ${bestand}, erwartet ${G.gesamtTag}`)
      if (codes.some((c) => c !== '53400')) maengel.push(`Fehlercodes ${codes.join(', ')}, erwartet 53400`)

      return {
        ok: maengel.length === 0,
        detail: `${erfolge.length}× erteilt, ${laeufe.length - erfolge.length}× ${codes.join('/')}, Bestand ${bestand}`,
        maengel,
      }
    },
  },
  {
    name: 'Abschluss: die Datenbank rechnet die Kosten',
    grund:
      'Der Aufrufer schickt Tokens, nicht Beträge. Ein Abschluss, der seinen Preis ' +
      'mitbringt, wäre ein Weg, den Deckel zu entlasten.',
    lauf: async () => {
      const versuch = await beanspruchen(1)
      if (!versuch.ok) return { ok: false, detail: `Anspruch ${versuch.code}`, maengel: ['kein Kontingent'] }

      await runSql(`begin;
${alsRolle(null)}
select public.modell_nutzung_abschliessen('${versuch.id}', 'erfolg', 2400, 1800, 2900, 8200);
commit;`)

      // 600 frische Eingabetokens, 1800 gecachte, 2900 Ausgabe – auf terra:
      // 600 × 2 + 1800 × 0.2 + 2900 × 12 µ$ je 1000 = 1200 + 360 + 34 800.
      const erwartet = 36_360
      const rows = await runSql(`
select ergebnis, kosten_mikro_usd::text as kosten, eingabe_tokens, gecachte_tokens,
       ausgabe_tokens, laufzeit_ms, abgeschlossen_am is not null as fertig
  from public.model_usage where id = '${versuch.id}'`)
      const z = rows[0]
      const maengel: string[] = []
      if (z.ergebnis !== 'erfolg') maengel.push(`Ergebnis ${z.ergebnis}, erwartet erfolg`)
      if (Number(z.kosten) !== erwartet) maengel.push(`${z.kosten} µ$, erwartet ${erwartet} µ$`)
      if (z.fertig !== true) maengel.push('kein Abschlusszeitpunkt')
      if (Number(z.laufzeit_ms) !== 8200) maengel.push(`Laufzeit ${z.laufzeit_ms}`)
      return { ok: maengel.length === 0, detail: `${z.ergebnis}, ${z.kosten} µ$`, maengel }
    },
  },
  {
    name: 'Abschluss: ohne Tokens bleibt die Reservierung stehen',
    grund:
      '„Die API hat nichts berichtet" ist nicht „der Aufruf war kostenlos". Eine 0 an ' +
      'dieser Stelle würde einen bezahlten Aufruf vom Deckel abziehen.',
    lauf: async () => {
      const versuch = await beanspruchen(1)
      if (!versuch.ok) return { ok: false, detail: `Anspruch ${versuch.code}`, maengel: ['kein Kontingent'] }

      await runSql(`begin;
${alsRolle(null)}
select public.modell_nutzung_abschliessen('${versuch.id}', 'zeitueberschreitung', null, null, null, 40000);
commit;`)

      const rows = await runSql(`
select ergebnis, kosten_mikro_usd::text as kosten,
       eingabe_tokens is null and ausgabe_tokens is null as ohne_tokens
  from public.model_usage where id = '${versuch.id}'`)
      const z = rows[0]
      const maengel: string[] = []
      if (z.ergebnis !== 'zeitueberschreitung') maengel.push(`Ergebnis ${z.ergebnis}`)
      if (Number(z.kosten) !== RESERVIERUNG) {
        maengel.push(`${z.kosten} µ$, erwartet die Reservierung ${RESERVIERUNG} µ$`)
      }
      if (z.ohne_tokens !== true) maengel.push('Tokens auf 0 gesetzt statt offen gelassen')
      return { ok: maengel.length === 0, detail: `${z.ergebnis}, ${z.kosten} µ$ bleiben`, maengel }
    },
  },
  {
    name: 'Abschluss: der zweite wirkt nicht',
    grund:
      'Ein Retry darf einen teuren Aufruf nicht nachträglich verbilligen. Die Zeile ist ' +
      'nach dem ersten Abschluss fest.',
    lauf: async () => {
      const versuch = await beanspruchen(1)
      if (!versuch.ok) return { ok: false, detail: `Anspruch ${versuch.code}`, maengel: ['kein Kontingent'] }

      await runSql(`begin;
${alsRolle(null)}
select public.modell_nutzung_abschliessen('${versuch.id}', 'erfolg', 2400, 0, 2900, 8200);
select public.modell_nutzung_abschliessen('${versuch.id}', 'erfolg', 0, 0, 0, 1);
commit;`)

      const rows = await runSql(`
select ergebnis, kosten_mikro_usd::text as kosten, ausgabe_tokens
  from public.model_usage where id = '${versuch.id}'`)
      const z = rows[0]
      const maengel: string[] = []
      if (Number(z.ausgabe_tokens) !== 2900) maengel.push(`Ausgabetokens ${z.ausgabe_tokens}, erwartet 2900`)
      if (Number(z.kosten) === 0) maengel.push('Kosten auf 0 gesenkt')
      return { ok: maengel.length === 0, detail: `${z.kosten} µ$, ${z.ausgabe_tokens} Ausgabetokens`, maengel }
    },
  },
  {
    name: 'Abschluss: eine fremde Kennung bleibt ohne Wirkung',
    grund:
      'Die Kennung der Zeile ist die Berechtigung. Eine erfundene UUID darf keine Zeile ' +
      'treffen – und keinen Fehler erzeugen, der etwas über den Bestand verrät.',
    lauf: async () => {
      const rows = await runSql(`begin;
${alsRolle(null)}
select public.modell_nutzung_abschliessen('11111111-2222-4333-8444-555555555555', 'erfolg', 1, 0, 1, 1);
commit;
select count(*) as anzahl from public.model_usage where created_at >= now() - interval '1 day';`)
      const bestand = Number(rows[0].anzahl)
      const maengel = bestand === 0 ? [] : [`Bestand ${bestand}, erwartet 0`]
      return { ok: maengel.length === 0, detail: `ohne Fehler, Bestand ${bestand}`, maengel }
    },
  },
  {
    name: 'Identität: ein Konto kann sich nicht als Gast ausgeben',
    grund:
      'Sonst wäre die Grenze je Kennung mit einem selbstgewählten Cookie umgehbar. Die ' +
      'Identität eines angemeldeten Kontos kommt aus auth.uid().',
    lauf: async () => {
      await konto()
      const versuch = await beanspruchen(7, KONTO)
      if (!versuch.ok) return { ok: false, detail: `Anspruch ${versuch.code}`, maengel: ['kein Kontingent'] }

      const rows = await runSql(`
select art, kennung_hash = ${kontoHash} as ist_konto, kennung_hash = ${gastHash(7)} as ist_gast
  from public.model_usage where id = '${versuch.id}'`)
      const z = rows[0]
      const maengel: string[] = []
      if (z.art !== 'konto') maengel.push(`Art ${z.art}, erwartet konto`)
      if (z.ist_konto !== true) maengel.push('Kennung nicht aus auth.uid() gebildet')
      if (z.ist_gast === true) maengel.push('die mitgeschickte Gastkennung wurde übernommen')
      return { ok: maengel.length === 0, detail: `Art ${z.art}, Kennung aus auth.uid()`, maengel }
    },
  },
]

/** Der Treffpunkt kommt von der Uhr des Servers, nicht von der des Clients. */
async function treffpunkt(): Promise<string> {
  const rows = await runSql(
    `select (clock_timestamp() + interval '${VORLAUF_MS} milliseconds')::text as ziel`,
  )
  return rows[0].ziel
}

const warten = (ziel: string) =>
  `select pg_sleep(greatest(0, extract(epoch from ('${ziel}'::timestamptz - clock_timestamp()))));`

async function main() {
  console.log(
    `Modell ${MODELL}, Reservierung ${RESERVIERUNG} µ$ je Aufruf.\n` +
      `Grenzen: ${G.jeKennungStunde}/Stunde und ${G.jeKennungTag}/Tag je Kennung, ` +
      `${G.gaesteTag}/Tag für Gäste, ${G.gesamtTag}/Tag insgesamt, ` +
      `${G.kostenTagMikroUsd} µ$/Tag.\n`,
  )

  await aufraeumen()
  const fremd = await fremdeZeilen()
  if (fremd > 0) {
    console.error(
      `Im Tagesfenster liegen ${fremd} Zeilen, die nicht von diesem Nachweis stammen.\n` +
        'Sie würden jede Tagesgrenze verschieben. Der Nachweis läuft nicht.',
    )
    process.exit(1)
  }

  const nur = process.argv[process.argv.indexOf('--nur') + 1]
  const faelle = process.argv.includes('--nur')
    ? FAELLE.filter((f) => f.name.includes(nur))
    : FAELLE

  const ergebnisse: { fall: Fall; ok: boolean; detail: string; maengel: string[] }[] = []
  try {
    for (const fall of faelle) {
      await aufraeumen()
      ergebnisse.push({ fall, ...(await fall.lauf()) })
    }
  } finally {
    await aufraeumen()
  }

  const fehler = ergebnisse.filter((e) => !e.ok)
  for (const e of ergebnisse) {
    console.log(`${e.ok ? '  ok  ' : ' FEHL '} ${e.fall.name.padEnd(52)} ${e.detail}`)
    for (const m of e.maengel) console.log(`       ${m}`)
  }

  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} Nachweise erfüllt.`)
  if (fehler.length) process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

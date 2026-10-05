// lib/account/besuche-eingabe.ts
//
// Was der Browser schicken darf, wenn er einen Besuch bestätigt.
//
// Absichtlich schmal: eine Ortsreferenz oder ein Ländercode, dazu eine
// Zeitangabe, die auch unvollständig sein darf. Kein Ortsname, kein Land zum
// Ort, keine Koordinaten. Alles Geografische holt der Server aus
// `public.places` – ein Formular kann nicht behaupten, Lissabon liege in
// Frankreich.
//
// Frei von Next und Supabase, damit die Regeln ohne Laufzeit prüfbar sind.

import { z } from 'zod'

import { istKatalogLand } from '@/lib/country/katalog'

export const BESUCH_MELDUNG = {
  nichtAngemeldet: 'Bitte melde dich an, um deine Besuche zu verwalten.',
  nichtGefunden: 'Dieser Besuch wurde nicht gefunden.',
  ohneZiel: 'Wähle einen Ort aus der Suche oder ein Land aus.',
  ortUnbekannt:
    'Diesen Ort kennt Jetnity nicht. Bitte wähle einen Vorschlag aus der Suche aus.',
  landUnbekannt: 'Diesen Ländercode kennt Jetnity nicht.',
  datumUngueltig: 'Dieses Datum gibt es nicht.',
  datumZukunft: 'Ein Besuch kann nicht in der Zukunft liegen.',
  jahrBereich: 'Bitte gib ein Jahr zwischen 1900 und dem laufenden Jahr an.',
  monatOhneJahr: 'Ein Monat braucht ein Jahr.',
  tagOhneMonat: 'Ein Tag braucht einen Monat.',
  grenze: 'Dein Konto führt bereits die höchstmögliche Zahl bestätigter Besuche.',
} as const

/** Erste Jahreszahl, die Jetnity als Reiseerinnerung annimmt. */
export const BESUCH_JAHR_MINIMUM = 1900

/**
 * Form einer Jetnity-Ortsreferenz.
 *
 * Gleiche Form wie die Datenbankprüfung der Spalte. Sie sagt nur, dass es eine
 * Referenz sein könnte – ob es die Referenz gibt, entscheidet die Abfrage
 * gegen `public.places`.
 */
const PLACE_ID = /^[a-z]{2,20}:[A-Za-z0-9_.-]{1,60}$/

const zeitSchema = z.object({
  jahr: z.number().int().nullable(),
  monat: z.number().int().min(1).max(12).nullable(),
  tag: z.number().int().min(1).max(31).nullable(),
})

const zielSchema = z.object({
  placeId: z.string().regex(PLACE_ID).nullable(),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
})

const besuchAnlageSchema = zielSchema.merge(zeitSchema)
const besuchAenderungSchema = besuchAnlageSchema.extend({ id: z.string().uuid() })
const besuchLoeschungSchema = z.object({ id: z.string().uuid() })

export type Eingabeergebnis<Wert> = { ok: true; wert: Wert } | { ok: false; meldung: string }

/**
 * Prüft eine Zeitangabe gegen den Kalender und gegen die Gegenwart.
 *
 * Die Datenbank prüft nur Bereiche und die Reihenfolge Jahr → Monat → Tag. Den
 * 30. Februar und ein Datum von morgen kann sie nicht abweisen: Kalenderlogik
 * und `now()` gehören nicht in eine Check-Bedingung. Beides steht deshalb hier,
 * auf dem Server, und nicht nur im Formular.
 *
 * `heute` wird übergeben statt gelesen, damit der Test die Zukunft kennt.
 */
export function besuchZeitPruefen(
  zeit: { jahr: number | null; monat: number | null; tag: number | null },
  heute: { jahr: number; monat: number; tag: number },
): Eingabeergebnis<{ jahr: number | null; monat: number | null; tag: number | null }> {
  const { jahr, monat, tag } = zeit

  if (jahr === null) {
    if (monat !== null) return { ok: false, meldung: BESUCH_MELDUNG.monatOhneJahr }
    if (tag !== null) return { ok: false, meldung: BESUCH_MELDUNG.tagOhneMonat }
    return { ok: true, wert: { jahr: null, monat: null, tag: null } }
  }

  if (jahr < BESUCH_JAHR_MINIMUM || jahr > heute.jahr) {
    return { ok: false, meldung: BESUCH_MELDUNG.jahrBereich }
  }
  if (monat === null && tag !== null) {
    return { ok: false, meldung: BESUCH_MELDUNG.tagOhneMonat }
  }

  if (monat !== null && tag !== null) {
    // `Date.UTC` normalisiert stillschweigend: aus dem 30. Februar wird der
    // 1. März. Genau diese Verschiebung entlarvt das ungültige Datum.
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    if (
      geprueft.getUTCFullYear() !== jahr ||
      geprueft.getUTCMonth() !== monat - 1 ||
      geprueft.getUTCDate() !== tag
    ) {
      return { ok: false, meldung: BESUCH_MELDUNG.datumUngueltig }
    }
  }

  const angegeben = jahr * 10000 + (monat ?? 1) * 100 + (tag ?? 1)
  const heuteWert = heute.jahr * 10000 + heute.monat * 100 + heute.tag
  if (angegeben > heuteWert) {
    return { ok: false, meldung: BESUCH_MELDUNG.datumZukunft }
  }

  return { ok: true, wert: { jahr, monat, tag } }
}

function zielPruefen(wert: {
  placeId: string | null
  countryCode: string | null
}): Eingabeergebnis<{ placeId: string | null; countryCode: string | null }> {
  if (!wert.placeId && !wert.countryCode) {
    return { ok: false, meldung: BESUCH_MELDUNG.ohneZiel }
  }
  // Ein Land ohne Ort muss im Katalog stehen. Zu einem Ort kommt der Code
  // dagegen aus der Ortsreferenz und wird hier gar nicht gelesen.
  if (!wert.placeId && wert.countryCode && !istKatalogLand(wert.countryCode)) {
    return { ok: false, meldung: BESUCH_MELDUNG.landUnbekannt }
  }
  return {
    ok: true,
    wert: { placeId: wert.placeId, countryCode: wert.placeId ? null : wert.countryCode },
  }
}

function heuteUtc(): { jahr: number; monat: number; tag: number } {
  const jetzt = new Date()
  return {
    jahr: jetzt.getUTCFullYear(),
    monat: jetzt.getUTCMonth() + 1,
    tag: jetzt.getUTCDate(),
  }
}

export type GeprueftesZiel = {
  placeId: string | null
  countryCode: string | null
  jahr: number | null
  monat: number | null
  tag: number | null
}

export function besuchAnlageLesen(
  eingabe: unknown,
  heute: { jahr: number; monat: number; tag: number } = heuteUtc(),
): Eingabeergebnis<GeprueftesZiel> {
  const geparst = besuchAnlageSchema.safeParse(eingabe)
  if (!geparst.success) return { ok: false, meldung: BESUCH_MELDUNG.ohneZiel }

  const ziel = zielPruefen(geparst.data)
  if (!ziel.ok) return ziel

  const zeit = besuchZeitPruefen(geparst.data, heute)
  if (!zeit.ok) return zeit

  return { ok: true, wert: { ...ziel.wert, ...zeit.wert } }
}

export function besuchAenderungLesen(
  eingabe: unknown,
  heute: { jahr: number; monat: number; tag: number } = heuteUtc(),
): Eingabeergebnis<GeprueftesZiel & { id: string }> {
  const geparst = besuchAenderungSchema.safeParse(eingabe)
  if (!geparst.success) return { ok: false, meldung: BESUCH_MELDUNG.ohneZiel }

  const inhalt = besuchAnlageLesen(
    {
      placeId: geparst.data.placeId,
      countryCode: geparst.data.countryCode,
      jahr: geparst.data.jahr,
      monat: geparst.data.monat,
      tag: geparst.data.tag,
    },
    heute,
  )
  if (!inhalt.ok) return inhalt

  return { ok: true, wert: { id: geparst.data.id, ...inhalt.wert } }
}

export function besuchLoeschungLesen(eingabe: unknown): Eingabeergebnis<{ id: string }> {
  const geparst = besuchLoeschungSchema.safeParse(eingabe)
  if (!geparst.success) return { ok: false, meldung: BESUCH_MELDUNG.nichtGefunden }
  return { ok: true, wert: geparst.data }
}

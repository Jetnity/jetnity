// lib/reiseaenderung/schema.ts
//
// Was ein Änderungsvorschlag sein darf.
//
// Das Modell liefert strukturierte Operationen mit den Kennungen der
// bestehenden Reise – nicht eine komplette Ersatzreise. Die Operationen werden
// danach durch TypeScript auf die vertrauenswürdige Reise angewendet. Preise,
// Anbieter und Buchungsfelder kommen in diesem Schema nicht vor.
//
// Zwei Schemata für dieselbe Sache: JSON-Schema für Structured Outputs,
// Zod für die fachliche Prüfung. Modelloutput bleibt untrusted input.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import { ohnePreisangabe, ohneSteuerzeichen } from '@/lib/reisevorschlag/normalisierung'
import { GRENZEN } from '@/lib/trips/schema'
import { TRIP_INTERESTS, TRIP_ITEM_KINDS, TRIP_PACES } from '@/types/trips'

export const AENDERUNG_FASSUNG = 1

export const AENDERUNG_GRENZEN = {
  operationen: 20,
  zusammenfassung: 240,
  annahmen: 4,
  annahme: 160,
  warnungen: 6,
  warnung: 200,
  tageDelta: 30,
  neueEtappenTage: 14,
  freitextMinimum: 8,
  freitextMaximum: MODELL_GRENZEN.eingabeZeichen,
} as const

export const AENDERUNG_ARTEN = [
  'stammdaten',
  'zeitraum_verschieben',
  'dauer_aendern',
  'etappe_entfernen',
  'etappe_hinzufuegen',
  'etappe_dauer',
  'tag_entfernen',
  'tag_hinzufuegen',
  'tag_titel',
  'punkt_entfernen',
  'punkt_hinzufuegen',
  'punkt_anpassen',
] as const

export type AenderungArt = (typeof AENDERUNG_ARTEN)[number]

const modelltext = (maximum: number) =>
  z
    .string()
    .transform((wert) => ohnePreisangabe(ohneSteuerzeichen(wert)))
    .pipe(z.string().max(maximum))

const pflichttext = (maximum: number) =>
  modelltext(maximum).pipe(z.string().min(1, 'Ein Titel ist nötig'))

const kanntext = (maximum: number) =>
  z
    .string()
    .nullable()
    .transform((wert) => (wert === null ? '' : ohnePreisangabe(ohneSteuerzeichen(wert))))
    .pipe(z.string().max(maximum))
    .transform((wert) => (wert === '' ? null : wert))

const kennung = z
  .string()
  .nullable()
  .transform((wert) => {
    if (wert === null) return null
    const gekuerzt = ohneSteuerzeichen(wert).trim()
    return gekuerzt === '' ? null : gekuerzt.slice(0, 80)
  })

const isoDatum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((wert) => {
    const [jahr, monat, tag] = wert.split('-').map(Number)
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    return (
      geprueft.getUTCFullYear() === jahr &&
      geprueft.getUTCMonth() === monat - 1 &&
      geprueft.getUTCDate() === tag
    )
  }, 'Dieses Datum gibt es nicht')

const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const operationRoh = z.object({
  art: z.enum(AENDERUNG_ARTEN),
  etappeId: kennung,
  tagId: kennung,
  punktId: kennung,
  nachEtappeId: kennung,
  nachTagId: kennung,
  name: kanntext(GRENZEN.titel),
  laendercode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  titel: kanntext(GRENZEN.titel),
  notiz: kanntext(GRENZEN.notiz),
  beginn: uhrzeit.nullable(),
  punktArt: z.enum(TRIP_ITEM_KINDS).nullable(),
  tageDelta: z
    .number()
    .int()
    .min(-AENDERUNG_GRENZEN.tageDelta)
    .max(AENDERUNG_GRENZEN.tageDelta)
    .nullable(),
  tage: z.number().int().min(1).max(AENDERUNG_GRENZEN.neueEtappenTage).nullable(),
  reisende: z.number().int().min(1).max(GRENZEN.reisende).nullable(),
  budgetziel: z.number().finite().nonnegative().max(1_000_000).nullable(),
  tempo: z.enum(TRIP_PACES).nullable(),
  interessen: z.array(z.enum(TRIP_INTERESTS)).max(TRIP_INTERESTS.length).nullable(),
  reisewunsch: kanntext(GRENZEN.reisewunsch),
  abreiseort: kanntext(GRENZEN.ort),
  startdatum: isoDatum.nullable(),
})

function operationPruefen(op: z.infer<typeof operationRoh>, ctx: z.RefinementCtx, stelle: number) {
  const pfad = ['operationen', stelle] as const
  const braucht = (feld: keyof typeof op, meldung: string) => {
    if (op[feld] === null || op[feld] === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...pfad], message: meldung })
    }
  }

  switch (op.art) {
    case 'stammdaten':
      if (
        op.titel === null &&
        op.abreiseort === null &&
        op.reisende === null &&
        op.budgetziel === null &&
        op.tempo === null &&
        op.interessen === null &&
        op.reisewunsch === null &&
        op.startdatum === null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...pfad],
          message: 'Eine Stammdatenänderung braucht mindestens ein Feld',
        })
      }
      break
    case 'zeitraum_verschieben':
    case 'dauer_aendern':
    case 'etappe_dauer':
      braucht('tageDelta', 'Ohne Tageszahl lässt sich die Dauer nicht ändern')
      if (op.tageDelta === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...pfad],
          message: 'Eine Verschiebung um 0 Tage ändert nichts',
        })
      }
      if (op.art === 'etappe_dauer') braucht('etappeId', 'Welche Etappe soll länger oder kürzer werden?')
      break
    case 'etappe_entfernen':
      braucht('etappeId', 'Welche Etappe soll entfernt werden?')
      break
    case 'etappe_hinzufuegen':
      braucht('name', 'Die neue Etappe braucht einen Ort')
      braucht('tage', 'Die neue Etappe braucht eine Dauer in Tagen')
      break
    case 'tag_entfernen':
      braucht('tagId', 'Welcher Tag soll entfernt werden?')
      break
    case 'tag_hinzufuegen':
      break
    case 'tag_titel':
      braucht('tagId', 'Welcher Tag soll umbenannt werden?')
      break
    case 'punkt_entfernen':
      braucht('punktId', 'Welcher Planpunkt soll entfernt werden?')
      break
    case 'punkt_hinzufuegen':
      braucht('titel', 'Der neue Planpunkt braucht einen Titel')
      break
    case 'punkt_anpassen':
      braucht('punktId', 'Welcher Planpunkt soll angepasst werden?')
      break
  }
}

const modellaenderungRoh = z.object({
  zusammenfassung: pflichttext(AENDERUNG_GRENZEN.zusammenfassung),
  annahmen: z.array(modelltext(AENDERUNG_GRENZEN.annahme)).max(AENDERUNG_GRENZEN.annahmen),
  warnungen: z.array(modelltext(AENDERUNG_GRENZEN.warnung)).max(AENDERUNG_GRENZEN.warnungen),
  operationen: z.array(operationRoh).min(1).max(AENDERUNG_GRENZEN.operationen),
})

export const modellaenderungSchema = modellaenderungRoh.superRefine((wert, ctx) => {
  wert.operationen.forEach((op, stelle) => operationPruefen(op, ctx, stelle))
})

export type Modelloperation = z.infer<typeof operationRoh>
export type Modellaenderung = z.infer<typeof modellaenderungSchema>

export const reiseaenderungSchema = modellaenderungRoh
  .extend({ fassung: z.literal(AENDERUNG_FASSUNG) })
  .superRefine((wert, ctx) => {
    wert.operationen.forEach((op, stelle) => operationPruefen(op, ctx, stelle))
  })

export type Reiseaenderung = z.infer<typeof reiseaenderungSchema>

const nutzertext = (maximum: number) =>
  z
    .string()
    .transform((wert) => ohneSteuerzeichen(wert))
    .pipe(
      z
        .string()
        .min(
          AENDERUNG_GRENZEN.freitextMinimum,
          'Beschreibe in ein paar Worten, was sich an der Reise ändern soll.',
        )
        .max(
          AENDERUNG_GRENZEN.freitextMaximum,
          `Bitte beschreibe die Änderung in höchstens ${AENDERUNG_GRENZEN.freitextMaximum} Zeichen.`,
        ),
    )

export const aenderungstextSchema = nutzertext(AENDERUNG_GRENZEN.freitextMaximum)

export const AENDERUNG_SCHEMA_NAME = 'jetnity_reiseaenderung'

const HHMM = '^([01][0-9]|2[0-3]):[0-5][0-9]$'

export const AENDERUNG_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['zusammenfassung', 'annahmen', 'warnungen', 'operationen'],
  properties: {
    zusammenfassung: {
      type: 'string',
      description: `Kurzer Satz, was sich ändert, ohne Preis, höchstens ${AENDERUNG_GRENZEN.zusammenfassung} Zeichen.`,
    },
    annahmen: {
      type: 'array',
      maxItems: AENDERUNG_GRENZEN.annahmen,
      items: { type: 'string' },
      description: 'Annahmen, die der Wunsch nicht hergibt. Leer, wenn keine nötig waren.',
    },
    warnungen: {
      type: 'array',
      maxItems: AENDERUNG_GRENZEN.warnungen,
      items: { type: 'string' },
      description: 'Konflikte oder offene Punkte, ehrlich. Leer, wenn keine.',
    },
    operationen: {
      type: 'array',
      minItems: 1,
      maxItems: AENDERUNG_GRENZEN.operationen,
      description:
        'Strukturierte Änderungen an der bestehenden Reise. Nur vorhandene Kennungen verwenden. Keine Preise, keine Anbieter, keine Buchungslinks.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'art',
          'etappeId',
          'tagId',
          'punktId',
          'nachEtappeId',
          'nachTagId',
          'name',
          'laendercode',
          'titel',
          'notiz',
          'beginn',
          'punktArt',
          'tageDelta',
          'tage',
          'reisende',
          'budgetziel',
          'tempo',
          'interessen',
          'reisewunsch',
          'abreiseort',
          'startdatum',
        ],
        properties: {
          art: { type: 'string', enum: [...AENDERUNG_ARTEN] },
          etappeId: {
            type: ['string', 'null'],
            description: 'id einer bestehenden Etappe aus der Reise. Sonst null.',
          },
          tagId: {
            type: ['string', 'null'],
            description: 'id eines bestehenden Tages aus der Reise. Sonst null.',
          },
          punktId: {
            type: ['string', 'null'],
            description: 'id eines bestehenden Planpunkts. Sonst null.',
          },
          nachEtappeId: {
            type: ['string', 'null'],
            description: 'Nach dieser Etappe einfügen. Null = ans Ende.',
          },
          nachTagId: {
            type: ['string', 'null'],
            description: 'Nach diesem Tag einfügen. Null = ans Ende der Etappe oder Reise.',
          },
          name: { type: ['string', 'null'], description: 'Ortsname einer neuen Etappe.' },
          laendercode: { type: ['string', 'null'], pattern: '^[A-Z]{2}$' },
          titel: { type: ['string', 'null'] },
          notiz: { type: ['string', 'null'] },
          beginn: { type: ['string', 'null'], pattern: HHMM },
          punktArt: { type: ['string', 'null'], enum: [...TRIP_ITEM_KINDS, null] },
          tageDelta: {
            type: ['integer', 'null'],
            minimum: -AENDERUNG_GRENZEN.tageDelta,
            maximum: AENDERUNG_GRENZEN.tageDelta,
            description: 'Positive Zahl verlängert, negative verkürzt. Für zeitraum_verschieben, dauer_aendern, etappe_dauer.',
          },
          tage: {
            type: ['integer', 'null'],
            minimum: 1,
            maximum: AENDERUNG_GRENZEN.neueEtappenTage,
            description: 'Dauer einer neuen Etappe in Tagen.',
          },
          reisende: { type: ['integer', 'null'], minimum: 1, maximum: GRENZEN.reisende },
          budgetziel: { type: ['number', 'null'], minimum: 0, maximum: 1_000_000 },
          tempo: { type: ['string', 'null'], enum: [...TRIP_PACES, null] },
          interessen: {
            type: ['array', 'null'],
            maxItems: TRIP_INTERESTS.length,
            items: { type: 'string', enum: [...TRIP_INTERESTS] },
          },
          reisewunsch: { type: ['string', 'null'] },
          abreiseort: { type: ['string', 'null'] },
          startdatum: {
            type: ['string', 'null'],
            format: 'date',
            description: 'Nur setzen, wenn der Wunsch ein neues Startdatum nennt.',
          },
        },
      },
    },
  },
} as const

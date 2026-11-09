import 'server-only'
import { archivLesen } from './archiv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { tag, type Katalog } from './katalog'

const id = z.string().regex(/^\d{1,14}$/)
const kosten = z.number().int().nonnegative().nullable()
const wert = z.tuple([kosten, kosten]).refine(([preis, zeit]) => preis !== null || zeit !== null)
const strecke = z
  .object({ train: wert.optional(), bus: wert.optional(), flight: wert.optional(), ferry: wert.optional() })
  .strict()
const schema = z.object({
  date: z.string().refine(tag),
  publisher: id,
  places: z
    .array(
      z.object({
        id,
        name: z.string().min(1).max(160),
        country: z.string().regex(/^[A-Z]{2}$/),
        lat: z.number().gte(-90).lte(90),
        lng: z.number().gte(-180).lte(180),
        weight: z.number().int().positive().optional(),
      }),
    )
    .min(1)
    .max(100_000),
  routes: z.record(z.string().regex(/^\d{1,14}\/\d{1,14}$/), strecke),
})

let laufend: Promise<Katalog> | undefined

async function einlesen(): Promise<Katalog> {
  const archiv = await readFile(join(process.cwd(), 'data/omio/ch.katalog'))
  const json = archivLesen(archiv, process.env.OMIO_KATALOG_SCHLUESSEL)
  const parsed = schema.parse(json)
  if (
    !Object.keys(parsed.routes).length ||
    parsed.date > new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  )
    throw Error('Omio-Katalog unvollständig')
  return parsed
}
export function streckenkatalog(): Promise<Katalog> {
  if (!laufend)
    laufend = einlesen().catch((e) => {
      laufend = undefined
      throw e
    })
  return laufend
}

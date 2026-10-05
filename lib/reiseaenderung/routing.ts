// lib/reiseaenderung/routing.ts
//
// Terra Standard, Sol bei komplexen Änderungen. Luna nie automatisch.
// Baut auf dem Router von Phase 2.1 auf und zählt die bestehende Reise mit.
//
// Frei von Next, Supabase und `process.env`.

import { MODELLE, type Modellname } from '@/lib/modell/preise'
import { planungspfad } from '@/lib/reisevorschlag/routing'
import type { Reisegraph } from '@/types/trips'

export function modellFuerReiseaenderung(
  freitext: string,
  reise: Pick<Reisegraph, 'stages' | 'days'>,
  festgelegt?: string,
): Modellname {
  const stift = festgelegt?.trim()
  if (stift && (MODELLE as readonly string[]).includes(stift)) return stift as Modellname

  const ausText = planungspfad(freitext)
  if (ausText.pfad === 'sol') return ausText.modell

  const komplex =
    reise.stages.length >= 3 ||
    reise.days.length >= 12 ||
    (reise.stages.length >= 2 && /\bentfern|kürz|kuerz|länger|laenger|mehr tag|weniger tag|ans meer|am meer/i.test(freitext))

  return komplex ? 'gpt-5.6-sol' : 'gpt-5.6-terra'
}

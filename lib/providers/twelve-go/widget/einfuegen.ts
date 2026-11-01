// lib/providers/twelve-go/widget/einfuegen.ts
//
// Entscheidet nur, ob die allgemeinen Bytes eingesetzt werden dürften.
// Setzt selbst nichts in den DOM und kennt die Beispielstrecke nicht als Ziel.

import { createHash } from 'node:crypto'

import type { TwelveGoWidgetSkript } from '@/lib/providers/twelve-go/widget/entscheidung'
import { TWELVE_GO_WIDGET_ALLGEMEIN_SHA256 } from '@/lib/providers/twelve-go/widget/kennungen'

export function twelveGoWidgetDarfEinfuegen(
  ausfuehrbar: boolean,
  skript: TwelveGoWidgetSkript,
  instanz: number,
  bytes: Uint8Array,
): boolean {
  if (ausfuehrbar !== true) return false
  if (skript !== 'allgemein') return false
  if (instanz !== 1) return false
  return createHash('sha256').update(bytes).digest('hex') === TWELVE_GO_WIDGET_ALLGEMEIN_SHA256
}

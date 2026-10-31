// One synthetic frame. Invalidation retires the generation. Stale signals do not recreate it.

import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

export type LiveFrame = {
  readonly providerId: WidgetConsentProviderId
  readonly generation: number
}

export type FrameBook = {
  readonly live: LiveFrame | null
  readonly generation: number
}

export function emptyFrameBook(): FrameBook {
  return { live: null, generation: 1 }
}

export function tryStartFrame(
  book: FrameBook,
  input: { readonly allowed: boolean; readonly providerId: WidgetConsentProviderId; readonly generation: number },
): { readonly book: FrameBook; readonly created: boolean } {
  if (!input.allowed || input.generation !== book.generation || book.live) {
    return { book, created: false }
  }
  return {
    book: { generation: book.generation, live: { providerId: input.providerId, generation: book.generation } },
    created: true,
  }
}

export function invalidateFrame(book: FrameBook): FrameBook {
  return { live: null, generation: book.generation + 1 }
}

export function staleFrameSignal(book: FrameBook, generation: number): { readonly book: FrameBook; readonly resurrected: false } {
  void generation
  return { book, resurrected: false }
}

import { createHash } from 'node:crypto'
import type { OfferInput } from './contract'

export function offerReference(source: 'manual' | 'discovercars', ref: string, timing: Pick<OfferInput, 'starts_on' | 'ends_on' | 'starts_at' | 'ends_at'>) {
  return createHash('sha256').update(JSON.stringify([source, ref, timing.starts_on, timing.ends_on, timing.starts_at, timing.ends_at])).digest('hex')
}

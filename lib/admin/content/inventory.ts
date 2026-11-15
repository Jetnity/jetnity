import {
  ENTDECKEN_ZIELE, entdeckerParams, entdeckerTreffer,
  type EntdeckenZustand, type EntdeckenZiel,
} from '@/lib/inspiration/explorer-1/katalog'

export type ContentInventoryModel = {
  selection: EntdeckenZustand
  entries: EntdeckenZiel[]
  total: number
}

/** Use the same catalogue and search contract as the customer-facing explorer. */
export function readContentInventory(params: Record<string, string | string[] | undefined>): ContentInventoryModel {
  const selection = entdeckerParams(params)
  return { selection, entries: entdeckerTreffer(selection), total: ENTDECKEN_ZIELE.length }
}

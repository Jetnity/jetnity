import type { Metadata } from 'next'
import MerklisteSeite from '@/components/saved-offers/MerklisteSeite'
import { savedOffersList } from '@/lib/saved-offers/actions'

export const metadata: Metadata = { title: 'Meine Merkliste', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Merkliste() {
  return <MerklisteSeite ergebnis={await savedOffersList()} />
}

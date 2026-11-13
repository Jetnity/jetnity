import type { Metadata } from 'next'
import Link from 'next/link'
import SavedOffers from '@/components/saved-offers/SavedOffers'
import { savedOffersList } from '@/lib/saved-offers/actions'

export const metadata: Metadata = { title: 'Meine Merkliste', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Merkliste() {
  const result = await savedOffersList()
  return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-14">
    <h1 className="text-3xl font-semibold tracking-tight text-brand-800 sm:text-4xl">Meine Merkliste</h1>
    <p className="mb-7 mt-3 text-ink-700">Konkrete Angebote für später – in deinem Konto und auf deinen Geräten verfügbar.</p>
    {result.ok ? <SavedOffers offers={result.value} /> : <div className="grid gap-4 rounded-2xl border border-line-200 bg-white p-6"><p role="status">{result.message}</p><Link href="/login?next=%2Faccount%2Fmerkliste" className="inline-flex min-h-11 items-center text-brand-800 underline">Zur Anmeldung</Link></div>}
  </main>
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import InspirationExplorer from '@/components/inspiration/explorer-1/InspirationExplorer'
import { entdeckerParams } from '@/lib/inspiration/explorer-1/katalog'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
import { oeffentlicheMetadataOrigin } from '@/lib/seo/oeffentliche-metadata'

const beschreibung = 'Entdecke vier ausgewählte Reiseziele, finde deine Reiseidee und passe sie in der Jetnity-Planung an.'
const canonical = new URL('/entdecken', oeffentlicheMetadataOrigin()).href
export const metadata: Metadata = {
  title: 'Reiseinspiration entdecken',
  description: beschreibung,
  alternates: { canonical },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { title: 'Reiseinspiration entdecken – Jetnity', description: beschreibung, url: canonical },
  twitter: { title: 'Reiseinspiration entdecken – Jetnity', description: beschreibung },
}

export default async function EntdeckenSeite({ searchParams }: {
  searchParams?: PageRequestParam<Record<string, string | string[] | undefined>>
}) {
  const initial = entdeckerParams((await leseOptionalRequestParam(searchParams)) ?? {})
  return (
    <main className="break-words bg-surface-75 px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-6 text-brand-800 sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/#entdecken" prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Zur Startseite</Link>
        <header className="pb-8 pt-6 sm:pb-10 sm:pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Deine nächste Reise beginnt mit einer Idee</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">Wohin geht deine Neugier?</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-950 sm:text-lg">Bali, Lissabon, Zermatt und Amsterdam: vier ausgewählte Ziele zum Entdecken. Finde eine Idee, die zu dir passt, und mache in der Planung deine eigene Reise daraus.</p>
        </header>
        <InspirationExplorer initial={initial} />
        <p className="mt-8 max-w-2xl text-sm leading-6 text-ink-950">Du nimmst das Ziel und eine bearbeitbare Reiseidee mit. Die Planung prüft den Ort erneut. Reisedaten, Startort und Reisende bestimmst du selbst.</p>
      </div>
    </main>
  )
}

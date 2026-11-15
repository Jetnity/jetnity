import type { Metadata } from 'next'
import OfficialTruthChDe from '@/components/readiness/OfficialTruthChDe'
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'

export const metadata: Metadata = {
  title: 'Einreise nach Deutschland mit Schweizer Reisepass',
  description: 'Übersicht zur Einreise nach Deutschland: bestätigte amtliche Angaben mit Quellen und Stand sowie offen ausgewiesene Informationen zu Dokumenten, Gesundheit, Formularen und weiteren Anforderungen.',
  alternates: { canonical: kanonischeUrl('/einreise') },
}

export default function EinreisePage() {
  return <main className="min-h-screen bg-surface-75 px-4 py-8 text-brand-800 sm:px-6 sm:py-12">
    <OfficialTruthChDe />
  </main>
}

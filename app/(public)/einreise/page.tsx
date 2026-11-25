import type { Metadata } from 'next'
import OfficialTruthChDe from '@/components/readiness/OfficialTruthChDe'
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'
import { selectedAtVisitorPresentationPreview } from '@/lib/readiness/official-truth-at-method-v1/at-visitor-preview-selection'
import { selectedAtVisitorProductionPresentation } from '@/lib/readiness/official-truth-at-method-v1/at-visitor-release-server'

export const metadata: Metadata = {
  title: 'Einreise und Visum prüfen',
  description: 'Zielland und Pass wählen. Bestätigte amtliche Angaben erscheinen auf derselben Seite. Ohne bestätigte Auskunft bleibt der Status offen.',
  alternates: { canonical: kanonischeUrl('/einreise') },
}

export default function EinreisePage() {
  return <main className="min-h-[70dvh] px-4 py-8 text-foreground sm:px-6 sm:py-12">
    <OfficialTruthChDe atVisitorPreview={selectedAtVisitorPresentationPreview()} atApprovedCopy={selectedAtVisitorProductionPresentation()} />
  </main>
}

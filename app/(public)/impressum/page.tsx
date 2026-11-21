import type { Metadata } from 'next'
import { headers } from 'next/headers'

import PrivacyBeeEinbettung from '@/components/legal/PrivacyBeeEinbettung'
import {
  PRIVACYBEE_KILL_SWITCH_ENV,
  privacyBeeEinbettungErlaubt,
} from '@/lib/legal/privacybee-vertrag'
import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum für jetnity.com, bereitgestellt von PrivacyBee.',
  alternates: { canonical: `${KANONISCHE_PUBLIC_ORIGIN}/impressum` },
  robots: { index: false, follow: false },
}

export default async function ImpressumPage() {
  const kopf = await headers()
  const einbetten = privacyBeeEinbettungErlaubt({
    hostHeader: kopf.get('host'),
    killSwitch: process.env[PRIVACYBEE_KILL_SWITCH_ENV],
  })

  return (
    <main className="px-5 text-foreground sm:px-8">
      <article className="mx-auto w-full max-w-prose py-12 text-body sm:py-16">
        <p className="mb-1 text-kicker uppercase text-muted-foreground">Rechtliches</p>
        <PrivacyBeeEinbettung flaeche="impressum" einbetten={einbetten} />
      </article>
    </main>
  )
}

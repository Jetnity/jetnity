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
    <main className="bg-surface-75 text-brand-800">
      <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <PrivacyBeeEinbettung flaeche="impressum" einbetten={einbetten} />
      </article>
    </main>
  )
}

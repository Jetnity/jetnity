// app/auth/callback/page.tsx
import type { Metadata } from 'next'
import { Markenrahmen } from '@/components/layout/Markenrahmen'
import CallbackClient from './CallbackClient'

export const metadata: Metadata = {
  title: 'Anmeldung wird abgeschlossen – Jetnity',
  description: 'Wir schließen deine Anmeldung ab und leiten dich weiter.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Markenrahmen>
      <CallbackClient />
    </Markenrahmen>
  )
}

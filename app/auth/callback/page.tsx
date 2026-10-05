// app/auth/callback/page.tsx
import type { Metadata } from 'next'
import CallbackClient from './CallbackClient'

export const metadata: Metadata = {
  title: 'Anmeldung wird abgeschlossen – Jetnity',
  description: 'Wir schließen deine Anmeldung ab und leiten dich weiter.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <main className="container mx-auto max-w-lg px-4 py-16">
      <CallbackClient />
    </main>
  )
}

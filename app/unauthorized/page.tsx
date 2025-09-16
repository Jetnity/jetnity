// app/unauthorized/page.tsx
export const dynamic = 'force-static'

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-bold">Kein Zugriff</h1>
      <p className="mt-2 text-muted-foreground">
        Dein Account hat keine Admin-Berechtigung. Bitte wende dich an einen Owner/Admin.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link className="underline" href="/">Zur Startseite</Link>
        <Link className="underline" href="/logout">Abmelden</Link>
      </div>
    </main>
  )
}

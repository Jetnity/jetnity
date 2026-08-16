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
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6">
        <Link className="inline-flex min-h-11 items-center underline" href="/">
          Zur Startseite
        </Link>
        <Link className="inline-flex min-h-11 items-center underline" href="/logout">
          Abmelden
        </Link>
      </div>
    </main>
  )
}

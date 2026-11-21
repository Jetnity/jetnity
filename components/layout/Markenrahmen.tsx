import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Rahmen für Seiten, die bewusst ohne PublicChrome laufen (Anmeldung
 * abschliessen, neues Passwort): Die Navigation dort fragt die Sitzung ab und
 * darf den Abschluss nicht stören. Die Marke bleibt trotzdem sichtbar.
 */
export function Markenrahmen({ children }: { children: ReactNode }) {
  return (
    <div data-white-mint="home" className="min-h-dvh bg-surface-75">
      <header className="border-b border-black/5 bg-surface-75/95 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center px-5 py-2 sm:px-8">
          <Link
            href="/"
            aria-label="Jetnity Startseite"
            className="-mx-2 inline-flex min-h-11 items-center rounded-control px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src="/brand/jetnity-logo.png"
              alt=""
              width={384}
              height={128}
              priority
              unoptimized
              className="h-12 w-auto object-contain"
              style={{ width: 'auto' }}
            />
          </Link>
        </div>
      </header>
      <main className="px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
        {children}
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ACCOUNT_NAVIGATION, accountNavigationAktiv } from '@/lib/account/navigation'
import { cn } from '@/lib/utils'

export default function AccountNavigation() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Konto"
      className="border-b border-black/5 bg-surface-75 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid grid-cols-2 gap-1 py-2 sm:flex sm:flex-wrap sm:gap-1">
          {ACCOUNT_NAVIGATION.map((eintrag) => {
            const aktiv = accountNavigationAktiv(pathname, eintrag.href)
            return (
              <li key={eintrag.href} className="min-w-0">
                <Link
                  href={eintrag.href}
                  aria-current={aktiv ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center justify-center rounded-full px-3 text-center text-sm font-semibold leading-tight transition md:px-4',
                    aktiv
                      ? 'bg-surface-100 text-brand-800'
                      : 'text-ink-800 hover:bg-white hover:text-brand-800',
                  )}
                >
                  {eintrag.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

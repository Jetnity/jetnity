'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  ACCOUNT_NAVIGATION,
  accountNavigationAktiv,
  accountNavigationScrollDelta,
} from '@/lib/account/navigation'
import { cn } from '@/lib/utils'

export default function AccountNavigation() {
  const pathname = usePathname()
  const leisteRef = useRef<HTMLUListElement>(null)
  const aktivRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const leiste = leisteRef.current
    const aktiv = aktivRef.current
    if (!leiste || !aktiv) return
    const delta = accountNavigationScrollDelta(
      leiste.getBoundingClientRect(),
      aktiv.getBoundingClientRect(),
    )
    if (delta == null) return
    leiste.scrollBy({ left: delta, behavior: 'auto' })
  }, [pathname])

  return (
    <nav
      aria-label="Konto"
      className="w-full min-w-0 border-b border-black/5 bg-surface-75 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6">
        <ul
          ref={leisteRef}
          className="flex min-w-0 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain py-2 scrollbar-hide"
        >
          {ACCOUNT_NAVIGATION.map((eintrag) => {
            const aktiv = accountNavigationAktiv(pathname, eintrag.href)
            return (
              <li key={eintrag.href} className="shrink-0">
                <Link
                  ref={aktiv ? aktivRef : undefined}
                  href={eintrag.href}
                  aria-current={aktiv ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-3 text-center text-sm font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-4',
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

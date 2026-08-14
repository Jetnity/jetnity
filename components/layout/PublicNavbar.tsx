'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Entdecken', href: '/#entdecken' },
  { label: 'Meine Reisen', href: '/reisen' },
  { label: 'Jetnity Pro', href: '/#pro' },
]

export default function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === '/reisen' && (pathname === '/reisen' || pathname.startsWith('/reisen/'))

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f8f7f2]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Jetnity Startseite" className="inline-flex items-center gap-2.5 text-[#153a33]">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#153a33] shadow-sm">
            <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-[#dff47a]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <span className="text-lg font-bold tracking-[-0.04em]">Jetnity</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                isActive(item.href)
                  ? 'bg-[#e3eee8] text-[#153a33]'
                  : 'text-[#5d716a] hover:bg-white hover:text-[#153a33]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-[#476159] transition hover:bg-white">
            Anmelden
          </Link>
          <Link href="/planen" className="rounded-full bg-[#153a33] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0f302a]">
            Reise planen
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e1dc] bg-white text-[#153a33] md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile Navigation" className="border-t border-black/5 bg-[#f8f7f2] px-5 py-4 md:hidden">
          <div className="grid gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#405b53] hover:bg-white">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#e2e7e3] pt-4">
            <Link href="/login" className="flex h-11 items-center justify-center rounded-full border border-[#ced9d3] bg-white text-sm font-semibold text-[#153a33]">
              Anmelden
            </Link>
            <Link href="/planen" className="flex h-11 items-center justify-center rounded-full bg-[#153a33] text-sm font-semibold text-white">
              Reise planen
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

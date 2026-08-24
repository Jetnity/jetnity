'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Megaphone,
  CreditCard,
  ShieldCheck,
  Settings,
  Activity,
  Globe,
  type LucideIcon,
} from 'lucide-react'
import { useAdminSession } from '@/components/admin/AdminSessionProvider'
import { ADMIN_NAV_ITEMS, filterAdminNav, type AdminNavItem } from '@/lib/admin/navigation'
import { cn } from '@/lib/utils'

const NAV_ICONS: Record<string, LucideIcon> = {
  '/admin': LayoutDashboard,
  '/admin/users': Users,
  '/admin/payments': CreditCard,
  '/admin/security': ShieldCheck,
  '/admin/analytics': Activity,
  '/admin/content': FolderKanban,
  '/admin/marketing': Megaphone,
  '/admin/settings': Settings,
  '/admin/localization': Globe,
}

function istAktiv(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavListe({ items, pathname }: { items: AdminNavItem[]; pathname: string }) {
  return (
    <ul className="mt-1 space-y-1 px-1">
      {items.map((item) => {
        const active = istAktiv(pathname, item.href)
        const Icon = NAV_ICONS[item.href] ?? LayoutDashboard
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={item.kind === 'later' ? `${item.label} folgt` : item.label}
              className={cn(
                'group relative flex items-center gap-2 rounded-xl border px-3 py-2 transition outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/40',
                active
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-transparent text-foreground/80 hover:border-border hover:bg-muted',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-opacity',
                  active ? 'bg-primary opacity-100' : 'opacity-0 group-hover:opacity-50',
                )}
              />
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100')} />
              <span className="min-w-0 truncate">{item.label}</span>
              {item.kind === 'later' ? (
                <span className="ml-auto shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  folgt
                </span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const session = useAdminSession()
  const sichtbar = filterAdminNav(ADMIN_NAV_ITEMS, session)
  const ready = sichtbar.filter((item) => item.kind === 'ready')
  const later = sichtbar.filter((item) => item.kind === 'later')

  return (
    <div
      className={cn(
        'group/sidebar sticky top-0 h-[100dvh] w-full shrink-0 bg-card/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-lg',
        className,
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/admin" className="text-base font-extrabold tracking-tight" aria-label="Steuerzentrale">
          Jetnity Steuerzentrale
        </Link>
      </div>

      <nav className="h-[calc(100dvh-56px)] overflow-y-auto px-3 py-4 text-sm" aria-label="Hauptnavigation">
        <div className="space-y-4">
          <div>
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Betrieb
            </p>
            <NavListe items={ready} pathname={pathname} />
          </div>
          <div>
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Später
            </p>
            <NavListe items={later} pathname={pathname} />
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <div>Interner Betrieb</div>
          <div className="opacity-80">© {new Date().getFullYear()} Jetnity</div>
        </div>
      </nav>
    </div>
  )
}

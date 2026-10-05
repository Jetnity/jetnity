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
  HeartPulse,
  Wallet,
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
  '/admin/system-health': HeartPulse,
  '/admin/provider-ops': Wallet,
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
              aria-label={item.kind === 'later' ? `${item.label} · In Planung` : item.label}
              aria-current={active ? 'page' : undefined}
              title={item.kind === 'later' ? `${item.label} · In Planung` : item.label}
              className={cn(
                'group relative flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 transition outline-none',
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
              <span className="min-w-0 truncate group-data-[collapsed=true]/admin-nav:hidden">{item.label}</span>
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
          <span className="group-data-[collapsed=true]/admin-nav:hidden">Jetnity Steuerzentrale</span>
          <span aria-hidden className="hidden group-data-[collapsed=true]/admin-nav:inline">J</span>
        </Link>
      </div>

      <nav className="h-[calc(100dvh-56px)] overflow-y-auto px-3 py-4 text-sm" aria-label="Hauptnavigation">
        <div className="space-y-4">
          <div>
            <p className="mb-1 px-2 group-data-[collapsed=true]/admin-nav:hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Betrieb
            </p>
            <NavListe items={ready} pathname={pathname} />
          </div>
          <div>
            <p className="mb-1 px-2 group-data-[collapsed=true]/admin-nav:hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              In Planung
            </p>
            <NavListe items={later} pathname={pathname} />
          </div>
        </div>

        <div className="mt-6 group-data-[collapsed=true]/admin-nav:hidden border-t border-border pt-3 text-[11px] text-muted-foreground">
          <div>Interner Betrieb</div>
          <div className="opacity-80">© {new Date().getFullYear()} Jetnity</div>
        </div>
      </nav>
    </div>
  )
}

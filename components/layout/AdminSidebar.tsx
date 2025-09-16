// components/layout/AdminSidebar.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Images,
  Megaphone,
  CreditCard,
  ShieldCheck,
  Bot,
  Settings,
  Activity, // Control Center Icon
  Globe,    // Domains & E-Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType<{ className?: string }>
  title?: string
}

type NavSection = {
  label: string
  items: NavItem[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const SECTIONS: NavSection[] = [
  {
    label: 'Übersicht',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, title: 'Startübersicht' },
      { label: 'Control Center', href: '/admin/control-center', icon: Activity, title: 'Systemzentrale & Metriken' },
      { label: 'CoPilot Pro', href: '/admin/copilot', icon: Bot, title: 'KI Steuerzentrale' },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { label: 'Nutzer & Creator', href: '/admin/users', icon: Users },
      { label: 'Inhalte & Uploads', href: '/admin/content', icon: FolderKanban },
      // ↑ Route existiert bereits. Falls du /review willst, leg /admin/media-studio/review/page.tsx an.
      { label: 'Medien-Studio', href: '/admin/media-studio', icon: Images, title: 'KI-Medien & Reviews' },
    ],
  },
  {
    label: 'Marketing',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { label: 'Kampagnen', href: '/admin/marketing', icon: Megaphone },
      { label: 'Zahlungen', href: '/admin/payments', icon: CreditCard, title: 'Provider & Transaktionen' },
    ],
  },
  {
    label: 'Sicherheit & Settings',
    items: [
      { label: 'Domains & E-Mail', href: '/admin/domains-email', icon: Globe, title: 'DNS & Mail' }, // ← hinzugefügt
      { label: 'Security', href: '/admin/security', icon: ShieldCheck },
      { label: 'Einstellungen', href: '/admin/settings', icon: Settings },
    ],
  },
]

const LS_PREFIX = 'admin:nav:sect:collapsed:'

export default function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const s of SECTIONS) {
      if (s.collapsible) {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_PREFIX + s.label) : null
        init[s.label] = saved === '1' ? true : !!s.defaultCollapsed
      }
    }
    return init
  })

  React.useEffect(() => {
    for (const [label, val] of Object.entries(collapsed)) {
      try {
        localStorage.setItem(LS_PREFIX + label, val ? '1' : '0')
      } catch {
        /* ignore */
      }
    }
  }, [collapsed])

  const toggle = (label: string) => setCollapsed((p) => ({ ...p, [label]: !p[label] }))

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'group/sidebar sticky top-0 h-[100dvh] w-72 shrink-0 border-r bg-card/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-lg',
        'border-border',
        className
      )}
      aria-label="Admin Navigation"
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/admin" className="text-base font-extrabold tracking-tight" aria-label="Admin Start">
          Jetnity Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100dvh-56px)] overflow-y-auto px-3 py-4 text-sm" role="navigation" aria-label="Hauptnavigation">
        <ul className="space-y-4">
          {SECTIONS.map((section) => {
            const isCollapsible = !!section.collapsible
            const isCollapsed = isCollapsible && collapsed[section.label]
            const sectId = `sect-${section.label.replace(/\s+/g, '-').toLowerCase()}`
            return (
              <li key={section.label}>
                <div className="mb-1 flex items-center justify-between px-2">
                  <span className="select-none text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </span>
                  {isCollapsible && (
                    <button
                      type="button"
                      onClick={() => toggle(section.label)}
                      className="rounded px-1 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                      aria-expanded={!isCollapsed}
                      aria-controls={sectId}
                    >
                      {isCollapsed ? 'Auf' : 'Zu'}klappen
                    </button>
                  )}
                </div>

                <ul id={sectId} className={cn('mt-1 space-y-1 px-1', isCollapsible && isCollapsed && 'hidden')}>
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          title={item.title || item.label}
                          className={cn(
                            'group relative flex items-center gap-2 rounded-xl border px-3 py-2 transition outline-none',
                            'focus-visible:ring-2 focus-visible:ring-primary/40',
                            active
                              ? 'border-primary/30 bg-primary/10 text-foreground'
                              : 'border-transparent text-foreground/80 hover:border-border hover:bg-muted'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-opacity',
                              active ? 'bg-primary opacity-100' : 'opacity-0 group-hover:opacity-50'
                            )}
                          />
                          <Icon className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100')} />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>

        {/* Footer */}
        <div className="mt-6 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <div>v1.0 • Admin</div>
          <div className="opacity-80">© {new Date().getFullYear()} Jetnity</div>
        </div>
      </nav>
    </aside>
  )
}

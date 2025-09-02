// components/layout/AdminSidebar.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileBarChart,
  MessageSquare,
  AlertTriangle,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType<{ className?: string }>
}

type NavSection = {
  label: string
  items: NavItem[]
  /** Optional: einklappbar (merkt sich Zustand) */
  collapsible?: boolean
  /** Optional: initial eingeklappt */
  defaultCollapsed?: boolean
}

const SECTIONS: NavSection[] = [
  {
    label: 'Übersicht',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { label: 'Nutzer', href: '/admin/users', icon: Users },
      { label: 'Sessions', href: '/admin/sessions', icon: CalendarClock },
      { label: 'Reports', href: '/admin/reports', icon: FileBarChart },
    ],
  },
  {
    label: 'Moderation',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { label: 'Kommentare', href: '/admin/comments', icon: MessageSquare },
      { label: 'Meldungen', href: '/admin/moderation', icon: AlertTriangle },
    ],
  },
  {
    label: 'Einstellungen',
    items: [{ label: 'Allgemein', href: '/admin/settings', icon: Settings }],
  },
]

export default function AdminSidebar({
  className,
}: {
  className?: string
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const s of SECTIONS) {
      if (s.collapsible) init[s.label] = !!s.defaultCollapsed
    }
    return init
  })

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const toggle = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }))

  return (
    <aside
      className={cn(
        'sticky top-0 h-[100dvh] w-72 shrink-0 border-r bg-card/60 backdrop-blur supports-blur:backdrop-blur-lg',
        'border-border',
        className
      )}
      aria-label="Admin Navigation"
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link
          href="/admin/dashboard"
          className="text-base font-extrabold tracking-tight"
          aria-label="Admin Start"
        >
          Jetnity Admin
        </Link>
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin no-scrollbar h-[calc(100dvh-56px)] overflow-y-auto px-3 py-4 text-sm">
        <ul className="space-y-4">
          {SECTIONS.map((section) => {
            const isCollapsible = !!section.collapsible
            const isCollapsed = isCollapsible && collapsed[section.label]
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
                      aria-controls={`sect-${section.label}`}
                    >
                      {isCollapsed ? 'Auf' : 'Zu'}klappen
                    </button>
                  )}
                </div>

                <ul
                  id={`sect-${section.label}`}
                  className={cn(
                    'mt-1 space-y-1 px-1',
                    isCollapsible && isCollapsed && 'hidden'
                  )}
                >
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'group flex items-center gap-2 rounded-xl border px-3 py-2 transition',
                            active
                              ? 'border-primary/30 bg-primary/10 text-foreground'
                              : 'border-transparent text-foreground/80 hover:border-border hover:bg-muted'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>

        {/* Footer-Zeile in der Sidebar */}
        <div className="mt-6 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <div>v1.0 • Admin</div>
          <div className="opacity-80">© {new Date().getFullYear()} Jetnity</div>
        </div>
      </nav>
    </aside>
  )
}

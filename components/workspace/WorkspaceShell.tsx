'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Globe2, Menu, PanelLeftClose, PanelLeftOpen, Plus, Settings2, Luggage, UsersRound, X } from 'lucide-react'
import GastCreateLink from '@/components/trips/GastCreateLink'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import { accountNavigationAktiv } from '@/lib/account/navigation'
import WorkspaceAccountMenu from './WorkspaceAccountMenu'
import WorkspaceNavItem from './WorkspaceNavItem'
import { WorkspaceContext } from './WorkspaceContext'
import './workspace.css'

const PERSONAL = [
  { label: 'Meine Reisen', href: '/reisen', icon: Luggage },
  { label: 'Deine Welt', href: '/account/welt', icon: Globe2 },
  { label: 'Reisende', href: '/account/travellers', icon: UsersRound },
  { label: 'Einstellungen', href: '/account/settings', icon: Settings2 },
] as const

const FOCUSABLE = 'a[href], button:not(:disabled), summary, [tabindex="0"]'

export default function WorkspaceShell({ children, contentId = 'workspace-content' }: {
  children: ReactNode
  contentId?: string
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navigation, setNavigation] = useState<HTMLElement | null>(null)
  const [mobile, setMobile] = useState<HTMLElement | null>(null)
  const [actions, setActions] = useState<HTMLElement | null>(null)
  const [title, setTitle] = useState<HTMLElement | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeNavigation = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 64rem)')
    const changed = () => { if (media.matches) setMobileOpen(false) }
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const before = document.body.style.overflow
    const trigger = menuRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = before
      if (trigger?.getClientRects().length) trigger.focus({ preventScroll: true })
    }
  }, [mobileOpen])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const root = document.documentElement
    const before = root.style.getPropertyValue('--jet-header-h')
    const measure = () => {
      const enlarged = parseFloat(getComputedStyle(root).fontSize) >= 24
      header.dataset.flow = String(enlarged)
      const sticky = getComputedStyle(header).position === 'sticky'
      root.style.setProperty('--jet-header-h', `${sticky ? Math.ceil(header.getBoundingClientRect().height) : 0}px`)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    measure()
    return () => { observer.disconnect(); root.style.setProperty('--jet-header-h', before) }
  }, [])

  const slots = useMemo(() => ({ navigation, mobile, actions, title, collapsed: collapsed && !mobileOpen, closeNavigation }),
    [navigation, mobile, actions, title, collapsed, mobileOpen, closeNavigation])
  const heading = pathname === '/planen' ? 'Reise planen'
    : pathname === '/reisen' ? 'Meine Reisen'
    : pathname.startsWith('/account') ? 'Mein Bereich' : 'Deine Reise'

  return (
    <WorkspaceContext.Provider value={slots}>
      <div className="workspace-shell" data-collapsed={collapsed} data-menu-open={mobileOpen}>
        <div inert={mobileOpen}><SkipToContentLink targetId={contentId} /></div>
        {mobileOpen && <button type="button" className="workspace-backdrop" tabIndex={-1}
          aria-label="Navigation schliessen" onClick={closeNavigation} />}
        <aside ref={sidebarRef} className="workspace-sidebar" id="workspace-navigation"
          role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? true : undefined}
          aria-label="Workspace-Navigation" onKeyDown={(event) => {
            if (!mobileOpen) return
            if (event.key === 'Escape') { event.preventDefault(); closeNavigation(); return }
            if (event.key !== 'Tab') return
            const items = [...(sidebarRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
              .filter((el) => el.getClientRects().length > 0)
            const first = items[0]; const last = items.at(-1)
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
          }}>
          <div className="workspace-brand-row">
            <Link href="/" aria-label="Jetnity Startseite" className="workspace-brand" onClick={closeNavigation}>
              {/* Static local brand asset; no image optimizer or remote image source. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/jetnity-logo.png" alt="" width={140} height={48} />
            </Link>
            <button type="button" ref={closeRef} className="workspace-icon-button workspace-mobile-close"
              aria-label="Navigation schliessen" onClick={closeNavigation}><X aria-hidden="true" /></button>
          </div>
          <button type="button" className="workspace-collapse workspace-button"
            aria-label={collapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'} aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            <span className="workspace-nav-label">Einklappen</span>
          </button>
          <section className="workspace-nav-group" aria-label="Reiseplanung">
            <p className="workspace-kicker">Reiseplanung</p>
            <div ref={setNavigation} className="workspace-trip-navigation" />
            <div className="workspace-no-trip">
              <WorkspaceNavItem label="Reise auswählen" collapsed={collapsed && !mobileOpen}>
                <Link href="/reisen" className="workspace-open-trip" onClick={closeNavigation} aria-label="Reise auswählen">
                  <Luggage aria-hidden="true" /><span className="workspace-nav-label">Reise auswählen</span>
                </Link>
              </WorkspaceNavItem>
              <p className="workspace-nav-label">Öffne eine Reise, um deinen Plan zu bearbeiten.</p>
            </div>
          </section>
          <section className="workspace-nav-group">
            <p className="workspace-kicker">Mein Bereich</p>
            <nav aria-label="Mein Bereich">
              {PERSONAL.map(({ href, label, icon: Icon }) => (
                <WorkspaceNavItem key={href} label={label} collapsed={collapsed && !mobileOpen}>
                  <Link href={href} className="workspace-nav-link" onClick={closeNavigation}
                    aria-label={label} aria-current={accountNavigationAktiv(pathname, href) && !pathname.startsWith('/reisen/') ? 'page' : undefined}>
                    <Icon aria-hidden="true" /><span className="workspace-nav-label">{label}</span>
                  </Link>
                </WorkspaceNavItem>
              ))}
            </nav>
          </section>
          <div className="workspace-sidebar-end">
            <WorkspaceNavItem label="Entdecken" collapsed={collapsed && !mobileOpen}>
              <Link href="/entdecken" className="workspace-nav-link" aria-label="Entdecken" onClick={closeNavigation}>
                <Compass aria-hidden="true" /><span className="workspace-nav-label">Entdecken</span>
              </Link>
            </WorkspaceNavItem>
            <p className="workspace-nav-label">Deine ganze Reise.<br />An einem Ort.</p>
          </div>
        </aside>
        <div className="workspace-page" inert={mobileOpen}>
          <header ref={headerRef} className="workspace-header">
            <button ref={menuRef} type="button" className="workspace-button workspace-menu-button"
              aria-label="Navigation öffnen"
              aria-expanded={mobileOpen} aria-controls="workspace-navigation" onClick={() => setMobileOpen(true)}>
              <Menu aria-hidden="true" /><span>Menü</span>
            </button>
            <div className="workspace-context"><span ref={setTitle} /><span className="workspace-default-title">{heading}</span></div>
            <div ref={setActions} className="workspace-header-actions" />
            <div className="workspace-header-global">
              <GastCreateLink createLabel="Reise planen" className="workspace-button workspace-primary">
                <Plus aria-hidden="true" /><span>Reise planen</span>
              </GastCreateLink>
              <WorkspaceAccountMenu />
            </div>
          </header>
          <div ref={setMobile} className="workspace-mobile-navigation" />
          <div id={contentId} tabIndex={-1} className="workspace-content">{children}</div>
          <footer className="workspace-credit">
            <span>© {new Date().getFullYear()} Jetnity</span>
            <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">Ortsdaten: GeoNames (CC BY 4.0)</a>
          </footer>
        </div>
      </div>
    </WorkspaceContext.Provider>
  )
}

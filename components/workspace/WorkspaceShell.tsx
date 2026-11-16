'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Globe2, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Sun, Luggage, UsersRound, X } from 'lucide-react'
import GastCreateLink from '@/components/trips/GastCreateLink'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import BackToTop from '@/components/layout/BackToTop'
import { accountNavigationAktiv } from '@/lib/account/navigation'
import WorkspaceAccountMenu from './WorkspaceAccountMenu'
import { WorkspaceContext } from './WorkspaceContext'
import useWorkspaceTheme from './useWorkspaceTheme'
import './workspace.css'
import './workspace-surfaces.css'

const PERSONAL = [
  { label: 'Meine Reisen', href: '/reisen', icon: Luggage },
  { label: 'Meine Welt', href: '/account/welt', icon: Globe2 },
  { label: 'Reisende', href: '/account/travellers', icon: UsersRound },
] as const

const FOCUSABLE = 'a[href], button:not(:disabled), summary, [tabindex="0"]'

export default function WorkspaceShell({ children, contentId = 'workspace-content' }: {
  children: ReactNode
  contentId?: string
}) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useWorkspaceTheme()
  const [hovered, setHovered] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [touchOpen, setTouchOpen] = useState(false)
  const expanded = hovered || keyboardOpen || touchOpen
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(pathname)
  // The drawer belongs to its route. Browser Back/Forward must release the page.
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMobileOpen(false)
    setKeyboardOpen(false)
    setTouchOpen(false)
  }
  const [navigation, setNavigation] = useState<HTMLElement | null>(null)
  const [mobile, setMobile] = useState<HTMLElement | null>(null)
  const [actions, setActions] = useState<HTMLElement | null>(null)
  const [title, setTitle] = useState<HTMLElement | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreMenuFocus = useRef(true)
  const closeNavigation = useCallback(() => setMobileOpen(false), [])
  const finishNavigation = useCallback(() => {
    // A selected destination owns focus; only dismissal returns to the trigger.
    restoreMenuFocus.current = false
    setMobileOpen(false)
    setTouchOpen(false)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 64rem)')
    const changed = () => {
      if (media.matches) setMobileOpen(false)
      setHovered(false)
      setKeyboardOpen(false)
      setTouchOpen(false)
    }
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])

  useEffect(() => {
    if (!touchOpen) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !sidebarRef.current?.contains(event.target)) setTouchOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [touchOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const before = document.body.style.overflow
    const trigger = menuRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = before
      if (restoreMenuFocus.current && window.location.pathname === pathname && trigger?.getClientRects().length) trigger.focus({ preventScroll: true })
    }
  }, [mobileOpen, pathname])

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return
    // Trip links arrive through portals: native events follow their DOM parent,
    // while React's synthetic propagation follows the portal's component tree.
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setHovered(true)
    }
    const leave = () => setHovered(false)
    const pointer = () => setKeyboardOpen(false)
    const focus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) setKeyboardOpen(true)
    }
    const blur = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !sidebar.contains(event.relatedTarget)) setKeyboardOpen(false)
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setHovered(false)
        setKeyboardOpen(false)
        setTouchOpen(false)
        if (mobileOpen) closeNavigation()
        return
      }
      if (!mobileOpen || event.key !== 'Tab') return
      const items = [...sidebar.querySelectorAll<HTMLElement>(FOCUSABLE)]
        .filter((el) => el.getClientRects().length > 0)
      const first = items[0]; const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    sidebar.addEventListener('pointerenter', enter)
    sidebar.addEventListener('pointerleave', leave)
    sidebar.addEventListener('pointerdown', pointer)
    sidebar.addEventListener('focusin', focus)
    sidebar.addEventListener('focusout', blur)
    sidebar.addEventListener('keydown', key)
    return () => {
      sidebar.removeEventListener('pointerenter', enter)
      sidebar.removeEventListener('pointerleave', leave)
      sidebar.removeEventListener('pointerdown', pointer)
      sidebar.removeEventListener('focusin', focus)
      sidebar.removeEventListener('focusout', blur)
      sidebar.removeEventListener('keydown', key)
    }
  }, [mobileOpen, closeNavigation])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const root = document.documentElement
    const before = root.style.getPropertyValue('--jet-header-h')
    const measure = () => {
      const enlarged = parseFloat(getComputedStyle(root).fontSize) >= 24
      header.dataset.flow = String(enlarged)
      const sticky = getComputedStyle(header).position === 'sticky'
      const height = Math.ceil(header.getBoundingClientRect().height)
      root.style.setProperty('--jet-header-h', `${sticky ? height : 0}px`)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    measure()
    return () => { observer.disconnect(); root.style.setProperty('--jet-header-h', before) }
  }, [])

  const slots = useMemo(() => ({ navigation, mobile, actions, title, closeNavigation, finishNavigation }),
    [navigation, mobile, actions, title, closeNavigation, finishNavigation])
  const heading = pathname === '/planen' ? 'Reise planen'
    : pathname === '/reisen' ? 'Meine Reisen'
    : pathname === '/account/welt' ? 'Meine Welt' : pathname === '/account' ? 'Dein Jetnity' : pathname.startsWith('/account') ? 'Mein Bereich' : 'Deine Reise'

  return (
    <WorkspaceContext.Provider value={slots}>
      <div className="workspace-shell" data-workspace-theme={theme} data-collapsed={!expanded} data-menu-open={mobileOpen}>
        <div inert={mobileOpen}><SkipToContentLink targetId={contentId} /></div>
        <header ref={headerRef} className="workspace-header" inert={mobileOpen}>
          <button ref={menuRef} type="button" className="workspace-icon-button workspace-menu-button"
            aria-label="Navigation öffnen"
            aria-expanded={mobileOpen} aria-controls="workspace-navigation" onClick={() => { restoreMenuFocus.current = true; setMobileOpen(true) }}>
            <Menu aria-hidden="true" /><span>Menü</span>
          </button>
          <Link href="/" aria-label="Jetnity Startseite" className="workspace-brand workspace-header-brand">
            {/* Static local brand asset; no image optimizer or remote image source. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/jetnity-logo.png" alt="" width={140} height={48} />
          </Link>
          <div className="workspace-context"><span ref={setTitle} /><span className="workspace-default-title">{heading}</span></div>
          <div ref={setActions} className="workspace-header-actions" />
          <div className="workspace-header-global">
            <button type="button" className="workspace-icon-button workspace-theme-toggle" onClick={toggleTheme}
              aria-label={theme === 'green' ? 'Helle Darstellung aktivieren' : 'Grünes Design aktivieren'}
              title={theme === 'green' ? 'Zur hellen Darstellung wechseln' : 'Zum grünen Design wechseln'}>
              {theme === 'green' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <GastCreateLink createLabel="Reise planen" className="workspace-button workspace-primary">
              <Plus aria-hidden="true" /><span>Reise planen</span>
            </GastCreateLink>
            <WorkspaceAccountMenu />
          </div>
        </header>
        {mobileOpen && <button type="button" className="workspace-backdrop" tabIndex={-1}
          aria-label="Navigation schliessen" onClick={closeNavigation} />}
        <aside ref={sidebarRef} className="workspace-sidebar" id="workspace-navigation"
          role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? true : undefined}
          aria-label="Workspace-Navigation">
          <div className="workspace-brand-row">
            <Link href="/" aria-label="Jetnity Startseite" className="workspace-brand" onClick={finishNavigation}>
              {/* Static local brand asset; no image optimizer or remote image source. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/jetnity-logo.png" alt="" width={140} height={48} />
            </Link>
            <button type="button" ref={closeRef} className="workspace-icon-button workspace-mobile-close"
              aria-label="Navigation schliessen" onClick={closeNavigation}><X aria-hidden="true" /></button>
          </div>
          <button type="button" className="workspace-touch-toggle workspace-icon-button"
            aria-label={touchOpen ? 'Seitenleiste schließen' : 'Seitenleiste öffnen'} aria-expanded={expanded}
            aria-controls="workspace-navigation" onClick={() => setTouchOpen((value) => !value)}>
            {touchOpen ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
          </button>
          <section className="workspace-nav-group" aria-label="Reiseplanung">
            <p className="workspace-kicker">Reiseplanung</p>
            <div ref={setNavigation} className="workspace-trip-navigation" />
            <div className="workspace-no-trip">
              <Link href="/reisen" className="workspace-open-trip"
                onClick={pathname === '/reisen' ? closeNavigation : finishNavigation} aria-label="Reise auswählen">
                <Luggage aria-hidden="true" /><span className="workspace-nav-label">Reise auswählen</span>
              </Link>
              <p className="workspace-nav-label">Öffne eine Reise, um deinen Plan zu bearbeiten.</p>
            </div>
          </section>
          <section className="workspace-nav-group">
            <p className="workspace-kicker">Mein Bereich</p>
            <nav aria-label="Mein Bereich">
              {PERSONAL.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="workspace-nav-link" onClick={pathname === href ? closeNavigation : finishNavigation}
                  aria-label={label} aria-current={accountNavigationAktiv(pathname, href) && !pathname.startsWith('/reisen/') ? 'page' : undefined}>
                  <Icon aria-hidden="true" /><span className="workspace-nav-label">{label}</span>
                </Link>
              ))}
            </nav>
          </section>
          <div className="workspace-sidebar-end">
            <Link href="/entdecken" className="workspace-nav-link" aria-label="Entdecken" onClick={finishNavigation}>
              <Compass aria-hidden="true" /><span className="workspace-nav-label">Entdecken</span>
            </Link>
            <p className="workspace-nav-label">Deine ganze Reise.<br />An einem Ort.</p>
          </div>
        </aside>
        <div className="workspace-page" inert={mobileOpen}>
          <div ref={setMobile} className="workspace-mobile-navigation" />
          <div id={contentId} tabIndex={-1} className="workspace-content">{children}</div>
          <footer className="workspace-credit">
            <span>© {new Date().getFullYear()} Jetnity</span>
          </footer>
          <BackToTop />
        </div>
      </div>
    </WorkspaceContext.Provider>
  )
}

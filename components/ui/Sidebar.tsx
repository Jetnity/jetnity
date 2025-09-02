'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  Menu, ChevronDown, ChevronRight, X, Search as SearchIcon, Bell, Settings, LogOut,
  User as UserIcon, Moon, Sun, Globe, Sparkles
} from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* ========================================================================== */
/* Utils                                                                       */
/* ========================================================================== */

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
const isBrowser = typeof window !== 'undefined'
const FOCUSABLE = [
  'a[href]','area[href]','button:not([disabled])','input:not([disabled])',
  'select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])',
].join(',')

/* Theme helper (light/dark/system via <html class="dark">) */
type ThemeMode = 'light' | 'dark' | 'system'
const Theme = {
  get(): ThemeMode {
    if (!isBrowser) return 'system'
    return (localStorage.getItem('theme') as ThemeMode) ?? 'system'
  },
  apply(mode: ThemeMode) {
    if (!isBrowser) return
    const root = document.documentElement
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const dark = mode === 'dark' || (mode === 'system' && prefersDark)
    root.classList.toggle('dark', dark)
    if (mode === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', mode)
  },
}

/* ========================================================================== */
/* Context                                                                      */
/* ========================================================================== */

type SidebarContextType = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  width: number
  setWidth: (px: number) => void
  isMobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  railWidth: number
}

const SidebarCtx = React.createContext<SidebarContextType | null>(null)
export const useSidebar = () => {
  const ctx = React.useContext(SidebarCtx)
  if (!ctx) throw new Error('useSidebar must be used within <Sidebar>')
  return ctx
}

/* ========================================================================== */
/* Root Sidebar                                                                */
/* ========================================================================== */

export type SidebarProps = {
  children: React.ReactNode
  ariaLabel?: string
  defaultCollapsed?: boolean
  storageKey?: { collapsed: string; width: string }
  expandedWidth?: number
  collapsedWidth?: number
  resizable?: boolean
  minWidth?: number
  maxWidth?: number
  className?: string
  stickyHeader?: boolean
  stickyFooter?: boolean
}

export default function Sidebar({
  children,
  ariaLabel = 'Navigation',
  defaultCollapsed = false,
  storageKey = { collapsed: 'sb:collapsed', width: 'sb:width' },
  expandedWidth = 272,
  collapsedWidth = 72,
  resizable = true,
  minWidth = 220,
  maxWidth = 380,
  className,
  stickyHeader = true,
  stickyFooter = true,
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const [width, setWidth] = React.useState(expandedWidth)
  const [isDragging, setDragging] = React.useState(false)
  const [isMobileOpen, setMobileOpen] = React.useState(false)
  const asideRef = React.useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  /* Rehydrate */
  React.useEffect(() => {
    if (!isBrowser) return
    try {
      const c = localStorage.getItem(storageKey.collapsed)
      if (c != null) setCollapsed(c === '1')
      const w = localStorage.getItem(storageKey.width)
      if (w != null) setWidth(Math.min(Math.max(parseInt(w, 10), minWidth), maxWidth))
    } catch {}
    Theme.apply(Theme.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Persist */
  React.useEffect(() => { try { localStorage.setItem(storageKey.collapsed, collapsed ? '1' : '0') } catch {} }, [collapsed])
  React.useEffect(() => { try { localStorage.setItem(storageKey.width, String(width)) } catch {} }, [width])

  /* Shortcut: Cmd/Ctrl + B toggles */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey
      if (cmd && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); setCollapsed(v => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Drag resize */
  React.useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => setWidth(Math.min(Math.max(e.clientX, minWidth), maxWidth))
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isDragging, minWidth, maxWidth])

  /* Mobile focus trap + body lock */
  React.useEffect(() => {
    if (!isMobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const el = asideRef.current as HTMLElement | null
    const nodes = el ? Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)) : []
    const first = nodes[0], last = nodes[nodes.length - 1]
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
      if (e.key !== 'Tab' || nodes.length === 0) return
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKey)
    first?.focus()
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [isMobileOpen])

  const ctx: SidebarContextType = {
    collapsed,
    setCollapsed,
    width: collapsed ? collapsedWidth : width,
    setWidth,
    isMobileOpen,
    setMobileOpen,
    railWidth: collapsedWidth,
  }

  return (
    <SidebarCtx.Provider value={ctx}>
      {/* Mobile Overlay */}
      {mounted && createPortal(
        <div
          className={cn(
            'fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] md:hidden transition-opacity',
            isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden={!isMobileOpen}
        />,
        document.body
      )}

      <aside
        ref={asideRef as any}
        data-collapsed={collapsed ? '' : undefined}
        className={cn(
          'group/sidebar relative z-[75] h-full border-r border-border bg-background text-foreground',
          'fixed left-0 top-0 md:static md:block',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
          'transition-transform',
          className
        )}
        style={{ width: `${ctx.width}px` }}
        aria-label={ariaLabel}
      >
        {/* Rail width in collapsed */}
        <style dangerouslySetInnerHTML={{ __html: `aside[data-collapsed]{width:${ctx.railWidth}px !important}` }} />

        <div className="flex h-full flex-col">
          {stickyHeader && <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70" />}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {stickyFooter && <div className="sticky bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70" />}
        </div>

        {resizable && !collapsed && (
          <div
            onMouseDown={() => setDragging(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Seitenleiste in der Breite anpassen"
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-transparent hover:bg-primary/20 active:bg-primary/30"
          />
        )}
      </aside>
    </SidebarCtx.Provider>
  )
}

/* ========================================================================== */
/* Building Blocks                                                             */
/* ========================================================================== */

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-2 px-3 py-3', className)}>{children}</div>
}

export function SidebarBrand({ logo, title }: { logo?: React.ReactNode; title?: string }) {
  const { setMobileOpen, collapsed, setCollapsed } = useSidebar()
  return (
    <div className="flex items-center gap-2 px-3 py-3">
      <button
        type="button"
        onClick={() => (window.innerWidth < 768 ? setMobileOpen(true) : setCollapsed(!collapsed))}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
        aria-label="Menü ein-/ausblenden (⌘/Ctrl+B)"
        title="Menü (⌘/Ctrl+B)"
      >
        <Menu className="h-5 w-5" />
      </button>
      {logo}
      {!collapsed && title && <div className="text-base font-semibold">{title}</div>}
    </div>
  )
}

export function SidebarSearch({
  value, onChange, onSubmit, placeholder = 'Suchen…', className,
}: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string; className?: string }) {
  const { collapsed } = useSidebar()
  return (
    <div className={cn('px-3 py-2', className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
          placeholder={placeholder}
          className={cn('w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground', collapsed && 'pointer-events-none opacity-60')}
          disabled={collapsed}
          aria-label="Sidebar Suche"
        />
      </div>
    </div>
  )
}

export function SidebarSection({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar()
  return (
    <div className={cn('px-2 py-2', className)}>
      {title && !collapsed && <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>}
      <nav aria-label={title || 'Sektion'}>{children}</nav>
    </div>
  )
}
export function SidebarSeparator({ className }: { className?: string }) { return <div className={cn('my-2 h-px bg-border/80', className)} /> }
export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('mt-auto px-2 py-2', className)}>{children}</div> }

/* Items & Groups */

export function SidebarItem({
  icon: Icon, label, href, badge, exact = false, onClick, className,
}: { icon?: React.ElementType; label: string; href?: string; badge?: string|number; exact?: boolean; onClick?: () => void; className?: string }) {
  const pathname = usePathname()
  const { collapsed, setMobileOpen } = useSidebar()
  const isActive = href ? (exact ? pathname === href : pathname.startsWith(href)) : false

  const content = (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition',
        isActive ? 'bg-primary/10 ring-1 ring-primary/30 text-foreground' : 'hover:bg-accent hover:text-accent-foreground',
        className
      )}
      title={collapsed ? label : undefined}
      data-tooltip={collapsed ? label : undefined}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />}
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && (
        <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">{badge}</span>
      )}
    </div>
  )

  /* Tooltip im Rail-Modus */
  const [tip, setTip] = React.useState<{x:number;y:number}|null>(null)
  const ref = React.useRef<HTMLDivElement|null>(null)
  const show = () => { if (!collapsed || !ref.current) return; const r = ref.current.getBoundingClientRect(); setTip({x:r.right+8,y:r.top+r.height/2}) }
  const hide = () => setTip(null)

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide}>
      {href ? (
        <Link href={href} className="block" onClick={() => { if (window.innerWidth < 768) setMobileOpen(false) }} aria-current={isActive ? 'page' : undefined}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="w-full text-left">{content}</button>
      )}
      {tip && createPortal(
        <div className="fixed z-[80] -translate-y-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md" style={{ left: tip.x, top: tip.y }} role="tooltip">{label}</div>,
        document.body
      )}
    </div>
  )
}

export function SidebarGroup({
  icon: Icon, label, children, defaultOpen = false, storageId, className,
}: { icon?: React.ElementType; label: string; children: React.ReactNode; defaultOpen?: boolean; storageId?: string; className?: string }) {
  const id = React.useId()
  const { collapsed } = useSidebar()
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => { if (!storageId) return; try { const v = localStorage.getItem(`sb:grp:${storageId}`); if (v!=null) setOpen(v==='1') } catch {} }, [storageId])
  React.useEffect(() => { if (!storageId) return; try { localStorage.setItem(`sb:grp:${storageId}`, open?'1':'0') } catch {} }, [open, storageId])

  if (collapsed) return (
    <div className={cn('px-2', className)} title={label}>
      <div className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm opacity-70">
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      </div>
    </div>
  )

  return (
    <div className={cn('px-2', className)}>
      <button type="button" className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm hover:bg-accent hover:text-accent-foreground" aria-expanded={open} aria-controls={id} onClick={() => setOpen(v=>!v)}>
        {Icon && <Icon className="h-4 w-4 opacity-90" aria-hidden="true" />}
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <div id={id} role="region" aria-label={label} hidden={!open} className="mt-1 space-y-1">{children}</div>
    </div>
  )
}

/* ========================================================================== */
/* UserCard + Theme/Language Toggle                                            */
/* ========================================================================== */

export function SidebarUserCard({
  name, email, avatarUrl, onSignOut, languages = ['de','en'], initialLang,
}: { name: string; email?: string; avatarUrl?: string; onSignOut?: () => void; languages?: string[]; initialLang?: string }) {
  const { collapsed } = useSidebar()
  const [open, setOpen] = React.useState(false)
  const [theme, setTheme] = React.useState<ThemeMode>(Theme.get())
  const [lang, setLang] = React.useState<string>(initialLang ?? (isBrowser ? (localStorage.getItem('locale') ?? 'de') : 'de'))

  React.useEffect(()=>Theme.apply(theme),[theme])
  React.useEffect(()=>{ try { localStorage.setItem('locale', lang) } catch {} },[lang])

  const initials = React.useMemo(() => name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase(), [name])

  const card = (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2">
      <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-border bg-muted flex items-center justify-center text-xs font-semibold">
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        {email && <div className="truncate text-xs text-muted-foreground">{email}</div>}
      </div>
      <button onClick={()=>setOpen(v=>!v)} className="ml-auto rounded-lg p-1 hover:bg-accent" aria-haspopup="menu" aria-expanded={open}><ChevronDown className="h-4 w-4" /></button>
    </div>
  )

  if (collapsed) return (
    <div className="px-2">
      <div className="mx-auto h-9 w-9 overflow-hidden rounded-full ring-1 ring-border bg-muted flex items-center justify-center text-xs font-semibold" title={`${name}${email?` – ${email}`:''}`}>
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
      </div>
    </div>
  )

  return (
    <div className="relative px-2">
      {card}
      {open && createPortal(
        <div className="fixed inset-0 z-[80]" onClick={()=>setOpen(false)}>
          <div className="absolute left-4 right-4 bottom-20 md:left-auto md:right-auto md:bottom-auto md:top-24 md:ml-4 w-[min(98vw,320px)] rounded-2xl border border-border bg-popover p-3 shadow-xl" onClick={(e)=>e.stopPropagation()} role="menu" aria-label="Benutzer-Menü">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>setTheme('light')} className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm', theme==='light'?'bg-primary/10 border-primary/40':'border-border hover:bg-accent')}><Sun className="h-4 w-4"/><span>Licht</span></button>
              <button onClick={()=>setTheme('dark')} className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm', theme==='dark'?'bg-primary/10 border-primary/40':'border-border hover:bg-accent')}><Moon className="h-4 w-4"/><span>Dunkel</span></button>
              <button onClick={()=>setTheme('system')} className={cn('col-span-2 flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm', theme==='system'?'bg-primary/10 border-primary/40':'border-border hover:bg-accent')}><Sparkles className="h-4 w-4"/><span>System</span></button>
            </div>

            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Sprache</div>
              <div className="flex flex-wrap gap-2">
                {languages.map(l => (
                  <button key={l} onClick={()=>setLang(l)} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs', lang===l?'bg-primary/10 border-primary/40':'border-border hover:bg-accent')}>
                    <Globe className="h-3.5 w-3.5"/>{l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-1">
              <Link href="/settings" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent"><Settings className="h-4 w-4"/><span>Einstellungen</span></Link>
              <Link href="/account"  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent"><UserIcon className="h-4 w-4"/><span>Konto</span></Link>
              <button onClick={onSignOut} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent text-rose-600"><LogOut className="h-4 w-4"/><span>Abmelden</span></button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ========================================================================== */
/* Command Palette (⌘/Ctrl+K)                                                  */
/* ========================================================================== */

export type CommandAction = { id: string; label: string; hint?: string; onRun: () => void }
export function CommandPalette({ actions }: { actions: CommandAction[] }) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(()=>setMounted(true),[])
  React.useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{ const cmd=e.metaKey||e.ctrlKey; if(cmd && (e.key==='k'||e.key==='K')){e.preventDefault(); setOpen(v=>!v)}; if(e.key==='Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[])
  const list = React.useMemo(()=>actions.filter(a=>a.label.toLowerCase().includes(q.trim().toLowerCase())),[actions,q])
  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={()=>setOpen(false)}>
      <div className="mx-auto mt-24 w-[min(700px,92vw)] rounded-2xl border border-border bg-popover p-2 shadow-2xl" onClick={(e)=>e.stopPropagation()} role="dialog" aria-label="Befehlspalette">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Befehl suchen… (Esc schließt)" className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none"/>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 hover:bg-accent" onClick={()=>setOpen(false)}><X className="h-4 w-4"/></button>
        </div>
        <div className="mt-2 max-h-[50vh] overflow-y-auto">
          {list.length===0 ? <div className="px-3 py-6 text-center text-sm text-muted-foreground">Keine Treffer</div> : (
            <ul className="divide-y divide-border/70">
              {list.map(a=>(
                <li key={a.id}>
                  <button onClick={()=>{ a.onRun(); setOpen(false) }} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent">
                    <span>{a.label}</span>
                    {a.hint && <span className="text-xs text-muted-foreground">{a.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ========================================================================== */
/* Notifications Drawer                                                        */
/* ========================================================================== */

export type Notification = { id: string; title: string; text?: string; time?: string }
export function NotificationsButton({ items = [] }: { items?: Notification[] }) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(()=>setMounted(true),[])
  return (
    <>
      <button type="button" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent" onClick={()=>setOpen(true)} aria-label="Benachrichtigungen">
        <Bell className="h-5 w-5"/><span className="text-sm hidden md:inline">Benachrichtigungen</span>
      </button>
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-[1px]" onClick={()=>setOpen(false)}>
          <aside className="absolute right-0 top-0 h-full w-[min(420px,95vw)] bg-popover border-l border-border shadow-2xl" onClick={(e)=>e.stopPropagation()} aria-label="Benachrichtigungen">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Benachrichtigungen</div>
              <button className="rounded-lg p-1 hover:bg-accent" onClick={()=>setOpen(false)} aria-label="Schließen"><X className="h-4 w-4"/></button>
            </div>
            <div className="max-h-full overflow-y-auto p-2">
              {items.length===0 ? <div className="p-4 text-sm text-muted-foreground">Keine neuen Mitteilungen</div> : items.map(n=>(
                <div key={n.id} className="rounded-xl border border-border bg-card p-3 mb-2">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.text && <div className="text-sm text-muted-foreground">{n.text}</div>}
                  {n.time && <div className="mt-1 text-xs text-muted-foreground">{n.time}</div>}
                </div>
              ))}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  )
}

/* ========================================================================== */
/* Config Renderer                                                             */
/* ========================================================================== */

export type NavNode =
  | { type: 'section'; id: string; title?: string; children: NavNode[] }
  | { type: 'item'; id: string; label: string; href?: string; icon?: React.ElementType; badge?: string|number; exact?: boolean }
  | { type: 'group'; id: string; label: string; icon?: React.ElementType; defaultOpen?: boolean; children: NavNode[] }
  | { type: 'separator'; id: string }

export function SidebarFromConfig({ nodes }: { nodes: NavNode[] }) {
  return (
    <>
      {nodes.map(n => {
        if (n.type === 'section') return <SidebarSection key={n.id} title={n.title}><SidebarFromConfig nodes={n.children}/></SidebarSection>
        if (n.type === 'item') return <SidebarItem key={n.id} label={n.label} href={n.href} icon={n.icon} badge={n.badge} exact={n.exact}/>
        if (n.type === 'group') return <SidebarGroup key={n.id} label={n.label} icon={n.icon} defaultOpen={n.defaultOpen} storageId={n.id}><SidebarFromConfig nodes={n.children}/></SidebarGroup>
        return <SidebarSeparator key={n.id}/>
      })}
    </>
  )
}

/* ========================================================================== */
/* Full Example Sidebar (alles zusammen)                                       */
/* ========================================================================== */

export function ExampleSidebar() {
  const [query, setQuery] = React.useState('')
  const actions: CommandAction[] = [
    { id: 'new-trip', label: 'Neue Reise starten', hint: 'N', onRun: () => window.location.assign('/trip/new') },
    { id: 'open-settings', label: 'Einstellungen öffnen', onRun: () => window.location.assign('/settings') },
  ]
  const nav: NavNode[] = [
    { type: 'section', id: 'main', title: 'Allgemein', children: [
      { type: 'item', id: 'dash', label: 'Übersicht', href: '/dashboard' },
      { type: 'item', id: 'pass', label: 'Reisende', href: '/passengers', badge: 3 },
    ]},
    { type: 'group', id: 'bookings', label: 'Buchungen', defaultOpen: true, children: [
      { type: 'item', id: 'flights', label: 'Flüge', href: '/bookings/flights' },
      { type: 'item', id: 'hotels',  label: 'Hotels', href: '/bookings/hotels' },
      { type: 'item', id: 'cars',    label: 'Mietwagen', href: '/bookings/cars' },
    ]},
    { type: 'separator', id: 'sep1' },
    { type: 'item', id: 'settings', label: 'Einstellungen', href: '/settings', icon: Settings },
  ]

  return (
    <>
      <Sidebar ariaLabel="Hauptnavigation">
        <SidebarHeader>
          <SidebarBrand title="Jetnity" />
          <NotificationsButton />
        </SidebarHeader>

        <SidebarSearch value={query} onChange={setQuery} />

        <SidebarFromConfig nodes={nav} />

        <SidebarFooter>
          <div className="px-2 pb-2">
            <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">Pro Tipp</div>
              Drücke <kbd className="rounded bg-muted px-1 text-[10px]">⌘</kbd>+<kbd className="rounded bg-muted px-1 text-[10px]">B</kbd> zum Toggeln · <kbd className="rounded bg-muted px-1 text-[10px]">⌘</kbd>+<kbd className="rounded bg-muted px-1 text-[10px]">K</kbd> für Befehle
            </div>
          </div>
          <SidebarUserCard name="Sasa" email="you@example.com" />
        </SidebarFooter>
      </Sidebar>

      <CommandPalette actions={actions} />
    </>
  )
}

/* ========================================================================== */
/* Layout Beispiel                                                              */
/* ========================================================================== */

/* So bindest du die Sidebar in ein Layout ein:

// app/(dashboard)/layout.tsx
import Sidebar, { ExampleSidebar } from '@/components/ui/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-screen grid-cols-[auto_1fr]">
      <ExampleSidebar />
      <main className="h-full overflow-y-auto">{children}</main>
    </div>
  )
}

*/

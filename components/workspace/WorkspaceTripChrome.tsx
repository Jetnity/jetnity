'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LayoutDashboard, Route, BriefcaseBusiness, ClipboardCheck, BookUser, ChevronRight, Wallet } from 'lucide-react'
import TripWorkspaceModeNavigation from '@/components/trips/TripWorkspaceModeNavigation'
import { WORKSPACE_ANSICHTEN, WORKSPACE_ANSICHT_LABEL, type WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
import { useWorkspaceShell } from './WorkspaceContext'

const ICONS = { uebersicht: LayoutDashboard, plan: Route, organisieren: BriefcaseBusiness, vorbereitung: ClipboardCheck, einreise: BookUser }

export function WorkspacePortal({ slot, children }: { slot: 'actions' | 'title'; children: ReactNode }) {
  const shell = useWorkspaceShell()
  const target = shell?.[slot]
  if (target) return createPortal(children, target)
  return slot === 'title' ? null : children
}

export default function WorkspaceTripChrome(props: {
  ansicht: WorkspaceAnsicht
  kompakt: boolean
  detailOffen: boolean
  onWechsel: (ansicht: WorkspaceAnsicht, tastatur: boolean) => void
  /** Kostenzeile über der Leiste unten (DESIGN_SYSTEM.md 6.12). Nur auf Handy und Tablet. */
  kostenLeiste?: { text: string; onOeffnen: () => void } | null
}) {
  const shell = useWorkspaceShell()
  const bottomRef = useRef<HTMLElement>(null)
  const leisteRef = useRef<HTMLButtonElement>(null)
  const [flow, setFlow] = useState(false)
  /** Nur wenn die Leiste wegen Breite, Höhe oder Tastatur im Fluss steht, nicht wegen grosser Schrift. */
  const [raster, setRaster] = useState<'zwei' | 'fuenf' | null>(null)
  const leisteDa = Boolean(props.kostenLeiste)

  useEffect(() => {
    if (!shell?.mobile) return
    const root = document.documentElement
    const before = root.style.getPropertyValue('--ux-u1a-nav-offset')
    const beforeNav = root.style.getPropertyValue('--workspace-bottom-nav-hoehe')
    const previousPadding = root.style.scrollPaddingBottom
    const measure = () => {
      const font = parseFloat(getComputedStyle(root).fontSize)
      const keyboard = window.visualViewport && window.visualViewport.height < window.innerHeight * .75
      const grosseSchrift = font >= 24
      const nextFlow = grosseSchrift || window.innerWidth < 360 || window.innerHeight < 500 || Boolean(keyboard)
      setFlow(nextFlow)
      setRaster(nextFlow && !grosseSchrift ? (window.innerWidth >= 544 ? 'fuenf' : 'zwei') : null)
      const fest = !nextFlow && window.innerWidth < 1024
      const nav = fest ? bottomRef.current?.getBoundingClientRect().height ?? 0 : 0
      const height = nav + (fest ? leisteRef.current?.getBoundingClientRect().height ?? 0 : 0)
      root.style.setProperty('--workspace-bottom-nav-hoehe', `${Math.ceil(nav)}px`)
      root.style.setProperty('--ux-u1a-nav-offset', `${Math.ceil(height + 12)}px`)
      root.style.scrollPaddingBottom = `${Math.ceil(height + 16)}px`
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    if (bottomRef.current) observer.observe(bottomRef.current)
    if (leisteRef.current) observer.observe(leisteRef.current)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      root.style.setProperty('--ux-u1a-nav-offset', before)
      root.style.setProperty('--workspace-bottom-nav-hoehe', beforeNav)
      root.style.scrollPaddingBottom = previousPadding
    }
  }, [shell?.mobile, leisteDa])

  if (!shell) return <TripWorkspaceModeNavigation {...props} />
  const buttons = (rail: boolean) => WORKSPACE_ANSICHTEN.map((view) => {
    const Icon = ICONS[view]
    const label = WORKSPACE_ANSICHT_LABEL[view]
    const button = <button type="button" className="workspace-nav-link" aria-label={label}
      aria-current={props.ansicht === view ? 'page' : undefined}
      onClick={(e) => {
        props.onWechsel(view, e.detail === 0)
        if (props.ansicht === view && !props.detailOffen) shell.closeNavigation()
        else shell.finishNavigation()
      }}>
      <Icon aria-hidden="true" /><span className={rail ? 'workspace-nav-label' : undefined}>{!rail && (!flow || raster === 'fuenf') && view === 'einreise' ? 'Einreise' : label}</span>
    </button>
    return <div key={view}>{button}</div>
  })
  return <>
    {shell.navigation && createPortal(<nav aria-label="Reiseplanung" data-workspace-mode-nav="sidebar">{buttons(true)}</nav>, shell.navigation)}
    {shell.mobile && createPortal(<>
      {props.kostenLeiste ? (
        <button ref={leisteRef} type="button" className="workspace-cost-bar" data-flow={flow} onClick={props.kostenLeiste.onOeffnen}>
          <Wallet aria-hidden="true" />
          <span><span className="sr-only">Kosten ansehen: </span>{props.kostenLeiste.text}</span>
          <ChevronRight aria-hidden="true" />
        </button>
      ) : null}
      <nav ref={bottomRef} aria-label="Reisebereiche" className="workspace-bottom-nav"
        data-flow={flow} data-flow-raster={raster ?? undefined} data-shell-nav={flow ? 'flow' : 'bottom'} data-workspace-mode-nav="mobile">{buttons(false)}</nav>
    </>, shell.mobile)}
  </>
}

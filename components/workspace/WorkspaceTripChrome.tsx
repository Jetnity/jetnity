'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LayoutDashboard, Route, BriefcaseBusiness, ClipboardCheck } from 'lucide-react'
import TripWorkspaceModeNavigation from '@/components/trips/TripWorkspaceModeNavigation'
import { WORKSPACE_ANSICHTEN, WORKSPACE_ANSICHT_LABEL, type WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
import { useWorkspaceShell } from './WorkspaceContext'
import WorkspaceNavItem from './WorkspaceNavItem'

const ICONS = { uebersicht: LayoutDashboard, plan: Route, organisieren: BriefcaseBusiness, vorbereitung: ClipboardCheck }

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
}) {
  const shell = useWorkspaceShell()
  const bottomRef = useRef<HTMLElement>(null)
  const [flow, setFlow] = useState(false)

  useEffect(() => {
    if (!shell?.mobile) return
    const root = document.documentElement
    const before = root.style.getPropertyValue('--ux-u1a-nav-offset')
    const previousPadding = root.style.scrollPaddingBottom
    const measure = () => {
      const font = parseFloat(getComputedStyle(root).fontSize)
      const keyboard = window.visualViewport && window.visualViewport.height < window.innerHeight * .75
      const nextFlow = font >= 24 || window.innerHeight < 500 || Boolean(keyboard)
      setFlow(nextFlow)
      const height = !nextFlow && window.innerWidth < 1024 ? bottomRef.current?.getBoundingClientRect().height ?? 0 : 0
      root.style.setProperty('--ux-u1a-nav-offset', `${Math.ceil(height + 12)}px`)
      root.style.scrollPaddingBottom = `${Math.ceil(height + 16)}px`
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    if (bottomRef.current) observer.observe(bottomRef.current)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      root.style.setProperty('--ux-u1a-nav-offset', before)
      root.style.scrollPaddingBottom = previousPadding
    }
  }, [shell?.mobile])

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
      <Icon aria-hidden="true" /><span className={rail ? 'workspace-nav-label' : undefined}>{label}</span>
    </button>
    return rail ? <WorkspaceNavItem key={view} label={label} collapsed={shell.collapsed}>{button}</WorkspaceNavItem>
      : <div key={view}>{button}</div>
  })
  return <>
    {shell.navigation && createPortal(<nav aria-label="Reiseplanung" data-workspace-mode-nav="sidebar">{buttons(true)}</nav>, shell.navigation)}
    {shell.mobile && createPortal(<nav ref={bottomRef} aria-label="Reisebereiche" className="workspace-bottom-nav"
      data-flow={flow} data-shell-nav={flow ? 'flow' : 'bottom'} data-workspace-mode-nav="mobile">{buttons(false)}</nav>, shell.mobile)}
  </>
}

'use client'

import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** A visible label for the icon rail, available on hover AND keyboard focus. */
export default function WorkspaceNavItem({ children, label, collapsed }: {
  children: ReactElement
  label: string
  collapsed: boolean
}) {
  const id = useId()
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelHide = () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  const hideLater = () => {
    cancelHide()
    hideTimer.current = setTimeout(() => setPosition(null), 150)
  }
  useEffect(() => {
    const hide = () => setPosition(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [])
  const show = (element: HTMLElement) => {
    cancelHide()
    if (!collapsed) return
    const rect = element.getBoundingClientRect()
    setPosition({ left: rect.right + 8, top: rect.top + rect.height / 2 })
  }
  let tooltip: ReactNode = null
  if (collapsed && position) {
    tooltip = createPortal(
      <span id={id} role="tooltip" className="workspace-tooltip" style={position}
        onMouseEnter={cancelHide} onMouseLeave={hideLater}>
        {label}
      </span>, document.body,
    )
  }
  return (
    <div className="workspace-nav-item" onMouseEnter={(e) => show(e.currentTarget)}
      onMouseLeave={hideLater} onFocus={(e) => show(e.currentTarget)}
      onBlur={() => setPosition(null)} onKeyDown={(e) => { if (e.key === 'Escape') setPosition(null) }}>
      {children}
      {tooltip}
    </div>
  )
}

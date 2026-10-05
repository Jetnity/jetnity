// components/layout/BackToTop.tsx
'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { scrollVerhalten } from '@/lib/formular/sicht'

/** Felder, bei denen auf Telefonen die Bildschirmtastatur aufgeht. */
function isTypingTarget(node: EventTarget | null) {
  if (!(node instanceof HTMLElement)) return false
  if (node.isContentEditable) return true
  const tag = node.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag !== 'INPUT') return false
  const type = (node as HTMLInputElement).type
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'hidden', 'range', 'file'].includes(type)
}

export default function BackToTop() {
  const [show, setShow] = useState(false)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Der Knopf schwebt unten rechts. Waehrend eine Eingabe bearbeitet wird,
  // liegt er auf Telefonen dicht ueber der Tastatur und damit oft genau auf dem
  // Feld oder dem Absendeknopf. In dieser Zeit tritt er zurueck.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => setTyping(isTypingTarget(event.target))
    const onFocusOut = () => setTyping(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const sichtbar = show && !typing

  return (
    <button
      type="button"
      inert={!sichtbar}
      tabIndex={sichtbar ? 0 : -1}
      aria-hidden={!sichtbar}
      onClick={(ereignis) => {
        ereignis.currentTarget.blur()
        if (window.location.hash) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
        }
        window.scrollTo({ top: 0, behavior: scrollVerhalten() })
      }}
      aria-label="Nach oben"
      className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))]
                 z-40 flex h-11 w-11 items-center justify-center rounded-full border bg-background/80
                 backdrop-blur hover:bg-background shadow-lg focus-visible:outline-none
                 focus-visible:ring-4 focus-visible:ring-brand-600/15 ${sichtbar ? '' : 'invisible pointer-events-none'}`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

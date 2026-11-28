// components/layout/BackToTop.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { scrollVerhalten } from '@/lib/formular/sicht'
import {
  NACH_OBEN_RUHE_MS,
  nachObenSchwelle,
  nachObenSichtbar,
  scrollVerfolgen,
  type ScrollRichtung,
  ueberSchwelle,
} from '@/lib/layout/nach-oben'
import { backToTopEntscheidung, backToTopInlineAbstand } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'

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

/** Ein offener Dialog oder ein modales Overlay deckt die Seite ab; der Knopf tritt dann zurück. */
function modalOffen(): boolean {
  return document.querySelector('dialog[open], [aria-modal="true"]') !== null
}

function festeNavHoehe(): { fixed: boolean; offsetPx: number | null } {
  const nav = document.querySelector('[data-shell-nav="bottom"]')
  const fixed = nav instanceof HTMLElement && getComputedStyle(nav).position === 'fixed'
  if (!fixed) return { fixed: false, offsetPx: null }
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--ux-u1a-nav-offset').trim()
  const match = /^(\d+(?:\.\d+)?)px$/.exec(raw)
  const offsetPx = match ? Number(match[1]) : null
  return { fixed: true, offsetPx: offsetPx != null && offsetPx > 0 ? offsetPx : null }
}

export default function BackToTop() {
  const knopf = useRef<HTMLButtonElement>(null)
  const [ueber, setUeber] = useState(false)
  const [richtung, setRichtung] = useState<ScrollRichtung>('runter')
  const [ruhig, setRuhig] = useState(true)
  const [telefon, setTelefon] = useState(false)
  const [schmal, setSchmal] = useState(false)
  const [typing, setTyping] = useState(false)
  const [dialogOffen, setDialogOffen] = useState(false)
  const [lage, setLage] = useState<'standard' | 'frei' | 'verborgen'>('standard')
  const [offsetPx, setOffsetPx] = useState<number | null>(null)
  const [imWorkspace, setImWorkspace] = useState(false)

  // Wo rechts kein freier Rand ist, erscheint der Knopf nur beim Hochscrollen und geht in Ruhe
  // wieder weg (siehe lib/layout/nach-oben.ts). Sonst laege er dauerhaft ueber Preisen und Text.
  useEffect(() => {
    let verfolgung = { richtung: 'runter' as ScrollRichtung, anker: window.scrollY }
    let ruheTimer: number | undefined
    const onScroll = () => {
      const y = window.scrollY
      verfolgung = scrollVerfolgen(verfolgung, y)
      setUeber(ueberSchwelle(y, nachObenSchwelle(window.innerHeight)))
      setRichtung(verfolgung.richtung)
      setRuhig(false)
      window.clearTimeout(ruheTimer)
      ruheTimer = window.setTimeout(() => setRuhig(true), NACH_OBEN_RUHE_MS)
    }
    const anfangLesen = () => setUeber(ueberSchwelle(window.scrollY, nachObenSchwelle(window.innerHeight)))
    anfangLesen()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(ruheTimer)
    }
  }, [])

  useEffect(() => {
    const abfragen = [
      [window.matchMedia('(max-width: 639px)'), setTelefon],
      [window.matchMedia('(max-width: 1023px)'), setSchmal],
    ] as const
    const lesen = () => abfragen.forEach(([abfrage, setzen]) => setzen(abfrage.matches))
    lesen()
    abfragen.forEach(([abfrage]) => abfrage.addEventListener('change', lesen))
    return () => abfragen.forEach(([abfrage]) => abfrage.removeEventListener('change', lesen))
  }, [])

  useEffect(() => {
    let rahmen = 0
    const lesen = () => {
      rahmen = 0
      setDialogOffen(modalOffen())
    }
    const planen = () => {
      if (!rahmen) rahmen = window.requestAnimationFrame(lesen)
    }
    lesen()
    const beobachter = new MutationObserver(planen)
    beobachter.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'aria-modal'] })
    return () => {
      beobachter.disconnect()
      if (rahmen) window.cancelAnimationFrame(rahmen)
    }
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

  useEffect(() => {
    const lesen = () => {
      const gemessen = festeNavHoehe()
      const entscheidung = backToTopEntscheidung(gemessen.fixed, gemessen.offsetPx)
      setImWorkspace(Boolean(knopf.current?.closest('.workspace-page')))
      setLage(entscheidung)
      setOffsetPx(entscheidung === 'frei' ? gemessen.offsetPx : null)
    }
    lesen()
    const beobachter = new ResizeObserver(lesen)
    beobachter.observe(document.documentElement)
    const nav = document.querySelector('[data-shell-nav="bottom"]')
    if (nav) beobachter.observe(nav)
    const mutationen = new MutationObserver(lesen)
    mutationen.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    window.addEventListener('resize', lesen)
    return () => {
      beobachter.disconnect()
      mutationen.disconnect()
      window.removeEventListener('resize', lesen)
    }
  }, [])

  const engerRand = telefon || (imWorkspace && schmal)
  const sichtbar = nachObenSichtbar({ ueberSchwelle: ueber, engerRand, richtung, ruhig }) && !typing && !dialogOffen && lage !== 'verborgen'
  const abstand = backToTopInlineAbstand(imWorkspace, lage, offsetPx)

  return (
    <button
      ref={knopf}
      data-back-to-top
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
      style={{ ...(abstand ? { bottom: abstand } : null), transition: sichtbar ? 'opacity 200ms ease' : 'opacity 200ms ease, visibility 0s linear 200ms' }}
      className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))]
                 group z-40 flex h-11 w-11 items-center justify-center rounded-full
                 [@media(max-width:639px)]:right-[calc(0.25rem+env(safe-area-inset-right))]
                 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15
                 ${sichtbar ? 'opacity-100' : 'opacity-0 invisible pointer-events-none'}`}
    >
      <span className="nach-oben-flaeche flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 shadow-sm backdrop-blur group-hover:bg-background" aria-hidden="true">
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  )
}

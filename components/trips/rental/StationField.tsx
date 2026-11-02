'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import type { RentalStation } from '@/lib/providers/discovercars/search/contract'
import { FIELD, rentalRequest } from './client'

export default function StationField({ label, value, query, onQuery, onSelect }: {
  label: string; value: RentalStation | null; query: string
  onQuery: (value: string) => void; onSelect: (value: RentalStation) => void
}) {
  const id = useId()
  const [options, setOptions] = useState<RentalStation[]>([])
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (value || query.trim().length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setMessage('Orte werden gesucht …')
      try {
        const data = await rentalRequest({ action: 'locations', term: query }, controller.signal)
        if (controller.signal.aborted) return
        if (data.status === 'ok' && data.kind === 'locations') {
          setOptions(data.locations); setMessage(data.locations.length ? '' : 'Keine Mietstation gefunden. Versuche eine nahe Stadt oder einen Flughafen.')
        } else if (data.status !== 'ok') setMessage(data.message)
      } catch { if (!controller.signal.aborted) setMessage('Orte konnten nicht geladen werden. Bitte gib den Ort erneut ein.') }
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, value])
  const select = (station: RentalStation) => { onSelect(station); setOptions([]); setOpen(false); setMessage(''); setActive(-1); input.current?.focus() }
  return <div className="relative min-w-0" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-brand-800">{label}</label>
    <div className="relative">
      <input ref={input} id={id} value={query} placeholder="Stadt oder Flughafen" maxLength={100} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open && options.length > 0} aria-controls={`${id}-list`} aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined} aria-describedby={`${id}-message`} className={`${FIELD} pr-10`}
        onFocus={() => setOpen(true)} onChange={e => { setOptions([]); setMessage(''); setActive(-1); setOpen(true); onQuery(e.target.value) }}
        onKeyDown={e => {
          if (e.key === 'Escape') { setOpen(false); setActive(-1) }
          if (['ArrowDown', 'ArrowUp'].includes(e.key) && options.length) { e.preventDefault(); setOpen(true); setActive(i => e.key === 'ArrowDown' ? (i + 1) % options.length : (i - 1 + options.length) % options.length) }
          if (e.key === 'Enter' && !value) { e.preventDefault(); if (open && active >= 0 && options[active]) select(options[active]) }
        }} />
      {value ? <Check aria-hidden="true" className="absolute right-3 top-3 h-5 w-5 text-brand-600" /> : <MapPin aria-hidden="true" className="absolute right-3 top-3 h-5 w-5 text-brand-600" />}
    </div>
    {open && options.length > 0 && !value ? <ul id={`${id}-list`} role="listbox" aria-label={label} className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-line-200 bg-white p-1 shadow-xl">
      {options.map((o, i) => <li key={o.id} id={`${id}-${i}`} role="option" aria-selected={active === i} onMouseDown={e => e.preventDefault()} onClick={() => select(o)} className={`cursor-pointer rounded-xl p-3 text-sm text-brand-800 hover:bg-surface-50 ${active === i ? 'bg-surface-50' : ''}`}>
        <span className="block font-semibold">{o.name}</span><span className="block text-xs text-ink-600">{[o.region, o.country].filter(Boolean).join(' · ')}</span>
      </li>)}
    </ul> : null}
    <p id={`${id}-message`} role="status" className="mt-1 text-xs leading-5 text-ink-600">{message || (value ? `${value.country} · Station ausgewählt` : 'Bitte einen Vorschlag auswählen.')}</p>
  </div>
}

'use client'

import * as React from 'react'
import { Search, MapPin, Plane, Building2, Ship } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Suggestion {
  value: string
  label: string
  sublabel?: string
  icon?: string
}

export interface AutocompleteInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  suggestionsType: 'airport' | 'city' | 'region' | 'hotel' | 'cruiseport'
  icon?: string
  disabled?: boolean
  className?: string
}

export function AutocompleteInput({
  value,
  onChange,
  placeholder = 'Ziel suchen…',
  suggestionsType,
  icon,
  disabled,
  className,
}: AutocompleteInputProps) {
  const [input, setInput] = React.useState(value)
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { setInput(value) }, [value])

  React.useEffect(() => {
    if (input.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    // Hier wird in Produktion die KI/API-Search (z. B. OpenAI, VektorSearch, Geo-API) eingebunden.
    // Für Jetnity in Zukunft: airports, cities, hotels, cruise ports, etc.
    // Beispiel: await fetch(`/api/autocomplete?type=${suggestionsType}&q=${input}`)
    setTimeout(() => {
      // Placeholder für echte KI/API-Suggestions (Demo-Daten als Platzhalter)
      setSuggestions([
        {
          value: input,
          label: input,
          sublabel: suggestionsType === 'airport' ? 'Vorgeschlagenes Ziel (KI)' : 'Suchvorschlag',
          icon: suggestionsType,
        },
        // ...hier weitere echte Daten aus der Jetnity-Suche!
      ])
      setLoading(false)
      setOpen(true)
    }, 300)
  }, [input, suggestionsType])

  const handleSelect = (s: Suggestion) => {
    onChange(s.value)
    setInput(s.label)
    setOpen(false)
    if (inputRef.current) inputRef.current.blur()
  }

  function getIcon(type: string) {
    switch (type) {
      case 'airport':
        return <Plane className="w-4 h-4 text-blue-600" />
      case 'city':
        return <MapPin className="w-4 h-4 text-blue-600" />
      case 'region':
        return <MapPin className="w-4 h-4 text-emerald-600" />
      case 'hotel':
        return <Building2 className="w-4 h-4 text-amber-600" />
      case 'cruiseport':
        return <Ship className="w-4 h-4 text-indigo-600" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex items-center gap-2 bg-white/80 border rounded-xl px-3 py-2 shadow">
        {getIcon(icon || suggestionsType)}
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent outline-none text-base"
          placeholder={placeholder}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            onChange(e.target.value)
          }}
          disabled={disabled}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white z-50 border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground">Lade Vorschläge…</div>
          )}
          {!loading && suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2"
              onClick={() => handleSelect(s)}
            >
              {getIcon(s.icon || suggestionsType)}
              <span className="font-medium">{s.label}</span>
              {s.sublabel && (
                <span className="ml-2 text-xs text-muted-foreground">{s.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

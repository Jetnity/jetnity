'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Plus, Minus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Select from '@/components/ui/select'

export type Cabin = 'eco' | 'prem' | 'biz' | 'first'
export interface Travelers { adults: number; children: number; infants: number; cabin: Cabin }

export default function TravelerPopover({
  value,
  onChange,
}: { value: Travelers; onChange: (v: Travelers) => void }) {
  const [open, setOpen] = React.useState(false)
  const total = value.adults + value.children + value.infants
  const label = total > 0 ? `${total} Reisende · ${cabinLabel(value.cabin)}` : 'Reisende & Klasse'

  function adj(key: keyof Travelers, diff: number) {
    const next = { ...value }
    const min = key === 'adults' ? 1 : 0
    ;(next as any)[key] = Math.max(min, Math.min(9, (next as any)[key] + diff))
    onChange(next)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" className="w-full justify-between h-12">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 opacity-80" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-50 rounded-xl border bg-popover p-3 shadow-lg w-[320px]">
          <Row label="Erwachsene" help="12+ Jahre">
            <Counter value={value.adults} onMinus={() => adj('adults', -1)} onPlus={() => adj('adults', 1)} />
          </Row>
          <Row label="Kinder" help="2–11 Jahre">
            <Counter value={value.children} onMinus={() => adj('children', -1)} onPlus={() => adj('children', 1)} />
          </Row>
          <Row label="Babys" help="unter 2 Jahre">
            <Counter value={value.infants} onMinus={() => adj('infants', -1)} onPlus={() => adj('infants', 1)} />
          </Row>

          <div className="mt-3">
            <Select
              label="Reiseklasse"
              placeholder="Bitte auswählen"
              options={[
                { label: 'Economy', value: 'eco' },
                { label: 'Premium Economy', value: 'prem' },
                { label: 'Business', value: 'biz' },
                { label: 'First', value: 'first' },
              ]}
              value={value.cabin}
              onValueChange={(v) => onChange({ ...value, cabin: (v as Cabin) || 'eco' })}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Button onClick={() => setOpen(false)}>Fertig</Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Row({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {help && <div className="text-xs text-muted-foreground">{help}</div>}
      </div>
      {children}
    </div>
  )
}

function Counter({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onMinus}>
        <Minus className="h-4 w-4" />
      </Button>
      <div className="w-6 text-center tabular-nums">{value}</div>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onPlus}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

function cabinLabel(c: Cabin) {
  switch (c) {
    case 'eco': return 'Economy'
    case 'prem': return 'Premium'
    case 'biz': return 'Business'
    case 'first': return 'First'
    default: return 'Economy'
  }
}

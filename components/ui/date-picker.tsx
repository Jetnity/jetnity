'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { Calendar } from './calendar'

type BaseProps = {
  value?: Date | null
  onChange: (d: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateInput({
  value,
  onChange,
  placeholder = 'Datum wählen',
  disabled,
  className,
}: BaseProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm',
            'hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          aria-label="Datum wählen"
        >
          <span className={cn(!value && 'text-zinc-400')}>
            {value ? format(value, 'dd.MM.yyyy', { locale: de }) : placeholder}
          </span>
          <span className="flex items-center gap-2">
            {value && (
              <X
                className="h-4 w-4 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null) // normalize
                }}
                aria-label="Löschen"
              />
            )}
            <CalendarIcon className="h-4 w-4 opacity-60" aria-hidden="true" />
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className={cn(
            'z-[1000] w-[320px] md:w-[620px] rounded-2xl border bg-white p-3 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="text-sm font-medium">Datum wählen</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={() => onChange(new Date())}
              >
                Heute
              </button>
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={() => onChange(null)}
              >
                Zurücksetzen
              </button>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => {
              onChange(d ?? null)
              if (d) setOpen(false)
            }}
            months={2} // auf md+ zwei Monate
          />

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

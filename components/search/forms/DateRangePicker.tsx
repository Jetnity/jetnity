'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

export interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
  flexible?: boolean
  onToggleFlexible?: (val: boolean) => void
  minDate?: Date
  className?: string
  isLoading?: boolean
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  flexible,
  onToggleFlexible,
  minDate = new Date(),
  className,
  isLoading,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal bg-white/90',
              (!startDate && !endDate) && 'text-muted-foreground'
            )}
            type="button"
            disabled={isLoading}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : startDate && endDate ? (
              `${dayjs(startDate).format('DD.MM.YYYY')} – ${dayjs(endDate).format('DD.MM.YYYY')}`
            ) : startDate ? (
              dayjs(startDate).format('DD.MM.YYYY')
            ) : (
              'Reisedaten wählen'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={
              startDate && endDate
                ? { from: startDate, to: endDate }
                : undefined
            }
            onSelect={range => {
              onChange(range?.from ?? null, range?.to ?? null)
              if (range?.from && range?.to) setOpen(false)
            }}
            disabled={{ before: minDate }}
            initialFocus
          />
          {typeof flexible === 'boolean' && onToggleFlexible && (
            <div className="flex items-center mt-3 gap-2 px-4">
              <input
                id="flexible"
                type="checkbox"
                checked={flexible}
                onChange={e => onToggleFlexible(e.target.checked)}
                className="accent-blue-600"
              />
              <label htmlFor="flexible" className="text-xs text-muted-foreground">
                +/-3 Tage flexibel suchen
              </label>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

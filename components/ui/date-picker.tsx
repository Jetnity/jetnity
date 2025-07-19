'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import dayjs from 'dayjs'

export interface DatePickerProps {
  label: string
  placeholder?: string
  selectedDate: Date | null
  onSelect: (date: Date | null) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  placeholder = 'Datum wählen',
  selectedDate,
  onSelect,
  minDate,
  maxDate,
  className,
}) => {
  const [open, setOpen] = React.useState(false)

  // Für react-day-picker: Matcher[] oder undefined
  const disabledMatchers = React.useMemo(() => {
    const matchers: any[] = []
    if (minDate) matchers.push({ before: minDate })
    if (maxDate) matchers.push({ after: maxDate })
    return matchers.length > 0 ? matchers : undefined
  }, [minDate, maxDate])

  return (
    <div className={cn('w-full', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? dayjs(selectedDate).format('DD.MM.YYYY') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            required
            selected={selectedDate ?? undefined}
            onSelect={(date) => {
              onSelect(date ?? null)
              setOpen(false)
            }}
            disabled={disabledMatchers}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePicker

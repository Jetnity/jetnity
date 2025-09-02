'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { de } from 'date-fns/locale'

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** 1 oder 2 Monate anzeigen (Default: 1) */
  months?: 1 | 2
}

export function Calendar({
  className,
  classNames,
  months = 1,
  showOutsideDays = true,
  locale = de,
  numberOfMonths,
  captionLayout = 'dropdown', // ✅ kompatibel
  ...props
}: CalendarProps) {
  // responsive: auf md+ automatisch 2 Monate
  const [twoCols, setTwoCols] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setTwoCols(mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  return (
    <DayPicker
      {...props}
      locale={locale}
      showOutsideDays={showOutsideDays}
      numberOfMonths={numberOfMonths ?? (months === 2 && twoCols ? 2 : 1)}
      captionLayout={captionLayout}
      className={cn(
        'rounded-2xl border bg-white p-3 shadow-xl',
        '[&_[role=button]]:focus-visible:outline-none [&_[role=button]]:focus-visible:ring-2 [&_[role=button]]:focus-visible:ring-blue-500/50',
        className
      )}
      classNames={{
        months: 'flex flex-col gap-4 md:flex-row',
        month: 'space-y-2 px-2',
        caption: 'flex items-center justify-between gap-2',
        caption_label:
          'inline-flex items-center rounded-md border px-2 py-1 text-sm font-medium',
        dropdowns: 'flex items-center gap-2',
        nav: 'flex items-center gap-1',
        nav_button:
          'inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-gray-50',
        table: 'w-full border-collapse',
        head_cell:
          'h-8 w-8 text-center text-[0.75rem] font-medium text-gray-500',
        cell:
          'p-0 text-center align-middle relative h-9 w-9 [&:has([aria-selected])]:bg-blue-50/60 rounded-md',
        day: 'h-9 w-9 rounded-md text-sm leading-9 hover:bg-gray-100',
        day_selected:
          'bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600 focus:text-white',
        day_today: 'ring-1 ring-blue-500/40',
        day_outside:
          'text-gray-300 aria-selected:bg-blue-600/80 aria-selected:text-white',
        day_disabled: 'text-gray-300 opacity-50 line-through',
        day_range_middle: 'bg-blue-100 text-blue-900',
        day_hidden: 'invisible',
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (date) =>
          new Intl.DateTimeFormat('de-DE', { weekday: 'short' })
            .format(date)
            .replace('.', '')
            .slice(0, 2), // Mo, Di, …
      }}
    />
  )
}

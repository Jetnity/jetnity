'use client'

import { Switch } from '@/components/ui/switch'
import { CalendarClock } from 'lucide-react'

export interface FlexibleDateSwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label?: string
  className?: string
}

export function FlexibleDateSwitch({ checked, onChange, label = '+/- 3 Tage flexibel', className }: FlexibleDateSwitchProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <CalendarClock className="w-4 h-4 text-blue-600" />
      <Switch checked={checked} onCheckedChange={onChange} id="flexible-date-switch" />
      <label htmlFor="flexible-date-switch" className="text-xs">{label}</label>
    </div>
  )
}

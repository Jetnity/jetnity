'use client'

import { Switch } from '@/components/ui/switch'
import { Plane } from 'lucide-react'

export interface DirectFlightSwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label?: string
  className?: string
}

export function DirectFlightSwitch({ checked, onChange, label = 'Nur Direktflüge', className }: DirectFlightSwitchProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Plane className="w-4 h-4 text-blue-600" />
      <Switch checked={checked} onCheckedChange={onChange} id="direct-flight-switch" />
      <label htmlFor="direct-flight-switch" className="text-xs">{label}</label>
    </div>
  )
}

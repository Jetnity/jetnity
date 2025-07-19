'use client'

import * as React from 'react'
import { Switch as HeadlessSwitch } from '@headlessui/react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
  className?: string
  label?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  className,
  label,
}) => (
  <div className={cn('inline-flex items-center gap-2', className)}>
    <HeadlessSwitch
      checked={checked}
      onChange={onCheckedChange}
      id={id}
      disabled={disabled}
      aria-checked={checked}
      tabIndex={0}
      className={({ checked }) =>
        cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
          checked ? 'bg-blue-600' : 'bg-gray-300',
          disabled && 'opacity-60 cursor-not-allowed'
        )
      }
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </HeadlessSwitch>
    {label && (
      <label
        htmlFor={id}
        className={cn(
          'select-none text-sm',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {label}
      </label>
    )}
  </div>
)

Switch.displayName = 'Switch'
export default Switch

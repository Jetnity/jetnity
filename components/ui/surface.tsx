// components/ui/surface.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type SurfaceLevel = 1 | 2 | 3

type SurfaceProps = {
  className?: string
  level?: SurfaceLevel          // 1 = Card, 2 = Section, 3 = Hero/Highlight
  padded?: boolean
  as?: React.ElementType        // z.B. 'div', 'section', ...
} & React.HTMLAttributes<HTMLElement> // enthält optionales children

export default function Surface({
  className,
  level = 1,
  padded = true,
  as: Comp = 'div',
  ...rest
}: SurfaceProps) {
  const lvl =
    level === 3
      ? 'surface-3 shadow-e3 rounded-2xl'
      : level === 2
      ? 'surface-2 shadow-e2 rounded-2xl'
      : 'surface-1 shadow-e1 rounded-xl'

  return (
    <Comp className={cn(lvl, padded && 'p-4 md:p-6', className)} {...rest} />
  )
}

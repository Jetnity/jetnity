'use client'

import Link from 'next/link'
import { PanelsTopLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GoToMediaStudioButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/creator/media-studio"
      aria-label="Media-Studio öffnen"
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 h-10 font-medium',
        'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-zinc-900/30 focus:ring-offset-2 focus:ring-offset-white',
        className
      )}
    >
      <PanelsTopLeft className="h-4 w-4" />
      Media-Studio
    </Link>
  )
}

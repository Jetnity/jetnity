// components/creator/media-studio/PresenceBar.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type PresenceUser = {
  key: string
  userId: string
  at: number
}

type Props = {
  sessionId: string
  userId: string
  className?: string
  selfName?: string
}

export default function PresenceBar({ sessionId, userId, className, selfName }: Props) {
  const [list, setList] = React.useState<PresenceUser[]>([])

  React.useEffect(() => {
    if (!sessionId || !userId) return

    const channel = supabase.channel(`presence:creator-session:${sessionId}`, {
      config: { presence: { key: userId } },
    })

    const sync = () => {
      const state = channel.presenceState() as Record<string, Array<{ userId: string; at: number }>>
      const arr: PresenceUser[] = []
      for (const [key, entries] of Object.entries(state)) {
        for (const p of entries) arr.push({ key, userId: p.userId, at: p.at })
      }
      arr.sort((a, b) => b.at - a.at)
      arr.sort((a, b) => (a.userId === userId ? -1 : b.userId === userId ? 1 : 0))
      setList(arr)
    }

    channel.on('presence', { event: 'sync' }, sync)
    channel.on('presence', { event: 'join' }, sync)
    channel.on('presence', { event: 'leave' }, sync)

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ userId, at: Date.now() })
    })

    return () => { try { channel.unsubscribe() } catch {} }
  }, [sessionId, userId])

  const others = list.filter((p) => p.userId !== userId)
  const me = list.find((p) => p.userId === userId)

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <div className="flex -space-x-2">
        {me && <AvatarLite label={selfName ?? 'Du'} highlight />}
        {others.slice(0, 5).map((p) => (
          <AvatarLite key={p.userId + p.at} label={shortLabel(p.userId)} />
        ))}
      </div>
      <span className="ml-1">
        {list.length <= 1
          ? 'Nur du bist hier'
          : `${list.length} aktiv · ${others.length} weitere${others.length > 5 ? ` (+${others.length - 5})` : ''}`}
      </span>
    </div>
  )
}

function shortLabel(userId: string) {
  const s = userId.replace(/-/g, '')
  return s.slice(-4).toUpperCase()
}

function AvatarLite({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full border bg-muted text-[10px] font-medium',
        highlight ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border'
      )}
      title={label}
      aria-label={label}
    >
      {label === 'Du' ? 'DU' : label.slice(0, 2)}
    </div>
  )
}

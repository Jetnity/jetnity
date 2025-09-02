// components/creator/CreatorMiniProfile.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

export type CreatorLike = {
  user_id?: string
  id?: string
  display_name?: string | null
  name?: string | null
  username?: string | null
  avatar_url?: string | null
  role?: 'user' | 'creator' | 'admin' | string | null
  created_at?: string | null
  // weitere optionale Felder erlaubt
  [key: string]: unknown
}

export type CreatorMiniProfileProps = { creator: CreatorLike }

export default function CreatorMiniProfile({ creator }: CreatorMiniProfileProps) {
  const id = creator.user_id ?? creator.id ?? ''
  const display =
    creator.display_name ?? creator.username ?? creator.name ?? 'Creator'
  const avatar = creator.avatar_url ?? '/images/creators/default-avatar.png'

  const role: 'user' | 'creator' | 'admin' =
    creator.role === 'admin'
      ? 'admin'
      : creator.role === 'creator'
      ? 'creator'
      : 'user'

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
        <Image src={avatar} alt={display} fill sizes="36px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate max-w-[180px]" title={display}>
            {display}
          </span>
          <RoleBadge role={role} />
        </div>
        {id ? <span className="text-xs text-muted-foreground">ID: {id}</span> : null}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: 'user' | 'creator' | 'admin' }) {
  if (role === 'admin') {
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-600">
        admin
      </Badge>
    )
  }
  if (role === 'creator') return <Badge variant="secondary">creator</Badge>
  return <Badge variant="default">user</Badge>
}

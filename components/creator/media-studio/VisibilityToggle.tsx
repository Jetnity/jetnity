'use client'

import { useState, useTransition } from 'react'
import { updateSessionVisibility } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/button'

type Props = {
  sessionId: string
  currentVisibility: 'private' | 'public'
}

export default function VisibilityToggle({ sessionId, currentVisibility }: Props) {
  const [visibility, setVisibility] = useState<'private' | 'public'>(currentVisibility)
  const [isPending, startTransition] = useTransition()

  const toggleVisibility = () => {
    const newVisibility = visibility === 'private' ? 'public' : 'private'
    setVisibility(newVisibility)
    startTransition(() => {
      updateSessionVisibility(sessionId, newVisibility)
    })
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">Sichtbarkeit:</span>
      <Button
        variant={visibility === 'public' ? 'outline' : 'default'}
        onClick={toggleVisibility}
        disabled={isPending}
      >
        {visibility === 'public' ? 'Öffentlich' : 'Privat'}
      </Button>
    </div>
  )
}

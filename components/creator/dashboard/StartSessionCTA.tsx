'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createDraftSession } from '@/lib/supabase/actions/session'

type Props = {
  to?: 'media-studio' | 'creator-dashboard'
}

export default function StartSessionCTA({ to = 'media-studio' }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    startTransition(async () => {
      try {
        const { sessionId } = await createDraftSession()
        const target =
          to === 'media-studio'
            ? `/creator/media-studio?session=${sessionId}`
            : `/creator/creator-dashboard?session=${sessionId}`
        router.push(target)
      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || 'Konnte Session nicht starten')
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 disabled:bg-neutral-300 transition w-full"
    >
      {pending ? 'Wird erstellt…' : 'Jetzt Session starten'}
    </button>
  )
}

// components/layout/CookieConsent.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const KEY = 'jetnity:cookie-consent:v1'

export default function CookieConsent() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(KEY)
      if (!seen) setOpen(true)
    } catch {
      // ignore
    }
  }, [])

  if (!open) return null

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {/* ignore */}
    setOpen(false)
  }

  return (
    <div className="fixed inset-x-2 sm:inset-x-auto sm:right-6 bottom-4 z-40
                    max-w-md rounded-xl border bg-background/95 backdrop-blur p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="text-sm leading-6">
          Wir verwenden Cookies/LocalStorage, um die Nutzung zu messen (z. B. Views/Likes).
          Mit „Okay“ stimmst du dem zu.
        </div>
        <button
          aria-label="Hinweis schließen"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Okay
        </button>
        <a
          href="/privacy"
          className="text-sm underline underline-offset-2 hover:opacity-80"
        >
          Mehr erfahren
        </a>
      </div>
    </div>
  )
}

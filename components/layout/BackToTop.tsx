// components/layout/BackToTop.tsx
'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Nach oben"
      className="fixed bottom-6 right-6 z-40 rounded-full border bg-background/80 backdrop-blur
                 hover:bg-background p-3 shadow-lg"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}

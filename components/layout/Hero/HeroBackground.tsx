'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HeroBackground() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const res = await fetch('/api/copilot/hero-image')
        const { url } = await res.json()
        if (url) setImageUrl(url)
      } catch (err) {
        console.error('❌ Fehler beim Laden des Hero-Bildes:', err)
      }
    }

    loadImage()
  }, [])

  if (!imageUrl) return null

  return (
    <div className="absolute inset-0 -z-10">
      <Image
        src={imageUrl}
        alt="Hero Background"
        fill
        className="object-cover w-full h-full"
        priority
      />
      <div className="absolute inset-0 bg-black/40 z-0" />
    </div>
  )
}

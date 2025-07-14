'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  sessionId: string
}

export default function StoryLinkCopyButton({ sessionId }: Props) {
  const [copied, setCopied] = useState(false)

  const generateUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/story/${sessionId}`
    }
    return ''
  }

  const handleCopy = async () => {
    const fullUrl = generateUrl()
    if (!fullUrl) return
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Fehler beim Kopieren des Links:', err)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleCopy} aria-label="Story-Link kopieren">
        {copied ? '✅ Link kopiert!' : '📎 Story-Link kopieren'}
      </Button>
      <p className="text-sm text-gray-500 break-all">{generateUrl()}</p>
    </div>
  )
}

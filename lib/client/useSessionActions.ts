'use client'
import { useRouter } from 'next/navigation'

export function useSessionActions() {
  const router = useRouter()

  async function rename(id: string, title: string) {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'rename_failed')
    return (await res.json()).session
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/sessions/${id}/duplicate`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).error || 'duplicate_failed')
    return (await res.json()).session
  }

  async function remove(id: string) {
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'delete_failed')
    return true
  }

  function open(id: string) {
    router.push(`/creator/media-studio/${id}`)
  }

  return { rename, duplicate, remove, open }
}

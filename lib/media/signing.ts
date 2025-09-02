// lib/media/signing.ts
export async function renewSignedUrl(params: { bucket: string; path: string; expires?: number }): Promise<string | null> {
  try {
    const res = await fetch('/api/media/sign-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.url as string) ?? null
  } catch {
    return null
  }
}

// lib/video/providers.ts
export type StartArgs = {
  jobId: string
  storyboard: any
  webhookUrl?: string
  metadata?: Record<string, any>
}
export type StartResult = { providerJobId: string }

export async function startRenderJob(args: StartArgs): Promise<StartResult> {
  const provider = process.env.RENDER_PROVIDER || 'mock'

  if (provider === 'mock') {
    const providerJobId = `mock_${Math.random().toString(36).slice(2)}`

    if (args.webhookUrl) {
      // ✅ Closure-sicher: URL vorher binden → nicht mehr string | undefined
      const url = new URL(args.webhookUrl)

      ;(async () => {
        // progress 30%
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: args.jobId, status: 'processing', progress: 30 }),
        }).catch(() => {})

        await new Promise((r) => setTimeout(r, 1500))

        const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: args.jobId,
            status: 'completed',
            progress: 100,
            videoUrl: `${base}/mock/videos/${providerJobId}.mp4`,
          }),
        }).catch(() => {})
      })()
    }

    return { providerJobId }
  }

  // TODO: echter Provider-Call
  // throw new Error(`Unknown provider: ${provider}`)
  return { providerJobId: 'not_implemented' }
}

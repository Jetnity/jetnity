// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const host = raw.replace(/\/+$/, '')
  const hostname = (() => { try { return new URL(host).hostname } catch { return 'localhost' } })()

  // Vercel: 'development' | 'preview' | 'production'
  const vercelEnv = process.env.VERCEL_ENV
  const isProdEnv = (vercelEnv ?? process.env.NODE_ENV) === 'production'

  // Extra-Schutz: niemals vercel.app / localhost indexieren
  const isEphemeralHost = /localhost|\.vercel\.app$/i.test(hostname)

  // Optionaler Kill-Switch über Env
  const allowFlag = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false'

  const allowIndex = isProdEnv && !isEphemeralHost && allowFlag

  return {
    rules: allowIndex
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: [
              '/api/',
              '/admin/',
              '/media-studio/',
              '/creator/',
              '/dashboard/',
              '/private/',
              '/draft/',
              // '/_next/'  // nicht nötig
              '/*?*preview=*',
            ],
          },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${host}/sitemap.xml`,
    host,
  }
}

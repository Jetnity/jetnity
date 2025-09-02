/* config/api.config.ts
 * Zentrale, public-safe API-Konfiguration für Client & Server (Edge-tauglich).
 * Keine Secrets – nur NEXT_PUBLIC_* Variablen.
 */

type Environment = 'development' | 'preview' | 'production'

const toInt = (v: string | undefined, def: number) => {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : def
}
const toFloat = (v: string | undefined, def: number) => {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : def
}

function detectEnv(): Environment {
  const vercel = (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV) as Environment | undefined
  if (vercel) return vercel
  const node = process.env.NODE_ENV as Environment | undefined
  return node === 'production' ? 'production' : node === 'development' ? 'development' : 'preview'
}

const ENV = detectEnv()

/** Basis-URLs (öffentlich). */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (ENV === 'development' ? 'http://localhost:3000/api' : '/api')

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL?.trim() || undefined

/** Standardpfade – zentral halten für konsistente Nutzung. */
const ENDPOINTS = {
  search: '/search',
  analytics: '/creator/analytics',
  media: '/media',
  creator: {
    uploads: '/creator/uploads',
    sessions: '/creator/sessions',
    metrics: '/creator/metrics',
  },
  blog: {
    posts: '/blog/posts',
    comments: '/blog/comments',
  },
} as const

export const API = Object.freeze({
  env: ENV,
  baseUrl: BASE_URL,
  cdnUrl: CDN_URL,
  timeoutMs: toInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 15000),
  headers: { 'Content-Type': 'application/json' } as const,
  retry: {
    attempts: toInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS, 2),
    backoffMs: toInt(process.env.NEXT_PUBLIC_API_RETRY_BACKOFF_MS, 350),
    jitter: toFloat(process.env.NEXT_PUBLIC_API_RETRY_JITTER, 0.25), // 0–1
  },
  pagination: {
    pageSize: toInt(process.env.NEXT_PUBLIC_API_PAGE_SIZE, 24),
    maxPageSize: toInt(process.env.NEXT_PUBLIC_API_MAX_PAGE_SIZE, 100),
  },
  endpoints: ENDPOINTS,
})

export type ApiConfig = typeof API

/** Baut eine absolute API-URL inkl. Querystring, ohne doppelte Slashes. */
export function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  const base = API.baseUrl.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${p}`
  if (!query) return url
  const q = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return q ? `${url}?${q}` : url
}

/** Exponentielles Backoff (ms) mit optionalem Jitter – nützlich für Fetch-Wrapper. */
export function backoff(attempt: number): number {
  const base = API.retry.backoffMs * Math.pow(2, Math.max(0, attempt - 1))
  const jitter = 1 + (Math.random() * 2 - 1) * API.retry.jitter
  return Math.max(API.retry.backoffMs, Math.round(base * jitter))
}

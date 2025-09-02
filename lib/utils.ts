// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function invariant(cond: any, msg = 'Invariant failed'): asserts cond {
  if (!cond) throw new Error(msg)
}

export function safeJsonParse<T = any>(input: string | null | undefined, fallback: T | null = null): T | null {
  try {
    if (input == null || input === '') return fallback
    return JSON.parse(input) as T
  } catch {
    return fallback
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes)) return '–'
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = Math.max(decimals, 0)
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 250,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let t: any = null
  let lastArgs: any[] | null = null
  const leading = options.leading ?? false
  const trailing = options.trailing ?? true

  const invoke = (args: any[]) => fn(...args)

  const debounced = (...args: any[]) => {
    lastArgs = args
    const shouldCallLeading = leading && !t
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      t = null
      if (trailing && lastArgs) invoke(lastArgs), (lastArgs = null)
    }, wait)
    if (shouldCallLeading) return invoke(args)
  }

  ;(debounced as any).cancel = () => { if (t) clearTimeout(t); t = null; lastArgs = null }
  return debounced as T & { cancel: () => void }
}

export function throttle<T extends (...args: any[]) => any>(fn: T, wait = 250) {
  let last = 0
  let timeout: any = null
  let pendingArgs: any[] | null = null

  const throttled = (...args: any[]) => {
    const now = Date.now()
    const remaining = wait - (now - last)

    if (remaining <= 0) {
      if (timeout) { clearTimeout(timeout); timeout = null }
      last = now
      return fn(...args)
    }

    pendingArgs = args
    if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now()
        timeout = null
        if (pendingArgs) fn(...pendingArgs)
        pendingArgs = null
      }, remaining)
    }
  }

  ;(throttled as any).cancel = () => { if (timeout) clearTimeout(timeout); timeout = null; pendingArgs = null }
  return throttled as T & { cancel: () => void }
}

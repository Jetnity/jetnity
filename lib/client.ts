// lib/client.ts
export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number }

const BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) || ''

async function request<T = any>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<ApiResult<T>> {
  const isAbs = /^https?:\/\//i.test(url)
  const target = isAbs ? url : `${BASE}${url}`

  const controller = new AbortController()
  const to = init.timeoutMs
    ? setTimeout(() => controller.abort(), init.timeoutMs)
    : null

  try {
    const res = await fetch(target, {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
    })
    if (to) clearTimeout(to as any)

    const ctype = res.headers.get('content-type') || ''
    const body = ctype.includes('application/json') ? await res.json() : await res.text()

    if (!res.ok) {
      const msg =
        (body && (body.error || body.message)) ||
        `HTTP ${res.status}`
      return { ok: false, error: String(msg), status: res.status }
    }

    return { ok: true, data: body as T, status: res.status }
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'timeout' : e?.message || 'network_error'
    return { ok: false, error: msg, status: 0 }
  }
}

export const api = {
  get: <T>(url: string, init?: RequestInit & { timeoutMs?: number }) =>
    request<T>(url, { ...init, method: 'GET' }),
  post: <T>(url: string, data?: any, init?: RequestInit & { timeoutMs?: number }) =>
    request<T>(url, { ...init, method: 'POST', body: data != null ? JSON.stringify(data) : undefined }),
  put: <T>(url: string, data?: any, init?: RequestInit & { timeoutMs?: number }) =>
    request<T>(url, { ...init, method: 'PUT', body: data != null ? JSON.stringify(data) : undefined }),
  del: <T>(url: string, init?: RequestInit & { timeoutMs?: number }) =>
    request<T>(url, { ...init, method: 'DELETE' }),
}

export default api

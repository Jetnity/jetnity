// lib/auth/requireAdminOrCopilot.ts
import { headers } from 'next/headers'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function requireAdminOrCopilot() {
  try {
    await requireAdmin()
    return { actor: 'admin' as const }
  } catch {
    const h = headers()
    const tk = h.get('x-copilot-internal-token') || ''
    if (tk && process.env.COPILOT_INTERNAL_TOKEN && tk === process.env.COPILOT_INTERNAL_TOKEN) {
      return { actor: 'copilot' as const }
    }
    throw new Error('Unauthorized')
  }
}

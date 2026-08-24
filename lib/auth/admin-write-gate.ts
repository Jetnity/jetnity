import { NextResponse } from 'next/server'
import type { AdminGrant } from '@/lib/auth/admin-access'

export type AdminWritePruefung =
  | { erlaubt: true }
  | { erlaubt: false; grund: 'break_glass' }

/**
 * Reine Schreibfreigabe nach bestehendem Vertrag (ADR-0036):
 * nur eine Datenbankrolle darf persistente Admin-Writes ausführen.
 * Keine neue Capability, keine RLS-Änderung.
 */
export function adminWriteErlaubt(input: { grant: AdminGrant }): AdminWritePruefung {
  if (input.grant !== 'role') {
    return { erlaubt: false, grund: 'break_glass' }
  }
  return { erlaubt: true }
}

export function jsonAdminWriteVerweigert(): NextResponse {
  const response = NextResponse.json(
    {
      ok: false,
      error: 'Break-Glass darf nicht in die Datenbank schreiben.',
      code: 'admin_break_glass_write_denied',
      message: 'Break-Glass darf nicht in die Datenbank schreiben.',
    },
    { status: 403 },
  )
  response.headers.set('Cache-Control', 'no-store')
  return response
}

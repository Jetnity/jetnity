// lib/ui-audit/freigabe.ts
//
// Ob die interne Activities-Audit-Seite antworten darf.
//
// Fail closed:
//   · VERCEL_ENV=production ist immer aus, auch mit JETNITY_UI_AUDIT.
//   · Ausserhalb von Production braucht es ausdrücklich `true` oder `1`.
//   · Eine unbekannte Umgebung ist kein Production – aber ohne Flag bleibt 404.
//
// Frei von Next. Nur die Audit-Route darf diese Entscheidung nutzen.

export type UiAuditUmgebung = {
  VERCEL_ENV?: string
  JETNITY_UI_AUDIT?: string
}

function eingeschaltet(wert: string | undefined): boolean {
  const normalisiert = wert?.trim().toLowerCase()
  return normalisiert === 'true' || normalisiert === '1'
}

function istProduction(umgebung: UiAuditUmgebung): boolean {
  return umgebung.VERCEL_ENV?.trim() === 'production'
}

export function uiAuditSeiteAktiv(umgebung: UiAuditUmgebung): boolean {
  if (istProduction(umgebung)) return false
  return eingeschaltet(umgebung.JETNITY_UI_AUDIT)
}

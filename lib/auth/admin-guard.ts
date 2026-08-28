// lib/auth/admin-guard.ts
//
// Zentraler, fail-closed Admin-Schutz für Seiten, Server-Actions und API-Routen.
//
// Aufteilung nach Oberfläche, weil die richtige Antwort auf eine fehlende
// Berechtigung davon abhängt: Eine Seite leitet weiter, eine API-Route
// antwortet mit einem Statuscode. Beide benutzen dieselbe Entscheidung aus
// `lib/auth/admin-access.ts` plus die AAL2-Regel aus `lib/auth/admin-aal.ts`,
// damit es keine zwei Auslegungen gibt. Admin-Zugang verlangt verifizierte
// Identität, ausreichende Rolle/Capability bzw. zulässigen Break-Glass-Pfad
// und `currentLevel === 'aal2'`.

import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

import type { SupabaseClient } from '@supabase/supabase-js'

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import {
  decideAdminAccess,
  messageForDenial,
  parseBreakGlassAllowlist,
  statusForDenial,
  type AdminDecision,
  type AdminUser,
  type RoleLookup,
} from '@/lib/auth/admin-access'
import {
  ADMIN_STEP_UP_PFAD,
  applyAdminAal,
  parseAalLookup,
  type AalLookup,
} from '@/lib/auth/admin-aal'
import {
  ADMIN_AREA_MINIMUM,
  minimumRoleFor,
  parseRole,
  type Capability,
  type Role,
} from '@/lib/auth/roles'

/**
 * Tabelle, in der die Rolle hinterlegt ist.
 *
 * Bis Phase 1.5 hiess sie `creator_profiles` – ein Name aus der alten
 * Produktidee. Weil er nur an dieser einen Stelle stand, war die Umstellung auf
 * `profiles` eine einzelne Änderung (ADR-0044).
 */
const ROLE_TABLE = 'profiles'

export type AdminContext = {
  user: AdminUser
  role: Role | null
  /**
   * `role` heisst: Die Datenbank lässt die zugehörigen Zugriffe ebenfalls
   * durch. `break-glass` heisst: nur die Oberfläche ist offen, jeder
   * rollengebundene Datenzugriff dieser Sitzung wird abgelehnt (ADR-0036).
   */
  grant: 'role' | 'break-glass'
}

/**
 * Ermittelt die verifizierte Identität.
 *
 * `auth.getUser()` fragt den Auth-Server und liefert damit eine belastbare
 * Aussage. `auth.getSession()` liest nur die Cookies des Requests und ist
 * serverseitig ausdrücklich nicht als Autorisierungsgrundlage geeignet.
 */
async function loadVerifiedUser(
  supabase: SupabaseClient<Database>,
): Promise<{ user: AdminUser | null; failed: boolean }> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // Ein fehlendes oder abgelaufenes Token ist kein Ausfall, sondern
      // einfach „nicht angemeldet“. Alles andere deutet auf ein Problem mit
      // dem Auth-Server hin und soll sichtbar sein – abgelehnt wird in beiden
      // Fällen.
      const sessionMissing = error.name === 'AuthSessionMissingError' || error.status === 401
      if (!sessionMissing) {
        console.error('[admin-zugang] Auth-Server nicht erreichbar:', error.message)
      }
      return { user: null, failed: false }
    }
    const user = data?.user
    if (!user) return { user: null, failed: false }
    return { user: { id: user.id, email: user.email ?? null }, failed: false }
  } catch (error) {
    console.error('[admin-zugang] Identitätsprüfung fehlgeschlagen:', error)
    return { user: null, failed: true }
  }
}

/** Liest die Rolle und unterscheidet dabei „keine Rolle“ von „Abfrage kaputt“. */
async function loadRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RoleLookup> {
  try {
    const { data, error } = await (supabase as any)
      .from(ROLE_TABLE)
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    // Ohne diese Prüfung würde eine abgelehnte Abfrage wie „keine Rolle“
    // aussehen. Genau daran hing bisher die stille Freigabe über die Domain.
    if (error) return { status: 'failed', reason: error.message ?? 'unbekannter Fehler' }
    if (!data) return { status: 'unknown' }

    const role = parseRole(data.role)
    return role ? { status: 'ok', role } : { status: 'unknown' }
  } catch (error) {
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'unerwarteter Fehler',
    }
  }
}

/**
 * Liest die Notliste aus der Umgebung und weist auf eine Fehlkonfiguration hin.
 *
 * Ein gesetzter, aber unbrauchbarer Wert – etwa nur `@jetnity.com` – ergäbe
 * sonst stillschweigend eine leere Liste, und niemand merkte, dass der
 * gedachte Notzugang nicht existiert.
 */
function loadAllowlist(): ReadonlySet<string> {
  const raw = process.env.ADMIN_ALLOWED_EMAILS
  const allowlist = parseBreakGlassAllowlist(raw)

  if (raw && raw.trim() && allowlist.size === 0) {
    console.error(
      '[admin-zugang] ADMIN_ALLOWED_EMAILS ist gesetzt, enthält aber keine vollständige ' +
        'E-Mail-Adresse. Domains und Platzhalter werden bewusst nicht akzeptiert – es gibt ' +
        'derzeit keinen Notzugang.',
    )
  }

  return allowlist
}

/**
 * Identität und Rolle einmal pro Request.
 *
 * `cache()` sorgt dafür, dass Layout, Seite und Server-Action sich dieselbe
 * Abfrage teilen. Ohne diese Bündelung würde der zentrale Gate im Layout jede
 * Seite, die ihre eigene Rolle braucht, eine zweite Runde kosten.
 */
const loadAdminIdentity = cache(async () => {
  const supabase = await createServerComponentClient()
  const { user, failed } = await loadVerifiedUser(supabase)

  if (!user) return { user: null, identityFailed: failed, lookup: null }

  const lookup = await loadRole(supabase, user.id)

  if (lookup.status === 'failed') {
    console.error(
      `[admin-zugang] Rollenabfrage fehlgeschlagen für Konto ${user.id}: ${lookup.reason}`,
    )
  }

  return { user, identityFailed: false, lookup }
})

/**
 * Liest die aktuell erreichte Assurance. Die nächstmögliche Stufe wird
 * bewusst verworfen.
 * Ein Ausfall oder ein unlesbarer Wert ist kein AAL1-Default, sondern
 * fail closed.
 */
const loadAdminAal = cache(async (): Promise<AalLookup> => {
  const supabase = await createServerComponentClient()
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return parseAalLookup(data, error)
  } catch (error) {
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'unerwarteter Fehler',
    }
  }
})

/**
 * Führt die vollständige Prüfung durch und protokolliert alles, was jemand
 * später nachvollziehen möchte.
 */
export async function evaluateAdminAccess(options?: {
  capability?: Capability
  surface?: string
}): Promise<AdminDecision & { user: AdminUser | null }> {
  const allowlist = loadAllowlist()
  const surface = options?.surface ?? 'admin'

  const { user, identityFailed, lookup } = await loadAdminIdentity()

  if (!user || !lookup) {
    if (identityFailed) {
      return { allowed: false, denial: 'lookup-failed', user: null }
    }
    return { allowed: false, denial: 'unauthenticated', user: null }
  }

  const entscheidung = decideAdminAccess({
    user,
    lookup,
    allowlist,
    capability: options?.capability,
  })

  if (!entscheidung.allowed) {
    console.warn(
      `[admin-zugang] Abgelehnt (${entscheidung.denial}) für Konto ${user.id}, Bereich ${surface}.`,
    )
    return { ...entscheidung, user }
  }

  const aal = await loadAdminAal()
  const decision = applyAdminAal(entscheidung, aal)

  if (!decision.allowed) {
    if (decision.denial === 'aal-lookup-failed' && aal.status === 'failed') {
      console.error(
        `[admin-zugang] AAL-Abfrage fehlgeschlagen für Konto ${user.id}: ${aal.reason}`,
      )
    } else {
      console.warn(
        `[admin-zugang] Abgelehnt (${decision.denial}) für Konto ${user.id}, Bereich ${surface}.`,
      )
    }
    return { ...decision, user }
  }

  if (decision.grant === 'break-glass') {
    const benoetigt = options?.capability ? minimumRoleFor(options.capability) : ADMIN_AREA_MINIMUM
    console.warn(
      `[admin-zugang] BREAK-GLASS: Zugriff über ADMIN_ALLOWED_EMAILS gewährt. ` +
        `Konto ${user.id} <${user.email ?? 'ohne E-Mail'}>, Bereich ${surface}, ` +
        `Rollenabfrage ${lookup.status}` +
        (lookup.status === 'ok' ? ` (${lookup.role})` : '') +
        `. Nötig wäre mindestens die Rolle ${benoetigt}. Dieser Weg öffnet nur die ` +
        'Oberfläche – die Datenbank lehnt die Zugriffe dieser Sitzung ab. Bitte eine ' +
        'Datenbankrolle hinterlegen. AAL2 war erfüllt.',
    )
  }

  return { ...decision, user }
}

/**
 * Schutz für Seiten und Server-Actions.
 *
 * Wird im Layout der Gruppe `(admin)` aufgerufen und gilt damit für jede Seite
 * darin – auch für künftige, ohne dass jemand daran denken muss. Server-Actions
 * sind eigene Eintrittspunkte und rufen die Funktion selbst auf.
 */
export async function requireAdminPage(options?: {
  capability?: Capability
  surface?: string
}): Promise<AdminContext> {
  const decision = await evaluateAdminAccess(options)

  if (!decision.allowed) {
    if (decision.denial === 'unauthenticated') redirect('/admin/login')
    if (decision.denial === 'aal2-required') redirect(ADMIN_STEP_UP_PFAD)
    const grund =
      decision.denial === 'aal-lookup-failed' ? 'lookup-failed' : decision.denial
    redirect(`/unauthorized?grund=${grund}`)
  }

  return { user: decision.user!, role: decision.role, grant: decision.grant }
}

export type AdminApiGate =
  | ({ ok: true } & AdminContext)
  | { ok: false; response: NextResponse }

/**
 * Schutz für API-Routen.
 *
 * Antwortet mit einem Statuscode statt mit einer Weiterleitung: Ein `fetch`
 * folgt einem Redirect auf eine HTML-Loginseite und bekommt dann eine 200 mit
 * Markup, was im Client als Erfolg ankommt.
 *
 * Aufrufmuster:
 *
 *     const gate = await requireAdminApi()
 *     if (!gate.ok) return gate.response
 */
export async function requireAdminApi(options?: {
  capability?: Capability
  surface?: string
}): Promise<AdminApiGate> {
  const decision = await evaluateAdminAccess(options)

  if (!decision.allowed) {
    const status = statusForDenial(decision.denial)
    const response = NextResponse.json(
      { ok: false, error: decision.denial, message: messageForDenial(decision.denial) },
      { status },
    )
    response.headers.set('Cache-Control', 'no-store')
    if (status === 401) response.headers.set('WWW-Authenticate', 'Bearer')
    return { ok: false, response }
  }

  return { ok: true, user: decision.user!, role: decision.role, grant: decision.grant }
}

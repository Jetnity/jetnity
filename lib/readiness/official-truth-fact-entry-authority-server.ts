// lib/readiness/official-truth-fact-entry-authority-server.ts
//
// Servergrenze für eine spätere Official-Truth-Faktenerfassung.
// Der einzige Live-Einstieg ist loadOfficialTruthFactEntryAuthority().
// Er akzeptiert keine Aufruferrolle, keine Freigabe, keinen Prüfer, kein AAL,
// keine Fähigkeit, keine Nutzerkennung, keine E-Mail und kein RPC-Ergebnis.
//
// Die Entscheidungsnaht darunter ist nur für Tests. Sie ist kein zweiter
// Einstieg. Eine Route, die sie statt des Laders aufruft, öffnet F9 wieder.
//
// public.darf_official_truth_freigeben() ist LOCAL/UNAPPLIED. types/supabase.ts
// führt die Funktion bewusst nicht. Der Aufruf bleibt ein enger Wrapper um
// createServerComponentClient. Kein zweiter Client und kein SQL.

import 'server-only'

import { reachesDatabase, type AdminDecision } from '@/lib/auth/admin-access'
import { evaluateAdminAccess } from '@/lib/auth/admin-guard'
import { createServerComponentClient } from '@/lib/supabase/server'

const MISSING_FUNCTION = new Set(['42883', 'PGRST202'])
const PERMISSION_DENIED = new Set(['42501', '42503', 'PGRST301', 'PGRST302'])

export type OfficialTruthFactEntryAuthorityResult =
  | {
      readonly status: 'authorized'
      readonly grant: 'role'
      readonly capability: 'official-truth-freigeben'
    }
  | { readonly status: 'access_forbidden' }
  | { readonly status: 'access_lookup_failed' }
  | { readonly status: 'role_grant_required' }
  | { readonly status: 'database_capability_denied' }
  | { readonly status: 'database_capability_unavailable' }
  | { readonly status: 'database_capability_failed' }

/**
 * Bereits serverseitig abgeleiteter RPC-Ausgang. Kein Fehlertext.
 * `types/supabase.ts` enthält diese LOCAL/UNAPPLIED-Funktion nicht.
 * Das ist keine Behauptung, die generierten Typen führten sie bereits.
 */
export type OfficialTruthFactEntryDatabaseRead =
  | { readonly kind: 'value'; readonly data: unknown }
  | { readonly kind: 'error'; readonly code: string | null; readonly status?: number }

type OfficialTruthFactEntryRpcError = {
  code?: string | null
}

type OfficialTruthFactEntryRpcResponse = {
  data: unknown
  error: OfficialTruthFactEntryRpcError | null
  status?: number
}

type OfficialTruthFactEntryExpectedRpc = {
  Functions: {
    darf_official_truth_freigeben: {
      Args: Record<string, never>
      Returns: boolean
    }
  }
}

type OfficialTruthFactEntryRpcClient = {
  rpc: (
    name: keyof OfficialTruthFactEntryExpectedRpc['Functions'],
  ) => Promise<OfficialTruthFactEntryRpcResponse>
}

function ohneSitzung(decision: AdminDecision & { user?: unknown }): AdminDecision {
  if (!decision.allowed) return { allowed: false, denial: decision.denial }
  return { allowed: true, grant: decision.grant, role: decision.role }
}

function officialTruthFactEntryAccessBlock(
  access: AdminDecision,
): Exclude<OfficialTruthFactEntryAuthorityResult, { status: 'authorized' }> | null {
  if (!access.allowed) {
    if (access.denial === 'lookup-failed' || access.denial === 'aal-lookup-failed') {
      return { status: 'access_lookup_failed' }
    }
    return { status: 'access_forbidden' }
  }
  if (access.grant !== 'role' || !reachesDatabase(access)) {
    return { status: 'role_grant_required' }
  }
  return null
}

function officialTruthFactEntryFromDatabase(
  read: OfficialTruthFactEntryDatabaseRead,
): OfficialTruthFactEntryAuthorityResult {
  if (read.kind === 'error') {
    const code = (read.code ?? '').trim()
    if (MISSING_FUNCTION.has(code)) return { status: 'database_capability_unavailable' }
    if (PERMISSION_DENIED.has(code) || read.status === 401 || read.status === 403) {
      return { status: 'database_capability_denied' }
    }
    return { status: 'database_capability_failed' }
  }
  if (read.data === true) {
    return {
      status: 'authorized',
      grant: 'role',
      capability: 'official-truth-freigeben',
    }
  }
  if (read.data === false) return { status: 'database_capability_denied' }
  return { status: 'database_capability_failed' }
}

/**
 * Deterministische Naht. Sie liest die Datenbankfähigkeit erst, nachdem
 * Zugang, Rollenfreigabe und reachesDatabase offen sind. Ein Break-Glass-
 * oder Ablehnungsfall lässt den Zähler des Lesers auf null.
 * Das ist nicht der Live-Einstieg.
 */
export async function decideOfficialTruthFactEntryAuthority(
  access: AdminDecision,
  readDatabaseCapability: () => Promise<OfficialTruthFactEntryDatabaseRead>,
): Promise<OfficialTruthFactEntryAuthorityResult> {
  const blocked = officialTruthFactEntryAccessBlock(access)
  if (blocked) return blocked
  try {
    return officialTruthFactEntryFromDatabase(await readDatabaseCapability())
  } catch {
    return { status: 'database_capability_failed' }
  }
}

function databaseReadFromRpc(
  response: OfficialTruthFactEntryRpcResponse,
): OfficialTruthFactEntryDatabaseRead {
  if (response.error) {
    return {
      kind: 'error',
      code: typeof response.error.code === 'string' ? response.error.code : null,
      status: typeof response.status === 'number' ? response.status : undefined,
    }
  }
  return { kind: 'value', data: response.data }
}

async function invokeOfficialTruthFactEntryCapability(
  client: OfficialTruthFactEntryRpcClient,
): Promise<OfficialTruthFactEntryRpcResponse> {
  return client.rpc('darf_official_truth_freigeben')
}

async function readUserScopedOfficialTruthCapability(): Promise<OfficialTruthFactEntryDatabaseRead> {
  const client = await createServerComponentClient()
  const response = await invokeOfficialTruthFactEntryCapability(
    client as unknown as OfficialTruthFactEntryRpcClient,
  )
  return databaseReadFromRpc(response)
}

/**
 * Live-Einstieg. Keine Argumente und keine austauschbaren Abhängigkeiten.
 * Die Nutzer-RPC läuft nur nach erlaubtem Zugang, grant === 'role' und
 * reachesDatabase(decision).
 */
export async function loadOfficialTruthFactEntryAuthority(): Promise<OfficialTruthFactEntryAuthorityResult> {
  let access: AdminDecision
  try {
    access = ohneSitzung(
      await evaluateAdminAccess({ capability: 'official-truth-freigeben' }),
    )
  } catch {
    return { status: 'access_lookup_failed' }
  }

  const roleGrant = access.allowed && access.grant === 'role'
  const databaseReach = access.allowed && reachesDatabase(access)
  if (!roleGrant || !databaseReach) {
    return officialTruthFactEntryAccessBlock(access) ?? { status: 'role_grant_required' }
  }

  return decideOfficialTruthFactEntryAuthority(access, readUserScopedOfficialTruthCapability)
}

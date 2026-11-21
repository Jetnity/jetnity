import type { Database, Json } from './supabase'
import type { AdminAccountCountsRpcRow } from '@/lib/admin/account-counts-delivery/contract'

/** Reviewed additive Dev installer contract, not a claim about the generated
 * hosted schema. Only these literal RPCs may be called from the scanner-bound
 * server adapters. PostgreSQL bigint inputs use validated decimal strings so
 * a JSON/JavaScript number can never round an operation's compare-and-swap. */
export type AdminDevRuntimeFunctions = {
  admin_account_counts_v1: { Args: never; Returns: AdminAccountCountsRpcRow[] }
  admin_cms_inspiration_command_v1: {
    Args: { p_request_id: string; p_entry_id: string; p_expected_version: string; p_action: string; p_payload: Json }
    Returns: Json
  }
  admin_cms_inspiration_read_v1: {
    Args: { p_entry_id: string; p_revision?: string | null; p_before_revision?: string | null; p_limit?: number }
    Returns: Json
  }
  admin_cms_inspiration_confirm_v1: { Args: { p_request_id: string }; Returns: Json }
  cms_inspiration_published_v1: { Args: never; Returns: Json }
  cms_inspiration_published_v2: { Args: never; Returns: Json }
  admin_marketing_drafts_apply_v1: { Args: { input: Json }; Returns: Json }
  admin_marketing_drafts_read_v1: { Args: { input: Json }; Returns: Json }
}

export type AdminDevRuntimeDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & AdminDevRuntimeFunctions
  }
}

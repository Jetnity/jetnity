// lib/auth/mfa.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type BrowserSupabase = SupabaseClient<Database>;

export async function getAAL(supabase: BrowserSupabase) {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
}

/**
 * Sucht einen TOTP-Faktor und startet eine Challenge.
 * Gibt factorId + challengeId zurück – damit öffnest du den Dialog.
 */
export async function startTotpChallenge(supabase: BrowserSupabase) {
  const anyAuth = supabase.auth as any;

  if (!anyAuth?.mfa?.listFactors || !anyAuth?.mfa?.challenge) {
    throw new Error("Supabase MFA API nicht verfügbar.");
  }

  const { data: lf, error: lfErr } = await anyAuth.mfa.listFactors();
  if (lfErr) throw lfErr;

  const list: any[] = (lf?.all ?? lf?.factors ?? []) as any[];
  const totp = list.find((f) => f?.type === "totp");
  if (!totp?.id) {
    throw new Error("Kein TOTP-Faktor gefunden. Bitte zuerst TOTP in den Sicherheitseinstellungen einrichten.");
  }

  const { data: ch, error: chErr } = await anyAuth.mfa.challenge({ factorId: totp.id });
  if (chErr) throw chErr;

  const challengeId: string = ch?.id ?? ch?.challenge_id;
  if (!challengeId) throw new Error("challengeId fehlt.");

  return { factorId: totp.id as string, challengeId };
}

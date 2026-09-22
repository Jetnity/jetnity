// lib/auth/mfa.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  mfaFaktorenListeLesen,
  waehleVerifiziertenTotpFaktor,
} from "@/lib/auth/account-security-faktoren";

export type BrowserSupabase = SupabaseClient<Database>;

export const MFA_API_FEHLT = "Supabase MFA API nicht verfügbar.";
export const MFA_FAKTOREN_UNLESBAR = "TOTP-Faktoren konnten nicht gelesen werden.";
export const MFA_TOTP_FEHLT =
  "Kein TOTP-Faktor gefunden. Bitte zuerst TOTP in den Sicherheitseinstellungen einrichten.";
export const MFA_CHALLENGE_ID_FEHLT = "challengeId fehlt.";

type MfaListFactorsAntwort = {
  data?: unknown;
  error?: { message?: string } | null;
};

type MfaChallengeAntwort = {
  data?: { id?: string; challenge_id?: string } | null;
  error?: { message?: string } | null;
};

type MfaSdk = {
  listFactors?: () => Promise<MfaListFactorsAntwort>;
  challenge?: (args: { factorId: string }) => Promise<MfaChallengeAntwort>;
};

export async function getAAL(supabase: BrowserSupabase) {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
}

function mfaSdk(supabase: BrowserSupabase): MfaSdk | undefined {
  return (supabase.auth as { mfa?: MfaSdk }).mfa;
}

/**
 * Sucht einen bereits verifizierten TOTP-Faktor und startet eine Challenge.
 * Gibt factorId + challengeId zurück – damit öffnest du den Dialog.
 */
export async function startTotpChallenge(supabase: BrowserSupabase) {
  const mfa = mfaSdk(supabase);

  if (typeof mfa?.listFactors !== "function" || typeof mfa?.challenge !== "function") {
    throw new Error(MFA_API_FEHLT);
  }

  const { data: lf, error: lfErr } = await mfa.listFactors();
  if (lfErr) throw lfErr;

  const gelesen = mfaFaktorenListeLesen(lf);
  if (gelesen.status === "unlesbar") {
    throw new Error(MFA_FAKTOREN_UNLESBAR);
  }

  const totp = waehleVerifiziertenTotpFaktor(gelesen.liste);
  if (!totp) {
    throw new Error(MFA_TOTP_FEHLT);
  }

  const { data: ch, error: chErr } = await mfa.challenge({ factorId: totp.id });
  if (chErr) throw chErr;

  const challengeId = ch?.id ?? ch?.challenge_id;
  if (typeof challengeId !== "string" || challengeId.length === 0) {
    throw new Error(MFA_CHALLENGE_ID_FEHLT);
  }

  return { factorId: totp.id, challengeId };
}

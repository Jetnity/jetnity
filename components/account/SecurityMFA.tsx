// components/account/SecurityMFA.tsx
// MFA (TOTP) + ehrliches Passkey-Panel. AP-5-S1: empty ≠ unsupported ≠
// unavailable ≠ error. AP-5-S4: verified Unenroll steppt über challenge/verify
// hoch, ohne globales Consumer-AAL2. Browser-WebAuthn überschreibt Server-Truth nicht.

"use client";

import * as React from "react";
import type { UiSprache } from "@/lib/localization/ui-sprache";
import { sicherheitText, type SicherheitTextSchluessel } from "@/lib/localization/account-security-texte";
import { sicherheitStepUpStatus, sicherheitFaktorStatus } from "@/lib/localization/account-security-display-3";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import type { SupabaseClient as SbClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  KeyRound,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SICHERHEIT_EINGABE_16, SICHERHEIT_ZIEL_44 } from "@/lib/auth/account-security-premium-ux-1";
import {
  securityFehlerAusUnbekannt,
  securityFehlerEinordnen,
  type SecurityFehlerVorgang,
} from "@/lib/auth/account-security-fehler";
import {
  totpFaktorenAusAntwort,
  type MfaListFactorsData,
  type TotpFaktorAnzeige,
} from "@/lib/auth/account-security-faktoren";
import {
  darfPasskeyHinzufuegen,
  darfTotpEinrichten,
  passkeyBrowserHinweis,
  passkeyLage,
  totpFaktorAnzeigename,
  totpListeLage,
  type PasskeyLage,
  type TotpListeLage,
} from "@/lib/auth/account-security-lage";
import { accountLogoutScopeAction } from "@/app/account/security/logout-action";
import {
  MFA_STEP_UP_ANFANG,
  darfMfaStepUpStarten,
  mfaStepUpFehler,
  mfaStepUpDialogOffen,
  mfaStepUpErfolgBehaupten,
  mfaStepUpIstBeschaeftigt,
  mfaStepUpSollLokalenAuthVerlassen,
  mfaStepUpUndUnenroll,
  mfaStepUpWeiter,
  mfaUnenrollDirekt,
  mfaUnenrollVorbereiten,
  type MfaStepUpAuth,
  type MfaStepUpEreignis,
  type MfaStepUpZustand,
} from "@/lib/auth/account-mfa-step-up";
import PasskeyVerwaltung from "@/components/account/PasskeyVerwaltung";
import SecurityMfaStepUp from "@/components/account/SecurityMfaStepUp";
import { passkeyHandlungErlaubt, passkeySdkVorhanden } from "@/lib/auth/passkey-faehigkeit";

type BrowserSupabase = SbClient<Database>;

type AuthLikeError = {
  message?: string;
  code?: string;
  status?: number;
};

type MfaClient = {
  listFactors?: () => Promise<{
    data: MfaListFactorsData | null;
    error: AuthLikeError | null;
  }>;
  enroll?: (args: { factorType: "totp" }) => Promise<{
    data: {
      id?: string;
      factorId?: string;
      factor?: { id?: string };
      totp?: { id?: string; qr_code?: string; uri?: string };
      qr_code?: string;
      uri?: string;
    } | null;
    error: AuthLikeError | null;
  }>;
  challenge?: (args: { factorId: string }) => Promise<{
    data: { id?: string; challenge_id?: string } | null;
    error: AuthLikeError | null;
  }>;
  verify?: (args: {
    factorId: string;
    challengeId: string;
    code: string;
  }) => Promise<{ error: AuthLikeError | null }>;
  unenroll?: (args: { factorId: string }) => Promise<{ error: AuthLikeError | null }>;
  getAuthenticatorAssuranceLevel?: () => Promise<{
    data: { currentLevel?: string | null; nextLevel?: string | null } | null;
    error: AuthLikeError | null;
  }>;
};

function mfaClient(auth: { mfa?: MfaClient }): MfaClient | null {
  return auth.mfa ?? null;
}

function nutzerFehler(vorgang: SecurityFehlerVorgang, fehler: unknown): SicherheitTextSchluessel {
  const gelesen = securityFehlerAusUnbekannt(fehler);
  return `security.error.${securityFehlerEinordnen({
    vorgang,
    meldung: gelesen.meldung,
    code: gelesen.code,
    status: gelesen.status,
  }).code}`;
}

export default function SecurityMFA({
  passkeysServerAktiviert,
  sprache = "de",
}: {
  passkeysServerAktiviert: boolean;
  sprache?: UiSprache;
}) {
  const supabase = React.useMemo<BrowserSupabase>(() => createBrowserClient(), []);
  const [loading, setLoading] = React.useState(true);
  const [listFactorsVorhanden, setListFactorsVorhanden] = React.useState(true);
  const [listFehler, setListFehler] = React.useState(false);

  const [totpFactors, setTotpFactors] = React.useState<TotpFaktorAnzeige[]>([]);
  const [enrollQr, setEnrollQr] = React.useState<string | null>(null);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "success" | "error"; schluessel: SicherheitTextSchluessel } | null>(null);
  const [stepUp, setStepUp] = React.useState<MfaStepUpZustand>(MFA_STEP_UP_ANFANG);
  const unenrollLaufend = React.useRef(false);
  const entfernenAusloeser = React.useRef<HTMLButtonElement | null>(null);

  const [browserWebAuthn, setBrowserWebAuthn] = React.useState<boolean | null>(null);
  const stepUpBeschaeftigt = mfaStepUpIstBeschaeftigt(stepUp);
  const aktionenGesperrt = loading || stepUpBeschaeftigt || mfaStepUpDialogOffen(stepUp) || unenrollLaufend.current;

  React.useLayoutEffect(() => {
    if (aktionenGesperrt) return;
    entfernenAusloeser.current?.focus();
    entfernenAusloeser.current = null;
  }, [aktionenGesperrt]);

  React.useEffect(() => {
    setBrowserWebAuthn(typeof window !== "undefined" && "PublicKeyCredential" in window);
    void refreshFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (mfaStepUpSollLokalenAuthVerlassen(stepUp)) {
      lokalenAuthVerlassen();
    }
  }, [stepUp]);

  const totpLage: TotpListeLage = totpListeLage({
    listFactorsVorhanden,
    laden: loading && totpFactors.length === 0 && !listFehler && !factorId,
    fehler: listFehler,
    anzahl: totpFactors.length,
  });

  const aktuellePasskeyLage: PasskeyLage = passkeyLage({
    serverAktiviert: passkeysServerAktiviert,
    browserWebAuthn,
  });
  const passkeyBereit = passkeyHandlungErlaubt({
    serverAktiviert: passkeysServerAktiviert,
    sdkVorhanden: passkeySdkVorhanden(supabase.auth),
    browserWebAuthn,
    origin: typeof window === "undefined" ? null : window.location.origin,
  });

  async function refreshFactors() {
    setLoading(true);
    setMessage(null);
    setListFehler(false);
    try {
      const mfa = mfaClient(supabase.auth);
      if (!mfa?.listFactors) {
        setListFactorsVorhanden(false);
        setTotpFactors([]);
        return;
      }
      setListFactorsVorhanden(true);
      const { data, error } = await mfa.listFactors();
      if (error) throw error;

      setTotpFactors(totpFaktorenAusAntwort(data));
    } catch (err: unknown) {
      setListFehler(true);
      setTotpFactors([]);
      setMessage({ type: "error", schluessel: nutzerFehler("list", err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    setLoading(true);
    setMessage(null);
    setEnrollQr(null);
    setFactorId(null);
    try {
      const mfa = mfaClient(supabase.auth);
      if (!mfa?.enroll) {
        setMessage({
          type: "error",
          schluessel: `security.error.${securityFehlerEinordnen({
            vorgang: "enroll",
            meldung: "not available",
          }).code}`,
        });
        return;
      }
      const { data, error } = await mfa.enroll({ factorType: "totp" });
      if (error) throw error;

      const fid = data?.id ?? data?.factorId ?? data?.factor?.id ?? data?.totp?.id;
      const qr = data?.totp?.qr_code ?? data?.qr_code ?? null;

      if (!fid) {
        setMessage({
          type: "error",
          schluessel: `security.error.${securityFehlerEinordnen({ vorgang: "enroll" }).code}`,
        });
        return;
      }
      setFactorId(fid);
      if (qr?.startsWith("data:")) setEnrollQr(qr);
    } catch (err: unknown) {
      setMessage({ type: "error", schluessel: nutzerFehler("enroll", err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!factorId) {
      setMessage({
        type: "error",
        schluessel: "totp.notStarted",
      });
      return;
    }
    if (!code || code.length !== 6) {
      setMessage({ type: "error", schluessel: "totp.codeInvalid" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const mfa = mfaClient(supabase.auth);
      if (!mfa?.challenge || !mfa.verify) {
        setMessage({
          type: "error",
          schluessel: `security.error.${securityFehlerEinordnen({
            vorgang: "verify",
            meldung: "not available",
          }).code}`,
        });
        return;
      }
      const { data: ch, error: chErr } = await mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const challengeId = ch?.id ?? ch?.challenge_id;
      if (!challengeId) {
        setMessage({
          type: "error",
          schluessel: `security.error.${securityFehlerEinordnen({ vorgang: "verify" }).code}`,
        });
        return;
      }

      const { error: verErr } = await mfa.verify({ factorId, challengeId, code });
      if (verErr) throw verErr;

      setMessage({ type: "success", schluessel: "totp.activated" });
      setEnrollQr(null);
      setFactorId(null);
      setCode("");
      await refreshFactors();
    } catch (err: unknown) {
      setMessage({ type: "error", schluessel: nutzerFehler("verify", err) });
    } finally {
      setLoading(false);
    }
  }

  function stepUpAuth(): MfaStepUpAuth {
    return {
      getUser: () => supabase.auth.getUser(),
      refreshSession: () => supabase.auth.refreshSession(),
      signOut: (options) => supabase.auth.signOut({ scope: options.scope }),
      mfa: supabase.auth.mfa,
    };
  }

  function lokalenAuthVerlassen() {
    window.location.assign(new URL("/", window.location.origin).toString());
  }

  async function nachUnenrollErgebnis(
    fertig: Extract<
      MfaStepUpEreignis,
      { typ: "ausfuehren_ok" | "ausfuehren_fehler" | "client_unbekannt" | "client_ohne_sitzung" | "unenroll_ok_sitzung_unbestaetigt" }
    >,
    id: string,
  ) {
    setStepUp((aktuell) => mfaStepUpWeiter(aktuell, fertig));
    if (fertig.typ === "ausfuehren_ok") {
      enrollZustandNachUnenroll(id);
      await refreshFactors();
      setMessage({ type: "success", schluessel: "step.status.success" });
      setStepUp((aktuell) => mfaStepUpWeiter(aktuell, { typ: "zuruecksetzen" }));
      return;
    }
    if (fertig.typ !== "unenroll_ok_sitzung_unbestaetigt") return;

    enrollZustandNachUnenroll(id);
    await refreshFactors();
    setMessage({
      type: "error",
      schluessel: `step.error.${mfaStepUpFehler(
        fertig.lokalBeendet
          ? "sitzung_unbestaetigt_nach_unenroll"
          : "sitzung_unbestaetigt_abmelden_fehlgeschlagen",
      ).code}`,
    });
    const lokal = await accountLogoutScopeAction("local");
    if (
      fertig.lokalBeendet ||
      lokal.typ === "ausfuehren_ok" ||
      lokal.typ === "client_ohne_sitzung"
    ) {
      lokalenAuthVerlassen();
    }
  }

  function enrollZustandNachUnenroll(id: string) {
    if (factorId === id) {
      setFactorId(null);
      setEnrollQr(null);
      setCode("");
    }
  }

  async function handleRemove(id: string, status: string | null, ausloeser: HTMLButtonElement) {
    if (unenrollLaufend.current || !darfMfaStepUpStarten(stepUp)) return;
    entfernenAusloeser.current = ausloeser;
    unenrollLaufend.current = true;
    setMessage(null);
    setStepUp((aktuell) => mfaStepUpWeiter(aktuell, { typ: "starte", faktorId: id }));
    try {
      const vorbereitung = await mfaUnenrollVorbereiten(stepUpAuth(), id, status);
      setStepUp((aktuell) => mfaStepUpWeiter(aktuell, vorbereitung));
      if (vorbereitung.typ !== "plan_direkt") return;

      const fertig = await mfaUnenrollDirekt(stepUpAuth(), id);
      await nachUnenrollErgebnis(fertig, id);
    } finally {
      unenrollLaufend.current = false;
    }
  }

  async function handleStepUpBestaetigen(otp: string) {
    if (unenrollLaufend.current) return;
    unenrollLaufend.current = true;
    try {
      const faktorId = stepUp.zielFaktorId;
      if (!faktorId) {
        setStepUp((aktuell) =>
          mfaStepUpWeiter(aktuell, {
            typ: "ausfuehren_fehler",
            fehler: mfaStepUpFehler("faktor_stale"),
          }),
        );
        return;
      }
      setStepUp((aktuell) => mfaStepUpWeiter(aktuell, { typ: "code_bereit" }));
      const fertig = await mfaStepUpUndUnenroll(stepUpAuth(), { faktorId, code: otp });
      await nachUnenrollErgebnis(fertig, faktorId);
    } finally {
      unenrollLaufend.current = false;
    }
  }

  const browserHinweis = passkeyBrowserHinweis({
    lage: aktuellePasskeyLage,
    browserWebAuthn,
  });

  return (
    <div className="space-y-4">
      <div className={cn("grid grid-cols-1 gap-4", factorId ? "" : "lg:grid-cols-2 lg:items-start")}>
      <Card id="account-totp" className={cn("scroll-mt-24", factorId && "lg:col-span-2")}>
        <CardHeader withDivider className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <CardTitle as="h2">{sicherheitText(sprache, "totp.title")}</CardTitle>
          </div>
          <CardDescription>
            {sicherheitText(sprache, "totp.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          <p
            data-security-lage={totpLage}
            className="mb-4 text-sm text-ink-700"
            role="status"
          >
            {sicherheitText(sprache, `totp.status.${totpLage}`)}
          </p>

          {totpLage === "error" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshFactors()}
              disabled={aktionenGesperrt}
              className={`${SICHERHEIT_ZIEL_44} mb-4 min-h-11`}
            >
              {sicherheitText(sprache, "common.reload")}
            </Button>
          )}

          {totpLage === "ready" && totpFactors.length > 0 && (
            <div className="mb-4 rounded-xl border bg-muted/30 p-3">
              <div className="text-sm font-medium mb-2">{sicherheitText(sprache, "totp.listTitle")}</div>
              <ul className="space-y-2">
                {totpFactors.map((faktor) => {
                  const sichererName = totpFaktorAnzeigename(faktor.friendly_name);
                  const name = sichererName === faktor.friendly_name?.trim()
                    ? sichererName : sicherheitText(sprache, "totp.fallbackName");
                  const status = sicherheitFaktorStatus(sprache, faktor.status);
                  return (
                    <li
                      key={faktor.id}
                      className="flex flex-col items-stretch gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 text-sm">
                        <div className="font-medium">{name}</div>
                        <div className="text-muted-foreground">
                          {[
                            status,
                            faktor.created_at
                              ? sicherheitText(sprache, "totp.since", { date: new Date(faktor.created_at).toLocaleString(sprache === "en" ? "en-GB" : "de-CH") })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={`${SICHERHEIT_ZIEL_44} min-h-11 w-full sm:w-auto`}
                        onClick={(event) => void handleRemove(faktor.id, faktor.status, event.currentTarget)}
                        disabled={aktionenGesperrt}
                      >
                        {sicherheitText(sprache, "totp.remove", { name })}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {factorId ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                  <div className="font-medium">{sicherheitText(sprache, "totp.scan")}</div>
                </div>
                {enrollQr?.startsWith("data:") ? (
                  // Der QR-Code kommt als Data-URL aus der Anmeldung bei
                  // Supabase. next/image kann daran nichts optimieren.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enrollQr}
                    alt={sicherheitText(sprache, "totp.qrAlt")}
                    className="mx-auto h-40 w-40 rounded-lg border bg-white p-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    <span>
                      {sicherheitText(sprache, "totp.qrMissing")}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4">
                <div className="font-medium mb-2">{sicherheitText(sprache, "totp.enter")}</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Label htmlFor="totp-code" srOnly>
                    {sicherheitText(sprache, "common.code")}
                  </Label>
                  <Input
                    id="totp-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                    aria-invalid={code.length > 0 && code.length !== 6 ? true : undefined}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="h-11 min-h-11 max-w-[160px] text-center tracking-widest"
                    inputClassName={`${SICHERHEIT_EINGABE_16} text-lg pointer-fine:text-lg`}
                  />
                  <Button
                    onClick={() => void handleVerify()}
                    disabled={aktionenGesperrt || code.length !== 6}
                    className={`${SICHERHEIT_ZIEL_44} min-h-11`}
                  >
                    {sicherheitText(sprache, "common.confirm")}
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className={`${SICHERHEIT_ZIEL_44} min-h-11`}
                disabled={aktionenGesperrt}
                onClick={(event) => void handleRemove(factorId, "unverified", event.currentTarget)}
              >
                {sicherheitText(sprache, "totp.cancelSetup")}
              </Button>
            </div>
          ) : darfTotpEinrichten(totpLage) ? (
            <Button
              onClick={() => void handleEnroll()}
              disabled={aktionenGesperrt}
              variant={totpFactors.length > 0 ? "outline" : "default"}
              className={cn(SICHERHEIT_ZIEL_44, "min-h-11", totpFactors.length > 0 ? "w-full sm:w-auto" : "w-full")}
            >
              {!loading && !stepUpBeschaeftigt ? sicherheitText(sprache, "totp.setup") : sicherheitText(sprache, "common.wait")}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <section
        id="account-passkeys"
        aria-labelledby="account-passkeys-title"
        data-passkey-lage={aktuellePasskeyLage}
        className={cn(
          "scroll-mt-24 rounded-2xl border border-black/5 bg-white",
          aktuellePasskeyLage === "unsupported" ? "p-4" : "p-5",
          factorId && "lg:col-span-2",
        )}
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          <h2 id="account-passkeys-title" className="text-lg font-semibold tracking-tight text-brand-800">
            {sicherheitText(sprache, "passkey.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, "passkey.description")}
        </p>
        <p role="status" className="mt-3 text-sm leading-6 text-ink-700">
          <span className="font-medium">
            {sicherheitText(sprache, `passkey.label.${aktuellePasskeyLage}`)}
            .{" "}
          </span>
          {sicherheitText(sprache, `passkey.status.${aktuellePasskeyLage}`)}
          {browserHinweis ? ` ${sicherheitText(sprache, "passkey.browserHint")}` : null}
        </p>
        {darfPasskeyHinzufuegen(aktuellePasskeyLage) && !passkeyBereit ? (
          <p className="mt-3 text-sm leading-6 text-ink-700">
            {sicherheitText(sprache, "passkey.notConnected")}
          </p>
        ) : null}
        {passkeyBereit ? (
          <PasskeyVerwaltung sprache={sprache} serverAktiviert={passkeysServerAktiviert} auth={supabase.auth} />
        ) : null}
      </section>
      </div>

      {mfaStepUpDialogOffen(stepUp) ? (
        <SecurityMfaStepUp
          zustand={stepUp}
          sprache={sprache}
          onBestaetigen={(otp) => void handleStepUpBestaetigen(otp)}
          onAbbrechen={() => setStepUp((aktuell) => mfaStepUpWeiter(aktuell, { typ: "abbrechen" }))}
        />
      ) : null}

      {(message ||
        (!mfaStepUpDialogOffen(stepUp) &&
          (stepUp.lage === "error" || stepUp.lage === "unavailable" || stepUp.lage === "unsupported"))) && (
        <div
          role={
            message?.type === "error" ||
            stepUp.lage === "error" ||
            stepUp.lage === "unavailable"
              ? "alert"
              : "status"
          }
          aria-live={
            message?.type === "error" || stepUp.lage === "error" || stepUp.lage === "unavailable"
              ? "assertive"
              : "polite"
          }
          data-mfa-step-up-lage={stepUp.lage}
          className={cn(
            "rounded-xl border p-4 flex items-center gap-2",
            (message?.type === "success" || mfaStepUpErfolgBehaupten(stepUp))
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {message?.type === "success" || mfaStepUpErfolgBehaupten(stepUp) ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          )}
          <span>{message ? sicherheitText(sprache, message.schluessel) : sicherheitStepUpStatus(sprache, stepUp)}</span>
        </div>
      )}
    </div>
  );
}

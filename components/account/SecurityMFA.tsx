// components/account/SecurityMFA.tsx
// MFA (TOTP) + ehrliches Passkey-Panel. AP-5-S1: empty ≠ unsupported ≠
// unavailable ≠ error. Browser-WebAuthn überschreibt Server-Truth nicht.

"use client";

import * as React from "react";
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
  PASSKEY_LAGE_TEXTE,
  totpFaktorAnzeigename,
  totpFaktorStatusText,
  totpListeLage,
  TOTP_LAGE_TEXTE,
  type PasskeyLage,
  type TotpListeLage,
} from "@/lib/auth/account-security-lage";

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
};

function mfaClient(auth: { mfa?: MfaClient }): MfaClient | null {
  return auth.mfa ?? null;
}

function nutzerFehler(vorgang: SecurityFehlerVorgang, fehler: unknown): string {
  const gelesen = securityFehlerAusUnbekannt(fehler);
  return securityFehlerEinordnen({
    vorgang,
    meldung: gelesen.meldung,
    code: gelesen.code,
    status: gelesen.status,
  }).text;
}

export default function SecurityMFA({
  passkeysServerAktiviert,
}: {
  passkeysServerAktiviert: boolean;
}) {
  const supabase = React.useMemo<BrowserSupabase>(() => createBrowserClient(), []);
  const [loading, setLoading] = React.useState(true);
  const [listFactorsVorhanden, setListFactorsVorhanden] = React.useState(true);
  const [listFehler, setListFehler] = React.useState(false);

  const [totpFactors, setTotpFactors] = React.useState<TotpFaktorAnzeige[]>([]);
  const [enrollQr, setEnrollQr] = React.useState<string | null>(null);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const [browserWebAuthn, setBrowserWebAuthn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setBrowserWebAuthn(typeof window !== "undefined" && "PublicKeyCredential" in window);
    void refreshFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setMessage({ type: "error", text: nutzerFehler("list", err) });
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
          text: securityFehlerEinordnen({
            vorgang: "enroll",
            meldung: "not available",
          }).text,
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
          text: securityFehlerEinordnen({ vorgang: "enroll" }).text,
        });
        return;
      }
      setFactorId(fid);
      if (qr?.startsWith("data:")) setEnrollQr(qr);
    } catch (err: unknown) {
      setMessage({ type: "error", text: nutzerFehler("enroll", err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!factorId) {
      setMessage({
        type: "error",
        text: "Keine Authenticator-Einrichtung läuft. Starte zuerst die Einrichtung.",
      });
      return;
    }
    if (!code || code.length !== 6) {
      setMessage({ type: "error", text: "Bitte 6-stelligen Code eingeben." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const mfa = mfaClient(supabase.auth);
      if (!mfa?.challenge || !mfa.verify) {
        setMessage({
          type: "error",
          text: securityFehlerEinordnen({
            vorgang: "verify",
            meldung: "not available",
          }).text,
        });
        return;
      }
      const { data: ch, error: chErr } = await mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const challengeId = ch?.id ?? ch?.challenge_id;
      if (!challengeId) {
        setMessage({
          type: "error",
          text: securityFehlerEinordnen({ vorgang: "verify" }).text,
        });
        return;
      }

      const { error: verErr } = await mfa.verify({ factorId, challengeId, code });
      if (verErr) throw verErr;

      setMessage({ type: "success", text: "Authenticator-App erfolgreich aktiviert." });
      setEnrollQr(null);
      setFactorId(null);
      setCode("");
      await refreshFactors();
    } catch (err: unknown) {
      setMessage({ type: "error", text: nutzerFehler("verify", err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const mfa = mfaClient(supabase.auth);
      if (!mfa?.unenroll) {
        setMessage({
          type: "error",
          text: securityFehlerEinordnen({
            vorgang: "unenroll",
            meldung: "not available",
          }).text,
        });
        return;
      }
      const { error } = await mfa.unenroll({ factorId: id });
      if (error) throw error;
      if (factorId === id) {
        setFactorId(null);
        setEnrollQr(null);
        setCode("");
      }
      setMessage({ type: "success", text: "Authenticator-App entfernt." });
      await refreshFactors();
    } catch (err: unknown) {
      setMessage({ type: "error", text: nutzerFehler("unenroll", err) });
    } finally {
      setLoading(false);
    }
  }

  const browserHinweis = passkeyBrowserHinweis({
    lage: aktuellePasskeyLage,
    browserWebAuthn,
  });

  return (
    <div className="space-y-10">
      <Card>
        <CardHeader withDivider>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <CardTitle as="h2">Authenticator-App (TOTP)</CardTitle>
          </div>
          <CardDescription>
            Scanne den QR-Code mit einer Authenticator-App und gib den 6-stelligen Code ein.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <p
            data-security-lage={totpLage}
            className="mb-4 text-sm text-ink-700"
            role="status"
          >
            {TOTP_LAGE_TEXTE[totpLage]}
          </p>

          {totpLage === "error" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshFactors()}
              disabled={loading}
              className="mb-4 min-h-11"
            >
              Erneut laden
            </Button>
          )}

          {totpLage === "ready" && totpFactors.length > 0 && (
            <div className="mb-4 rounded-xl border bg-muted/30 p-3">
              <div className="text-sm font-medium mb-2">Eingerichtete Authenticator-Apps</div>
              <ul className="space-y-2">
                {totpFactors.map((faktor) => {
                  const name = totpFaktorAnzeigename(faktor.friendly_name);
                  const status = totpFaktorStatusText(faktor.status);
                  return (
                    <li
                      key={faktor.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-background p-2 border"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{name}</div>
                        <div className="text-muted-foreground">
                          {[
                            status,
                            faktor.created_at
                              ? `seit ${new Date(faktor.created_at).toLocaleString()}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="min-h-11"
                        onClick={() => void handleRemove(faktor.id)}
                        disabled={loading}
                      >
                        {name} entfernen
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
                  <div className="font-medium">Schritt 1: QR-Code scannen</div>
                </div>
                {enrollQr?.startsWith("data:") ? (
                  // Der QR-Code kommt als Data-URL aus der Anmeldung bei
                  // Supabase. next/image kann daran nichts optimieren.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enrollQr}
                    alt="QR-Code zum Einrichten der Zwei-Faktor-Anmeldung"
                    className="mx-auto h-40 w-40 rounded-lg border bg-white p-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    <span>
                      Der QR-Code fehlt. Die Geheimnis-URI wird nicht angezeigt. Brich ab und starte die Einrichtung neu.
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4">
                <div className="font-medium mb-2">Schritt 2: 6-stelligen Code eingeben</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Label htmlFor="totp-code" srOnly>
                    6-stelliger Code
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
                    className="h-11 min-h-11 max-w-[160px] text-center tracking-widest text-lg"
                  />
                  <Button
                    onClick={() => void handleVerify()}
                    disabled={loading || code.length !== 6}
                    className="min-h-11"
                  >
                    Bestätigen
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                disabled={loading}
                onClick={() => void handleRemove(factorId)}
              >
                Einrichtung abbrechen
              </Button>
            </div>
          ) : darfTotpEinrichten(totpLage) ? (
            <Button onClick={() => void handleEnroll()} disabled={loading} className="w-full min-h-11">
              {!loading ? "Authenticator-App einrichten" : "Bitte warten…"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader withDivider>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
            <CardTitle as="h2">Passkeys</CardTitle>
          </div>
          <CardDescription>
            Passkeys richten sich nach der Server-Konfiguration, nicht nach dem Browser allein.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div
            data-passkey-lage={aktuellePasskeyLage}
            className="rounded-xl border bg-muted/30 p-3 text-sm"
            role="status"
          >
            <span className="inline-flex items-start gap-2">
              {aktuellePasskeyLage === "empty" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-700" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" aria-hidden="true" />
              )}
              <span>
                <span className="font-medium">
                  {aktuellePasskeyLage === "unsupported"
                    ? "Nicht unterstützt"
                    : aktuellePasskeyLage === "unavailable"
                      ? "Nicht verfügbar"
                      : "Noch nicht eingerichtet"}
                  .{" "}
                </span>
                {PASSKEY_LAGE_TEXTE[aktuellePasskeyLage]}
                {browserHinweis ? ` ${browserHinweis}` : null}
              </span>
            </span>
          </div>

          {darfPasskeyHinzufuegen(aktuellePasskeyLage) ? (
            <p className="mt-4 text-sm text-ink-700">
              Das Hinzufügen eines Passkeys ist in dieser Umgebung noch nicht angebunden.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl border p-4 flex items-center gap-2",
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

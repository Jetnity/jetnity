// components/account/SecurityMFA.tsx
// MFA (TOTP + Passkeys-Panel)
// Voraussetzung: createBrowserClient() aus "@/lib/supabase/client"

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

type BrowserSupabase = SbClient<Database>;

type FactorItem = {
  id: string;
  type: "totp" | string;
  friendly_name?: string | null;
  created_at?: string | null;
  status?: string | null;
};

export default function SecurityMFA() {
  const supabase = React.useMemo<BrowserSupabase>(() => createBrowserClient(), []);
  const [loading, setLoading] = React.useState(false);

  // TOTP
  const [totpFactors, setTotpFactors] = React.useState<FactorItem[]>([]);
  const [enrollQr, setEnrollQr] = React.useState<string | null>(null);
  const [enrollUri, setEnrollUri] = React.useState<string | null>(null);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Passkeys
  const [passkeySupported, setPasskeySupported] = React.useState(false);
  const [passkeyBusy, setPasskeyBusy] = React.useState(false);
  const [passkeyMsg, setPasskeyMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    void refreshFactors();
    const apiPresent = !!(supabase.auth as any)?.webauthn || !!(supabase.auth as any)?.passkeys;
    const webauthnAvailable = typeof window !== "undefined" && "PublicKeyCredential" in window;
    setPasskeySupported(apiPresent && webauthnAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshFactors() {
    setLoading(true);
    setMessage(null);
    try {
      const anyAuth = supabase.auth as any;
      if (!anyAuth?.mfa?.listFactors) {
        setTotpFactors([]);
        return;
      }
      const { data, error } = await anyAuth.mfa.listFactors();
      if (error) throw error;

      const list = (data?.all ?? data?.factors ?? []) as any[];
      const totps: FactorItem[] = list
        .filter((f) => f?.type === "totp")
        .map((f) => ({
          id: f.id,
          type: f.type,
          friendly_name: f.friendly_name ?? null,
          created_at: f.created_at ?? null,
          status: f.status ?? null,
        }));
      setTotpFactors(totps);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Konnte Faktoren nicht laden." });
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    setLoading(true);
    setMessage(null);
    setEnrollQr(null);
    setEnrollUri(null);
    setFactorId(null);
    try {
      const anyAuth = supabase.auth as any;
      if (!anyAuth?.mfa?.enroll) throw new Error("Supabase MFA API nicht verfügbar (enroll).");
      const { data, error } = await anyAuth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;

      const fid: string =
        data?.id ?? data?.factorId ?? data?.factor?.id ?? data?.totp?.id;
      const qr: string | null =
        data?.totp?.qr_code ?? data?.qr_code ?? null;
      const uri: string | null =
        data?.totp?.uri ?? data?.uri ?? null;

      if (!fid) throw new Error("Konnte factorId für TOTP nicht ermitteln.");
      setFactorId(fid);
      if (qr) setEnrollQr(qr);
      if (uri) setEnrollUri(uri);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Einschreibung fehlgeschlagen." });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!factorId) {
      setMessage({ type: "error", text: "Kein TOTP-Faktor in Einrichtung. Starte zuerst die Einrichtung." });
      return;
    }
    if (!code || code.length !== 6) {
      setMessage({ type: "error", text: "Bitte 6-stelligen Code eingeben." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const anyAuth = supabase.auth as any;
      if (!anyAuth?.mfa?.challenge || !anyAuth?.mfa?.verify) {
        throw new Error("Supabase MFA API nicht verfügbar (challenge/verify).");
      }
      const { data: ch, error: chErr } = await anyAuth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const challengeId: string = ch?.id ?? ch?.challenge_id;
      if (!challengeId) throw new Error("Konnte challengeId nicht ermitteln.");

      const { error: verErr } = await anyAuth.mfa.verify({ factorId, challengeId, code });
      if (verErr) throw verErr;

      setMessage({ type: "success", text: "TOTP erfolgreich aktiviert." });
      setEnrollQr(null);
      setEnrollUri(null);
      setFactorId(null);
      setCode("");
      await refreshFactors();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Verifizierung fehlgeschlagen." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const anyAuth = supabase.auth as any;
      if (!anyAuth?.mfa?.unenroll) throw new Error("Supabase MFA API nicht verfügbar (unenroll).");
      const { error } = await anyAuth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      setMessage({ type: "success", text: "TOTP-Faktor entfernt." });
      await refreshFactors();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Entfernen fehlgeschlagen." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterPasskey() {
    setPasskeyMsg(null);
    setPasskeyBusy(true);
    try {
      const anyAuth = supabase.auth as any;
      const api =
        anyAuth?.webauthn?.register ??
        anyAuth?.passkeys?.register ??
        anyAuth?.webauthn?.create ??
        null;

      if (!api) {
        throw new Error("Passkeys sind noch nicht aktiviert (Auth → Settings).");
      }

      const { error } = await api();
      if (error) throw error;

      setPasskeyMsg({ type: "success", text: "Passkey erfolgreich registriert." });
    } catch (err: any) {
      setPasskeyMsg({ type: "error", text: err?.message ?? "Passkey-Registrierung fehlgeschlagen." });
    } finally {
      setPasskeyBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* TOTP */}
      <Card>
        <CardHeader withDivider>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle as="h2">TOTP (Authenticator-App)</CardTitle>
          </div>
          <CardDescription>
            Scanne den QR-Code mit einer Authenticator-App (1Password, Google Authenticator, etc.)
            und gib den 6-stelligen Code ein.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {totpFactors.length > 0 && (
            <div className="mb-4 rounded-xl border bg-muted/30 p-3">
              <div className="text-sm font-medium mb-2">Aktive TOTP-Faktoren</div>
              <ul className="space-y-2">
                {totpFactors.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-lg bg-background p-2 border"
                  >
                    <div className="text-sm">
                      <div className="font-medium">Faktor {f.id.slice(0, 8)}…</div>
                      <div className="text-muted-foreground">
                        Status: {f.status ?? "aktiv"}
                        {f.created_at ? ` · seit ${new Date(f.created_at).toLocaleString()}` : ""}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(f.id)}
                      disabled={loading}
                    >
                      Entfernen
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!factorId ? (
            <Button onClick={handleEnroll} disabled={loading} className="w-full">
              {!loading ? "TOTP einrichten" : "Bitte warten…"}
            </Button>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-5 w-5" />
                  <div className="font-medium">Schritt 1: QR-Code scannen</div>
                </div>
                {enrollQr?.startsWith("data:") ? (
                  <img
                    src={enrollQr}
                    alt="TOTP QR"
                    className="mx-auto h-40 w-40 rounded-lg border bg-white p-2"
                  />
                ) : enrollUri ? (
                  <div className="text-sm">
                    <div className="mb-2 text-muted-foreground">
                      Direkt-Link für unterstützte Apps:
                    </div>
                    <a
                      href={enrollUri}
                      className="break-all underline text-primary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {enrollUri}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span>
                      QR-Code konnte nicht geladen werden – versuche es trotzdem mit dem 6-stelligen Code.
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4">
                <div className="font-medium mb-2">Schritt 2: 6-stelligen Code eingeben</div>
                <div className="flex items-center gap-3">
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
                    className="h-10 max-w-[160px] text-center tracking-widest text-lg"
                  />
                  <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
                    Bestätigen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardHeader withDivider>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <CardTitle as="h2">Passkeys (WebAuthn)</CardTitle>
          </div>
          <CardDescription>
            Anmeldung mit FaceID/TouchID oder Sicherheitsschlüssel. Aktiviert sich automatisch,
            sobald Passkeys in Supabase (Auth → Settings) eingeschaltet sind.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            Status:{" "}
            {passkeySupported ? (
              <span className="inline-flex items-center gap-1 text-green-700">
                <CheckCircle2 className="h-4 w-4" /> verfügbar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-4 w-4" /> derzeit nicht aktiv
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleRegisterPasskey} disabled={!passkeySupported || passkeyBusy}>
              {!passkeyBusy ? "Passkey hinzufügen" : "Registriere…"}
            </Button>
            <Button variant="outline" disabled>
              Verwalten (bald)
            </Button>
          </div>

          {passkeyMsg && (
            <div
              className={cn(
                "mt-3 rounded-lg border p-3 text-sm",
                passkeyMsg.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              )}
            >
              {passkeyMsg.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* globale Meldungen */}
      {message && (
        <div
          className={cn(
            "rounded-xl border p-4 flex items-center gap-2",
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

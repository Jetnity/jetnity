// components/auth/MFATotpDialog.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  securityFehlerAusUnbekannt,
  securityFehlerEinordnen,
} from "@/lib/auth/account-security-fehler";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type BrowserSupabase = SupabaseClient<Database>;

export type MFATotpDialogProps = {
  open: boolean;
  onClose: () => void;
  supabase: BrowserSupabase;
  /** factorId & challengeId kommen aus startTotpChallenge(...) */
  factorId: string;
  challengeId: string;
  onVerified?: () => void;
};

export function MFATotpDialog({
  open,
  onClose,
  supabase,
  factorId,
  challengeId,
  onVerified,
}: MFATotpDialogProps) {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const titelId = "mfa-dialog-titel";
  const beschreibungId = "mfa-dialog-beschreibung";
  const fehlerId = "mfa-dialog-fehler";
  const codeRef = React.useRef<HTMLInputElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const zurueckRef = React.useRef<Element | null>(null);

  function fokussierbare(): HTMLElement[] {
    if (!dialogRef.current) return []
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    )
  }

  React.useEffect(() => {
    if (!open) {
      setCode("");
      setMsg(null);
      setBusy(false);
      if (zurueckRef.current instanceof HTMLElement) zurueckRef.current.focus();
      return;
    }
    zurueckRef.current = document.activeElement;
    const id = window.setTimeout(() => codeRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.length !== 6) {
      setMsg({ type: "error", text: "Bitte 6-stelligen Code eingeben." });
      codeRef.current?.focus();
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const anyAuth = supabase.auth as any;
      if (!anyAuth?.mfa?.verify) {
        setMsg({
          type: "error",
          text: securityFehlerEinordnen({ vorgang: "verify", meldung: "not available" }).text,
        });
        return;
      }

      const { error } = await anyAuth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) throw error;

      setMsg({ type: "success", text: "MFA erfolgreich bestätigt." });
      onVerified?.();
    } catch (err: unknown) {
      const gelesen = securityFehlerAusUnbekannt(err);
      setMsg({
        type: "error",
        text: securityFehlerEinordnen({
          vorgang: "verify",
          meldung: gelesen.meldung,
          code: gelesen.code,
          status: gelesen.status,
        }).text,
      });
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titelId}
      aria-describedby={beschreibungId}
      onKeyDown={(ereignis) => {
        if (ereignis.key === 'Escape') {
          ereignis.preventDefault();
          return;
        }
        if (ereignis.key !== 'Tab') return;
        const elemente = fokussierbare();
        if (elemente.length === 0) return;
        const erstes = elemente[0];
        const letztes = elemente[elemente.length - 1];
        if (ereignis.shiftKey && document.activeElement === erstes) {
          ereignis.preventDefault();
          letztes.focus();
        } else if (!ereignis.shiftKey && document.activeElement === letztes) {
          ereignis.preventDefault();
          erstes.focus();
        }
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader withDivider>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" aria-hidden="true" />
            <CardTitle as="h2" id={titelId}>Bestätige deinen TOTP-Code</CardTitle>
          </div>
          <CardDescription id={beschreibungId}>
            Öffne deine Authenticator-App und gib den 6-stelligen Code ein.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Label htmlFor="mfa-totp">6-stelliger Code</Label>
              <Input
                id="mfa-totp"
                ref={codeRef}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                aria-invalid={msg?.type === "error" || (code.length > 0 && code.length !== 6) ? true : undefined}
                aria-describedby={msg?.type === "error" ? fehlerId : beschreibungId}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-11 min-h-11 max-w-[160px] text-center tracking-widest text-lg"
              />
              <Button type="submit" disabled={busy || code.length !== 6} className="min-h-11">
                Bestätigen
              </Button>
            </div>

            {msg && (
              <div
                id={fehlerId}
                role={msg.type === "error" ? "alert" : "status"}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  msg.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                )}
              >
                {msg.type === "success" ? <CheckCircle2 className="inline-block mr-1 h-4 w-4" /> : <AlertTriangle className="inline-block mr-1 h-4 w-4" />}
                {msg.text}
              </div>
            )}

            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={onClose} className="min-h-11">
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

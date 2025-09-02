// components/auth/MFATotpDialog.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
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
  onVerified?: () => void; // z.B. redirect
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

  React.useEffect(() => {
    if (!open) {
      setCode("");
      setMsg(null);
      setBusy(false);
    }
  }, [open]);

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.length !== 6) {
      setMsg({ type: "error", text: "Bitte 6-stelligen Code eingeben." });
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const anyAuth = supabase.auth as any;
      if (!anyAuth?.mfa?.verify) throw new Error("Supabase MFA API nicht verfügbar (verify).");

      const { error } = await anyAuth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) throw error;

      setMsg({ type: "success", text: "MFA erfolgreich bestätigt." });
      onVerified?.();
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message ?? "Verifizierung fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-md">
        <CardHeader withDivider>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle as="h2">Bestätige deinen TOTP-Code</CardTitle>
          </div>
          <CardDescription>
            Öffne deine Authenticator-App und gib den 6-stelligen Code ein.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="mfa-totp" srOnly>6-stelliger Code</Label>
              <Input
                id="mfa-totp"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                aria-invalid={code.length > 0 && code.length !== 6 ? true : undefined}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-10 max-w-[160px] text-center tracking-widest text-lg"
              />
              <Button type="submit" disabled={busy || code.length !== 6}>
                Bestätigen
              </Button>
            </div>

            {msg && (
              <div
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
              <Button type="button" variant="ghost" onClick={onClose}>
                Abbrechen
              </Button>
              {/* Optional: "Anderen Faktor verwenden" o. Ä. */}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

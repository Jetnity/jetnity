// components/account/SecurityMfaStepUp.tsx
// AP-5-S4: Step-up-Dialog für verified-factor Unenroll.
// Keine Factor-/Challenge-/Session-IDs, kein OTP in Status oder URL.

"use client";

import * as React from "react";
import type { UiSprache } from "@/lib/localization/ui-sprache";
import { sicherheitText } from "@/lib/localization/account-security-texte";
import { sicherheitStepUpStatus } from "@/lib/localization/account-security-display-3";
import { AlertTriangle, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  mfaStepUpIstBeschaeftigt,
  type MfaStepUpZustand,
} from "@/lib/auth/account-mfa-step-up";

export default function SecurityMfaStepUp({
  zustand,
  sprache = "de",
  onBestaetigen,
  onAbbrechen,
}: {
  zustand: MfaStepUpZustand;
  sprache?: UiSprache;
  onBestaetigen: (code: string) => void;
  onAbbrechen: () => void;
}) {
  const [code, setCode] = React.useState("");
  const beschaeftigt = mfaStepUpIstBeschaeftigt(zustand);
  const status = sicherheitStepUpStatus(sprache, zustand);
  const titelId = "account-mfa-step-up-titel";
  const beschreibungId = "account-mfa-step-up-beschreibung";
  const statusId = "account-mfa-step-up-status";
  const codeRef = React.useRef<HTMLInputElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  function fokussierbare(): HTMLElement[] {
    if (!dialogRef.current) return [];
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  React.useLayoutEffect(() => {
    codeRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (zustand.lage === "error") codeRef.current?.focus();
  }, [zustand.lage]);

  function senden(ereignis?: React.FormEvent) {
    ereignis?.preventDefault();
    if (beschaeftigt) return;
    const wert = code.replace(/\D/g, "").slice(0, 6);
    onBestaetigen(wert);
    setCode("");
  }

  return (
    <div
      ref={dialogRef}
      lang={sprache}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titelId}
      aria-describedby={beschreibungId}
      aria-busy={beschaeftigt || undefined}
      data-mfa-step-up-lage={zustand.lage}
      data-mfa-step-up-phase={zustand.phase}
      onKeyDown={(ereignis) => {
        if (ereignis.key === "Escape") {
          ereignis.preventDefault();
          if (!beschaeftigt) onAbbrechen();
          return;
        }
        if (ereignis.key !== "Tab") return;
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
            <Shield className="h-5 w-5" aria-hidden="true" />
            <CardTitle as="h2" id={titelId}>
              {sicherheitText(sprache, "step.title")}
            </CardTitle>
          </div>
          <CardDescription id={beschreibungId}>{sicherheitText(sprache, "step.description")}</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={senden} className="space-y-4" autoComplete="off">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Label htmlFor="account-mfa-step-up-code">{sicherheitText(sprache, "common.code")}</Label>
              <Input
                id="account-mfa-step-up-code"
                ref={codeRef}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                disabled={beschaeftigt}
                aria-invalid={zustand.lage === "error" || (code.length > 0 && code.length !== 6) ? true : undefined}
                aria-describedby={statusId}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-11 min-h-11 max-w-[160px] text-center tracking-widest text-lg"
              />
              <Button type="submit" disabled={beschaeftigt || code.length !== 6} className="min-h-11">
                {beschaeftigt ? sicherheitText(sprache, "common.wait") : sicherheitText(sprache, "common.confirm")}
              </Button>
            </div>

            <div
              id={statusId}
              role={zustand.lage === "error" || zustand.lage === "unavailable" ? "alert" : "status"}
              aria-live={zustand.lage === "error" || zustand.lage === "unavailable" ? "assertive" : "polite"}
              className={cn(
                "rounded-lg border p-3 text-sm",
                zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-black/5 bg-muted/30 text-ink-700",
              )}
            >
              <span className="inline-flex items-start gap-2">
                {zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                ) : null}
                <span>{status}</span>
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              disabled={beschaeftigt}
              onClick={onAbbrechen}
            >
              {sicherheitText(sprache, "common.cancel")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

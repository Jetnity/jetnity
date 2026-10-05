// components/account/SecurityLogout.tsx
// AP-5-S3: ehrliche Logout-Scopes. Keine Sessionliste. Kein JWT-Kill-Claim.

"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, LogOut } from "lucide-react";

import { accountLogoutScopeAction } from "@/app/account/security/logout-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SICHERHEIT_ZIEL_44 } from "@/lib/auth/account-security-premium-ux-1";
import {
  LOGOUT_AKTIONEN,
  LOGOUT_ANFANG,
  LOGOUT_JWT_HINWEIS,
  LOGOUT_SCOPES,
  darfLogoutStarten,
  logoutErfolgBehaupten,
  logoutIstBeschaeftigt,
  logoutSollLokalenAuthVerlassen,
  logoutStatusText,
  logoutWeiter,
  type LogoutScope,
  type LogoutZustand,
} from "@/lib/auth/account-logout-scopes";

function lokalenAuthVerlassen() {
  window.location.assign(new URL("/", window.location.origin).toString());
}

export default function SecurityLogout() {
  const [zustand, setZustand] = React.useState<LogoutZustand>(LOGOUT_ANFANG);
  const statusFeld = React.useRef<HTMLDivElement>(null);
  const [optionenOffen, setOptionenOffen] = React.useState(false);
  const beschaeftigt = logoutIstBeschaeftigt(zustand);
  const startbar = darfLogoutStarten(zustand);
  const status = logoutStatusText(zustand);
  const optionenSichtbar = optionenOffen || zustand.lage !== "idle" || zustand.bestaetigungFuer !== null;

  function optionenSchliessen() {
    if (zustand.lage !== "idle" || zustand.bestaetigungFuer !== null) return;
    setOptionenOffen(false);
  }

  React.useEffect(() => {
    if (zustand.lage === "success" || zustand.lage === "error" || zustand.lage === "unavailable") {
      statusFeld.current?.focus();
    }
  }, [zustand.lage]);

  React.useEffect(() => {
    if (logoutSollLokalenAuthVerlassen(zustand)) {
      lokalenAuthVerlassen();
    }
  }, [zustand]);

  async function ausfuehren(scope: LogoutScope) {
    if (!darfLogoutStarten(zustand)) return;
    if (scope === "global" && zustand.bestaetigungFuer !== "global") {
      setZustand((aktuell) => logoutWeiter(aktuell, { typ: "verlange_bestaetigung", scope: "global" }));
      return;
    }

    setZustand((aktuell) => logoutWeiter(aktuell, { typ: "starte", scope }));
    const ereignis = await accountLogoutScopeAction(scope);
    setZustand((aktuell) => logoutWeiter(aktuell, ereignis));
  }

  return (
    <Card id="account-abmelden" data-logout-lage={zustand.lage} data-logout-scope={zustand.scope ?? ""} className="scroll-mt-24">
      <CardHeader withDivider className="p-4">
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <CardTitle as="h2">Abmelden</CardTitle>
        </div>
        <CardDescription>
          Beende diese Sitzung, andere Sitzungen oder alle Sitzungen. Jetnity kann andere Geräte
          nicht auflisten. {LOGOUT_JWT_HINWEIS}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-3">
        <div
          ref={statusFeld}
          tabIndex={-1}
          role={zustand.lage === "error" || zustand.lage === "unavailable" ? "alert" : "status"}
          aria-live={zustand.lage === "error" || zustand.lage === "unavailable" ? "assertive" : "polite"}
          className={cn(
            "text-sm outline-none",
            optionenSichtbar
              ? cn(
                  "rounded-xl border p-3",
                  zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : zustand.lage === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-black/5 bg-muted/30 text-ink-700",
                )
              : "sr-only",
          )}
        >
          <span className="inline-flex items-start gap-2">
            {logoutErfolgBehaupten(zustand) ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
            ) : zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
            ) : null}
            <span>{status}</span>
          </span>
        </div>

        {optionenSichtbar ? null : (
          <Button
            type="button"
            variant="outline"
            className={`${SICHERHEIT_ZIEL_44} min-h-11 w-full sm:w-auto`}
            aria-expanded={false}
            aria-controls="account-logout-optionen"
            onClick={() => setOptionenOffen(true)}
          >
            Abmeldeoptionen
          </Button>
        )}

        {zustand.bestaetigungFuer === "global" ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4"
            role="group"
            aria-labelledby="account-logout-global-confirm-title"
          >
            <p id="account-logout-global-confirm-title" className="text-sm font-medium text-red-900">
              Überall abmelden wirklich ausführen?
            </p>
            <p className="mt-1 text-sm leading-6 text-red-800">
              Damit endet auch diese Sitzung. Andere Geräte werden nicht einzeln angezeigt.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="destructive"
                className={`${SICHERHEIT_ZIEL_44} min-h-11 w-full sm:w-auto`}
                onClick={() => void ausfuehren("global")}
                disabled={beschaeftigt}
              >
                Ja, überall abmelden
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={`${SICHERHEIT_ZIEL_44} min-h-11 w-full sm:w-auto`}
                onClick={() => setZustand((aktuell) => logoutWeiter(aktuell, { typ: "brich_bestaetigung" }))}
                disabled={beschaeftigt}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : null}

        {optionenSichtbar ? (
        <ul id="account-logout-optionen" className="space-y-3">
          {LOGOUT_SCOPES.map((scope) => {
            const aktion = LOGOUT_AKTIONEN[scope];
            const hinweisId = `account-logout-${scope}-hint`;
            const aktiv = zustand.lage === "working" && zustand.scope === scope;
            return (
              <li
                key={scope}
                className={cn(
                  "rounded-2xl border p-4",
                  scope === "local" && "border-brand-800/20 bg-white",
                  scope === "others" && "border-black/5 bg-surface-50",
                  aktion.gefaehrlich && "border-red-200 bg-red-50/70",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">
                  {scope === "local" ? "Diese Sitzung" : scope === "others" ? "Andere Sitzungen" : "Hohes Risiko"}
                </p>
                <p className="mt-1 text-sm font-medium text-brand-800">{aktion.label}</p>
                <p id={hinweisId} className="mt-1 text-sm leading-6 text-ink-700">
                  {aktion.beschreibung}
                </p>
                <Button
                  type="button"
                  variant={aktion.gefaehrlich ? "destructive" : "outline"}
                  className={`${SICHERHEIT_ZIEL_44} mt-3 min-h-11 w-full sm:w-auto`}
                  onClick={() => void ausfuehren(scope)}
                  disabled={beschaeftigt || !startbar}
                  aria-describedby={hinweisId}
                  data-logout-action={scope}
                >
                  {aktiv ? "Wird ausgeführt…" : aktion.label}
                </Button>
              </li>
            );
          })}
        </ul>
        ) : null}
        {optionenSichtbar && zustand.lage === "idle" && zustand.bestaetigungFuer === null ? (
          <Button
            type="button"
            variant="ghost"
            className={`${SICHERHEIT_ZIEL_44} min-h-11 w-full sm:w-auto`}
            aria-expanded={true}
            aria-controls="account-logout-optionen"
            onClick={optionenSchliessen}
          >
            Optionen schließen
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

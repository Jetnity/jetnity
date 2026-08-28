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
  window.location.assign("/");
}

export default function SecurityLogout() {
  const [zustand, setZustand] = React.useState<LogoutZustand>(LOGOUT_ANFANG);
  const statusFeld = React.useRef<HTMLDivElement>(null);
  const beschaeftigt = logoutIstBeschaeftigt(zustand);
  const startbar = darfLogoutStarten(zustand);
  const status = logoutStatusText(zustand);

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
    <Card data-logout-lage={zustand.lage} data-logout-scope={zustand.scope ?? ""}>
      <CardHeader withDivider>
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <CardTitle as="h2">Abmelden</CardTitle>
        </div>
        <CardDescription>
          Beende diese Sitzung, andere Sitzungen oder alle Sitzungen. Jetnity kann andere Geräte
          nicht auflisten. {LOGOUT_JWT_HINWEIS}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div
          ref={statusFeld}
          tabIndex={-1}
          role={zustand.lage === "error" || zustand.lage === "unavailable" ? "alert" : "status"}
          aria-live={zustand.lage === "error" || zustand.lage === "unavailable" ? "assertive" : "polite"}
          className={cn(
            "rounded-xl border p-3 text-sm outline-none",
            zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable"
              ? "border-red-200 bg-red-50 text-red-800"
              : zustand.lage === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-black/5 bg-muted/30 text-ink-700",
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
                className="min-h-11 w-full sm:w-auto"
                onClick={() => void ausfuehren("global")}
                disabled={beschaeftigt}
              >
                Ja, überall abmelden
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setZustand((aktuell) => logoutWeiter(aktuell, { typ: "brich_bestaetigung" }))}
                disabled={beschaeftigt}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : null}

        <ul className="space-y-3">
          {LOGOUT_SCOPES.map((scope) => {
            const aktion = LOGOUT_AKTIONEN[scope];
            const hinweisId = `account-logout-${scope}-hint`;
            const aktiv = zustand.lage === "working" && zustand.scope === scope;
            return (
              <li
                key={scope}
                className={cn(
                  "rounded-2xl border p-4",
                  aktion.gefaehrlich ? "border-red-200 bg-red-50/60" : "border-black/5 bg-white",
                )}
              >
                <p className="text-sm font-medium text-brand-800">{aktion.label}</p>
                <p id={hinweisId} className="mt-1 text-sm leading-6 text-ink-700">
                  {aktion.beschreibung}
                </p>
                <Button
                  type="button"
                  variant={aktion.gefaehrlich ? "destructive" : "outline"}
                  className="mt-3 min-h-11 w-full sm:w-auto"
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
      </CardContent>
    </Card>
  );
}

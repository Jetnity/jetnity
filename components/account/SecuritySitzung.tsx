// components/account/SecuritySitzung.tsx
// AP-5-S5: ehrliche aktuelle Sitzung. Andere Sitzungen bleiben unsupported.

"use client";

import * as React from "react";
import { AlertTriangle, MonitorSmartphone } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SICHERHEIT_ZIEL_44 } from "@/lib/auth/account-security-premium-ux-1";
import {
  ANDERE_SITZUNGEN_TEXT,
  SITZUNG_ABMELDEN_ANKER,
  SITZUNG_ANFANG,
  aktuelleSitzungLesen,
  sitzungAalText,
  sitzungIstBeschaeftigt,
  sitzungStatusText,
  sitzungWeiter,
  sitzungZugangscodeText,
  type SitzungZustand,
} from "@/lib/auth/account-session-view";

function navigatorHinweis(): { userAgentData?: { brands?: Array<{ brand?: string; version?: string }>; platform?: string }; userAgent?: string } {
  if (typeof navigator === "undefined") return {};
  const uaData = (
    navigator as Navigator & {
      userAgentData?: { brands?: Array<{ brand?: string; version?: string }>; platform?: string };
    }
  ).userAgentData;
  return {
    userAgentData: uaData
      ? { brands: uaData.brands, platform: uaData.platform }
      : undefined,
    userAgent: typeof navigator.userAgent === "string" ? navigator.userAgent : undefined,
  };
}

export default function SecuritySitzung() {
  const [zustand, setZustand] = React.useState<SitzungZustand>(SITZUNG_ANFANG);
  const statusFeld = React.useRef<HTMLDivElement>(null);
  const beschaeftigt = sitzungIstBeschaeftigt(zustand);
  const status = sitzungStatusText(zustand);
  const aalText = zustand.aktuelle ? sitzungAalText(zustand.aktuelle.aal) : null;
  const zugangscodeText = zustand.aktuelle
    ? sitzungZugangscodeText(zustand.aktuelle.zugangscodeBisUnix)
    : null;

  React.useEffect(() => {
    let aktiv = true;

    void (async () => {
      const supabase = createBrowserClient();
      const ergebnis = await aktuelleSitzungLesen(
        {
          getUser: () => supabase.auth.getUser(),
          getSession: async () => {
            const { data, error } = await supabase.auth.getSession();
            return {
              data: {
                session: data.session ? { expires_at: data.session.expires_at ?? null } : null,
              },
              error,
            };
          },
          mfa: {
            getAuthenticatorAssuranceLevel: () => supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          },
        },
        navigatorHinweis(),
      );
      if (!aktiv) return;
      setZustand((aktuell) => sitzungWeiter(aktuell, { typ: "gelesen", ergebnis }));
    })();

    return () => {
      aktiv = false;
    };
  }, []);

  React.useEffect(() => {
    if (zustand.lage === "error" || zustand.lage === "unavailable" || zustand.lage === "unsupported") {
      statusFeld.current?.focus();
    }
  }, [zustand.lage]);

  return (
    <Card
      id="account-sitzung"
      data-sitzung-lage={zustand.lage}
      data-andere-sitzungen={zustand.andere}
      className="scroll-mt-24"
    >
      <CardHeader withDivider className="p-4">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
          <CardTitle as="h2">Diese Sitzung</CardTitle>
        </div>
        <CardDescription>
          Jetnity zeigt nur die aktuelle Sitzung mit vorhandenen, datensparsamen Angaben. Eine
          vollständige Geräteliste liefert die vorhandene Anmeldung nicht.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-3">
        <div
          ref={statusFeld}
          tabIndex={-1}
          role={zustand.lage === "error" || zustand.lage === "unavailable" ? "alert" : "status"}
          aria-live={zustand.lage === "error" || zustand.lage === "unavailable" ? "assertive" : "polite"}
          aria-busy={beschaeftigt}
          className={cn(
            "text-sm outline-none",
            zustand.lage === "current"
              ? "sr-only"
              : cn(
                  "rounded-xl border p-3",
                  zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-black/5 bg-muted/30 text-ink-700",
                ),
          )}
        >
          <span className="inline-flex items-start gap-2">
            {zustand.lage === "error" || zustand.lage === "unsupported" || zustand.lage === "unavailable" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
            ) : null}
            <span>{status}</span>
          </span>
        </div>

        {zustand.lage === "current" && zustand.aktuelle ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-brand-800">Aktuelle Sitzung</dt>
              <dd className="mt-1 text-sm leading-6 text-ink-700">Aktiv in diesem Browser.</dd>
            </div>
            {aalText ? (
              <div>
                <dt className="text-sm font-medium text-brand-800">Anmeldestufe</dt>
                <dd className="mt-1 text-sm leading-6 text-ink-700">{aalText}</dd>
              </div>
            ) : null}
            {zugangscodeText ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-brand-800">Zugangscode</dt>
                <dd className="mt-1 text-sm leading-6 text-ink-700">{zugangscodeText}</dd>
              </div>
            ) : null}
            {zustand.lokal ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-brand-800">Lokaler Hinweis</dt>
                <dd className="mt-1 text-sm leading-6 text-ink-700">{zustand.lokal.text}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <section aria-labelledby="account-andere-sitzungen-title">
          <h3 id="account-andere-sitzungen-title" className="text-sm font-medium text-brand-800">
            Andere Sitzungen
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-700">{ANDERE_SITZUNGEN_TEXT}</p>
          <a
            href={`#${SITZUNG_ABMELDEN_ANKER}`}
            className={`${SICHERHEIT_ZIEL_44} mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15`}
          >
            Zur Aktion „Andere Geräte abmelden“
          </a>
        </section>
      </CardContent>
    </Card>
  );
}

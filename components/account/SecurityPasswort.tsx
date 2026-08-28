// components/account/SecurityPasswort.tsx
// AP-5-S2: eingeloggte Passwortänderung. Recovery bleibt getrennt.

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
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PASSWORT_AENDERUNG_ANFANG,
  darfAenderungSenden,
  darfPasswortFormularZeigen,
  darfReauthStarten,
  passwortAenderungErfolgBehaupten,
  passwortAenderungIstBeschaeftigt,
  passwortAenderungLokalPruefen,
  passwortAenderungReauthAusfuehren,
  passwortAenderungSitzungLesen,
  passwortAenderungStatusText,
  passwortAenderungUpdateAusfuehren,
  passwortAenderungWeiter,
  type PasswortAenderungAuth,
  type PasswortAenderungZustand,
} from "@/lib/auth/account-password-aenderung";
import {
  PASSWORT_RICHTLINIE,
  RICHTLINIE_PUNKTE,
  erfuelltRichtlinie,
  passwortStaerke,
  staerkeFarbe,
  staerkeText,
} from "@/lib/auth/passwort-richtlinie";

type BrowserSupabase = SbClient<Database>;

function authVonClient(client: BrowserSupabase): PasswortAenderungAuth {
  return {
    getUser: () => client.auth.getUser(),
    reauthenticate:
      typeof client.auth.reauthenticate === "function"
        ? () => client.auth.reauthenticate()
        : undefined,
    updateUser: (eingabe) => client.auth.updateUser({ password: eingabe.password, nonce: eingabe.nonce }),
  };
}

function leereFelder() {
  return { nonce: "", passwort: "", wiederholung: "" };
}

export default function SecurityPasswort() {
  const supabase = React.useMemo<BrowserSupabase>(() => createBrowserClient(), []);
  const [zustand, setZustand] = React.useState<PasswortAenderungZustand>(PASSWORT_AENDERUNG_ANFANG);
  const [felder, setFelder] = React.useState(leereFelder);
  const [zeigePasswort, setZeigePasswort] = React.useState(false);
  const [zeigeWiederholung, setZeigeWiederholung] = React.useState(false);
  const nonceFeld = React.useRef<HTMLInputElement>(null);
  const statusFeld = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let aktiv = true;
    void (async () => {
      const ereignis = await passwortAenderungSitzungLesen(authVonClient(supabase));
      if (!aktiv) return;
      setZustand((aktuell) => passwortAenderungWeiter(aktuell, ereignis));
    })();
    return () => {
      aktiv = false;
    };
  }, [supabase]);

  React.useEffect(() => {
    if (zustand.schritt === "code_sent") {
      nonceFeld.current?.focus();
    }
    if (zustand.schritt === "success" || zustand.schritt === "error") {
      statusFeld.current?.focus();
    }
  }, [zustand.schritt]);

  const beschaeftigt = passwortAenderungIstBeschaeftigt(zustand);
  const formularSichtbar = darfPasswortFormularZeigen(zustand);
  const status = passwortAenderungStatusText(zustand);
  const staerke = passwortStaerke(felder.passwort);

  async function codeAnfordern() {
    if (!darfReauthStarten(zustand)) return;
    setZustand((aktuell) => passwortAenderungWeiter(aktuell, { typ: "starte_reauth" }));
    const ereignis = await passwortAenderungReauthAusfuehren(authVonClient(supabase));
    setZustand((aktuell) => passwortAenderungWeiter(aktuell, ereignis));
  }

  async function passwortSpeichern(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    if (!darfAenderungSenden(zustand)) return;
    setZustand((aktuell) => passwortAenderungWeiter(aktuell, { typ: "starte_pruefung" }));
    const lokal = passwortAenderungLokalPruefen(felder);
    if (lokal) {
      setZustand((aktuell) =>
        passwortAenderungWeiter(aktuell, { typ: "pruefung_fehler", fehler: lokal }),
      );
      return;
    }
    setZustand((aktuell) => passwortAenderungWeiter(aktuell, { typ: "starte_update" }));
    const ergebnis = await passwortAenderungUpdateAusfuehren(authVonClient(supabase), {
      passwort: felder.passwort,
      nonce: felder.nonce,
    });
    if (ergebnis.typ === "update_ok") {
      setFelder(leereFelder());
      setZeigePasswort(false);
      setZeigeWiederholung(false);
    }
    setZustand((aktuell) => passwortAenderungWeiter(aktuell, ergebnis));
  }

  function abbrechen() {
    setFelder(leereFelder());
    setZeigePasswort(false);
    setZeigeWiederholung(false);
    setZustand((aktuell) => passwortAenderungWeiter(aktuell, { typ: "abbrechen" }));
  }

  return (
    <Card data-password-lage={zustand.schritt}>
      <CardHeader withDivider>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" aria-hidden="true" />
          <CardTitle as="h2">Passwort</CardTitle>
        </div>
        <CardDescription>
          Zum Ändern bestätigt Jetnity zuerst deine aktuelle Anmeldung per E-Mail-Code. Das
          bisherige Passwort wird nicht abgefragt.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div
          ref={statusFeld}
          tabIndex={-1}
          role={zustand.schritt === "error" ? "alert" : "status"}
          aria-live={zustand.schritt === "error" ? "assertive" : "polite"}
          className={cn(
            "rounded-xl border p-3 text-sm outline-none",
            zustand.schritt === "error" || zustand.schritt === "unsupported" || zustand.schritt === "unavailable"
              ? "border-red-200 bg-red-50 text-red-800"
              : zustand.schritt === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-black/5 bg-muted/30 text-ink-700",
          )}
        >
          <span className="inline-flex items-start gap-2">
            {passwortAenderungErfolgBehaupten(zustand) ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
            ) : zustand.schritt === "error" || zustand.schritt === "unsupported" || zustand.schritt === "unavailable" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
            ) : null}
            <span>{status}</span>
          </span>
        </div>

        {darfReauthStarten(zustand) || zustand.schritt === "requesting_code" ? (
          <Button
            type="button"
            onClick={() => void codeAnfordern()}
            disabled={beschaeftigt || !darfReauthStarten(zustand)}
            className="min-h-11 w-full"
          >
            {zustand.schritt === "requesting_code" ? "Code wird gesendet…" : "Bestätigungscode senden"}
          </Button>
        ) : null}

        {formularSichtbar ? (
          <form onSubmit={(ereignis) => void passwortSpeichern(ereignis)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-password-nonce">Bestätigungscode</Label>
              <p id="account-password-nonce-hint" className="text-xs leading-5 text-ink-700">
                Der Code kommt an die E-Mail-Adresse dieses Kontos. Er ist nicht der
                Passwort-Reset-Link.
              </p>
              <Input
                ref={nonceFeld}
                id="account-password-nonce"
                inputMode="text"
                autoComplete="one-time-code"
                spellCheck={false}
                value={felder.nonce}
                onChange={(e) => setFelder((aktuell) => ({ ...aktuell, nonce: e.target.value }))}
                disabled={beschaeftigt}
                aria-describedby="account-password-nonce-hint"
                aria-invalid={zustand.fehler?.code.startsWith("nonce_") ? true : undefined}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-password-new" icon={<Lock className="h-4 w-4" />}>
                Neues Passwort
              </Label>
              <div className="relative">
                <Input
                  id="account-password-new"
                  type={zeigePasswort ? "text" : "password"}
                  value={felder.passwort}
                  onChange={(e) => setFelder((aktuell) => ({ ...aktuell, passwort: e.target.value }))}
                  disabled={beschaeftigt}
                  autoComplete="new-password"
                  placeholder={`Mind. ${PASSWORT_RICHTLINIE.mindestlaenge} Zeichen`}
                  aria-describedby="account-password-new-hint"
                  aria-invalid={
                    felder.passwort.length > 0 && !erfuelltRichtlinie(felder.passwort) ? true : undefined
                  }
                  className="min-h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setZeigePasswort((wert) => !wert)}
                  aria-label={zeigePasswort ? "Neues Passwort verbergen" : "Neues Passwort anzeigen"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {zeigePasswort ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div id="account-password-new-hint" className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className={cn("h-2 rounded-full transition-all", staerkeFarbe(staerke))}
                    style={{ width: `${(staerke / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{staerkeText(staerke)}</p>
                <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                  {RICHTLINIE_PUNKTE.map((punkt) => (
                    <li key={punkt}>• {punkt}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-password-confirm">Neues Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="account-password-confirm"
                  type={zeigeWiederholung ? "text" : "password"}
                  value={felder.wiederholung}
                  onChange={(e) =>
                    setFelder((aktuell) => ({ ...aktuell, wiederholung: e.target.value }))
                  }
                  disabled={beschaeftigt}
                  autoComplete="new-password"
                  aria-invalid={
                    felder.wiederholung.length > 0 && felder.wiederholung !== felder.passwort
                      ? true
                      : undefined
                  }
                  className="min-h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setZeigeWiederholung((wert) => !wert)}
                  aria-label={
                    zeigeWiederholung
                      ? "Passwortbestätigung verbergen"
                      : "Passwortbestätigung anzeigen"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {zeigeWiederholung ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={beschaeftigt} className="min-h-11 flex-1">
                {zustand.schritt === "updating" ? "Passwort wird geändert…" : "Passwort speichern"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={abbrechen}
                disabled={beschaeftigt}
                className="min-h-11"
              >
                Abbrechen
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

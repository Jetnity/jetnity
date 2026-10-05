// app/auth/update-password/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PASSWORT_RICHTLINIE,
  RICHTLINIE_PUNKTE,
  RICHTLINIE_TEXT,
  erfuelltRichtlinie,
  passwortAblehnung,
  passwortStaerke,
  staerkeFarbe,
  staerkeText,
} from '@/lib/auth/passwort-richtlinie';
import { cn } from '@/lib/utils';
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

// ⛔️ Wichtig: In Client Components KEIN `export const metadata`!
//
// Die Passwortregel stand hier eigenständig und milder als die des
// Auth-Servers: acht Zeichen, Gruppen nur „empfohlen". Wer sich daran hielt,
// bekam nach dem Absenden eine englische Ablehnung zu sehen, die zur
// angezeigten Liste nicht passte. Beides kommt jetzt aus
// lib/auth/passwort-richtlinie.ts, derselben Quelle wie in der Registrierung.

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [hasSession, setHasSession] = React.useState(false);

  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data.session));
      setChecking(false);
    };
    init();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setOkMsg(null);

    if (!erfuelltRichtlinie(pw)) {
      setErrorMsg(RICHTLINIE_TEXT);
      return;
    }
    if (pw !== pw2) {
      setErrorMsg('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setErrorMsg(passwortAblehnung(error.message) ?? error.message ?? 'Aktualisierung fehlgeschlagen.');
        setLoading(false);
        return;
      }
      setOkMsg('Passwort erfolgreich aktualisiert.');
      setTimeout(() => router.replace('/reisen'), 600);
    } catch (err: any) {
      setErrorMsg(passwortAblehnung(err?.message) ?? err?.message ?? 'Aktualisierung fehlgeschlagen.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Laden" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="max-w-md mx-auto text-center space-y-3 py-10">
        <AlertCircle className="h-6 w-6 mx-auto text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Session erforderlich</h1>
        <p className="text-sm text-muted-foreground">
          Bitte fordere zuerst einen Passwort-Reset per E-Mail an und öffne dann den Link auf dieser Seite.
        </p>
      </div>
    );
  }

  const s = passwortStaerke(pw);
  const pct = (s / 5) * 100;

  return (
    <div className="w-full max-w-md mx-auto py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Neues Passwort setzen</h1>
        <p className="text-sm text-muted-foreground">
          Du bist angemeldet – wähle jetzt ein neues, sicheres Passwort.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="pw" icon={<Lock className="h-4 w-4" />}>
            Neues Passwort
          </Label>
          <div className="relative">
            <Input
              id="pw"
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={`Mind. ${PASSWORT_RICHTLINIE.mindestlaenge} Zeichen`}
              autoFocus
              className="pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Simple Strength Meter */}
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
              <div
                className={cn('h-2 rounded-full transition-all', staerkeFarbe(s))}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{staerkeText(s)}</p>
            <ul className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
              {RICHTLINIE_PUNKTE.map((punkt) => (
                <li key={punkt}>• {punkt}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pw2">Passwort bestätigen</Label>
          <div className="relative">
            <Input
              id="pw2"
              type={showPw2 ? 'text' : 'password'}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Wiederholen"
              className="pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw2((v) => !v)}
              aria-label={showPw2 ? 'Passwort verbergen' : 'Passwort anzeigen'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <p>{errorMsg}</p>
          </div>
        )}
        {okMsg && (
          <div
            className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <p>{okMsg}</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern…
            </>
          ) : (
            'Passwort speichern'
          )}
        </Button>
      </form>
    </div>
  );
}

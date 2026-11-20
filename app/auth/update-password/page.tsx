// app/auth/update-password/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hinweis } from '@/components/ui/hinweis';
import { Label } from '@/components/ui/label';
import { Statuskarte, statusAktionHaupt, statusFussLink } from '@/components/ui/statuskarte';
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
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <Statuskarte symbol={Loader2} ton="laedt" titel="Link wird geprüft">
        <p role="status">Einen Moment, bitte.</p>
      </Statuskarte>
    );
  }

  if (!hasSession) {
    return (
      <Statuskarte
        symbol={AlertCircle}
        ton="fehler"
        titel="Link aus der E-Mail öffnen"
        aktionen={
          <Link href="/login" className={statusAktionHaupt}>
            Zur Anmeldung
          </Link>
        }
        fuss={
          <Link href="/" className={statusFussLink}>
            Zur Startseite
          </Link>
        }
      >
        <p>
          Ein neues Passwort setzt du über den Link in unserer E-Mail. Fordere ihn bei der Anmeldung
          unter «Passwort vergessen?» an und öffne ihn dann.
        </p>
      </Statuskarte>
    );
  }

  const s = passwortStaerke(pw);
  const pct = (s / 5) * 100;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Neues Passwort setzen</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Du bist angemeldet – wähle jetzt ein neues, sicheres Passwort.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="pw" icon={<Lock className="h-4 w-4" />}>
            Neues Passwort
          </Label>
          <Input
            id="pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={`Mind. ${PASSWORT_RICHTLINIE.mindestlaenge} Zeichen`}
            autoFocus
            autoComplete="new-password"
          />

          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className={cn('h-2 rounded-full transition-all', staerkeFarbe(s))}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-meta text-muted-foreground" aria-live="polite">{staerkeText(s)}</p>
            <ul className="mt-1 space-y-0.5 text-meta text-muted-foreground">
              {RICHTLINIE_PUNKTE.map((punkt) => (
                <li key={punkt}>• {punkt}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pw2">Passwort bestätigen</Label>
          <Input
            id="pw2"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Wiederholen"
            autoComplete="new-password"
          />
        </div>

        {errorMsg && (
          <Hinweis ton="dringend" role="alert">
            <p>{errorMsg}</p>
          </Hinweis>
        )}
        {okMsg && (
          <div
            className="flex items-start gap-3 rounded-card border border-primary/40 bg-card px-4 py-3 text-meta text-foreground"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>{okMsg}</p>
          </div>
        )}

        <Button type="submit" isLoading={loading} loadingText="Speichern…" className="w-full">
          Passwort speichern
        </Button>
      </form>
    </div>
  );
}

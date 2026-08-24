// components/auth/LoginForm.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { erstesFehlerfeld, feldfehlerLoeschen, type Feldfehler } from '@/lib/formular/feldfehler';
import { feldInSichtNehmen } from '@/lib/formular/sicht';
import OauthAnbieter from '@/components/auth/OauthAnbieter';
import { MFATotpDialog } from '@/components/auth/MFATotpDialog';
import { getAAL, startTotpChallenge } from '@/lib/auth/mfa';
import { erlaubtesNaechstesZiel } from '@/lib/auth/naechstes-ziel';
import type { OauthAnbieter as OauthName, OauthFreigabe } from '@/lib/auth/oauth-anbieter';
import {
  Mail as MailIcon,
  Lock,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

function normalizeEmail(s: string) {
  return s.trim().toLowerCase();
}

function mapAuthError(message?: string) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'E-Mail oder Passwort ist falsch.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail. Prüfe deinen Posteingang.';
  }
  if (msg.includes('too many') || msg.includes('rate limit')) {
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Netzwerkproblem. Bitte überprüfe deine Verbindung.';
  }
  return message || 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.';
}

export default function LoginForm({
  next = null,
  oauth,
}: {
  next?: string | null
  oauth: OauthFreigabe
}) {
  const router = useRouter();
  const nachErfolg = erlaubtesNaechstesZiel(next);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [capsLock, setCapsLock] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [feldfehler, setFeldfehler] = React.useState<Feldfehler<'email' | 'password'>>({});
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState<null | OauthName>(null);

  // MFA Dialog State
  const [mfaOpen, setMfaOpen] = React.useState(false);
  const [factorId, setFactorId] = React.useState('');
  const [challengeId, setChallengeId] = React.useState('');

  // Caps-Lock Erkennung ohne ts-expect-error
  const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      setCapsLock(e.getModifierState('CapsLock'));
    } catch {
      setCapsLock(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const em = normalizeEmail(email);
    const amFeld: Feldfehler<'email' | 'password'> = {
      ...(!em ? { email: 'Bitte gib deine E-Mail ein.' } : {}),
      ...(!password ? { password: 'Bitte gib dein Passwort ein.' } : {}),
    };
    if (amFeld.email || amFeld.password) {
      setFeldfehler(amFeld);
      const erstes = erstesFehlerfeld(amFeld, ['email', 'password']);
      feldInSichtNehmen(erstes === 'password' ? passwordRef.current : emailRef.current);
      return;
    }
    setFeldfehler({});

    setLoading(true);
    try {
      // 1) Passwort-Login
      const { error } = await supabase.auth.signInWithPassword({ email: em, password });
      if (error) {
        setErrorMsg(mapAuthError(error.message));
        return;
      }

      // 2) Prüfen, ob ein Step-Up auf AAL2 (MFA) benötigt wird
      const aal = await getAAL(supabase);
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        // 3) TOTP-Challenge starten und Dialog öffnen
        const { factorId, challengeId } = await startTotpChallenge(supabase);
        setFactorId(factorId);
        setChallengeId(challengeId);
        setMfaOpen(true);
        return; // Warten bis der Dialog verifiziert → onVerified leitet weiter
      }

      // 4) Keine MFA nötig → direkt weiter
      router.replace(nachErfolg);
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    const em = normalizeEmail(email);
    if (!em) {
      setFeldfehler({ email: 'Bitte gib zuerst deine E-Mail ein.' });
      feldInSichtNehmen(emailRef.current);
      return;
    }

    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
      const redirectTo = `${origin}/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });
      if (error) {
        setErrorMsg(mapAuthError(error.message));
        return;
      }
      setInfoMsg('Wenn die E-Mail existiert, wurde ein Reset-Link versendet.');
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message));
    }
  };

  const handleOAuth = async (provider: OauthName) => {
    setErrorMsg(null);
    setInfoMsg(null);
    setOauthLoading(provider);
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nachErfolg)}`,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
        },
      });
      if (error) setErrorMsg(mapAuthError(error.message));
      // Redirect erfolgt durch Supabase
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message));
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Willkommen zurück</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Melde dich an und plane deine Reisen dort weiter, wo du aufgehört hast.
        </p>
      </div>

      <form noValidate onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" icon={<MailIcon className="h-4 w-4" />} invalid={!!feldfehler.email}>
            E-Mail
          </Label>
          <Input
            id="email"
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'email'));
            }}
            error={feldfehler.email}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" icon={<Lock className="h-4 w-4" />} invalid={!!feldfehler.password}>
            Passwort
          </Label>

          <Input
            id="password"
            ref={passwordRef}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'password'));
            }}
            onKeyDown={onPasswordKey}
            onKeyUp={onPasswordKey}
            error={feldfehler.password}
          />

          {capsLock && (
            <div className="flex items-center gap-2 text-amber-600 text-xs">
              <ShieldCheck className="h-4 w-4" />
              Feststelltaste (Caps Lock) ist aktiviert.
            </div>
          )}
        </div>

        {(errorMsg || Object.keys(feldfehler).length > 0) && (
          <div
            className="flex items-start gap-2 rounded-xl border border-danger-600/25 bg-surface-50 p-3 text-sm text-brand-800"
            role="status"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 text-brand-800" />
            <p>{errorMsg ?? 'Bitte prüfe die markierten Angaben.'}</p>
          </div>
        )}

        {infoMsg && (
          <div
            className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
            role="status"
          >
            {infoMsg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="-mx-2 inline-flex min-h-11 items-center px-2 text-sm text-primary underline-offset-2 hover:underline"
          >
            Passwort vergessen?
          </button>

          <Button
            type="submit"
            disabled={loading}
            className="min-w-[8rem]"
            isLoading={loading}
            loadingText="Anmelden…"
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Anmelden
          </Button>
        </div>
      </form>

      <OauthAnbieter freigabe={oauth} loading={oauthLoading} onStart={handleOAuth} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Noch kein Konto?{' '}
        <Link href={`/register?next=${encodeURIComponent(nachErfolg)}`} className="text-primary hover:underline">Konto erstellen</Link>
      </p>

      <p className="mt-4 text-xs text-center text-muted-foreground">
        Mit der Anmeldung stimmst du unseren Richtlinien zu. Datenschutz: DSGVO &amp; CH-DSG konform.
      </p>

      {/* MFA – TOTP Dialog */}
      <MFATotpDialog
        open={mfaOpen}
        onClose={() => setMfaOpen(false)}
        supabase={supabase}
        factorId={factorId}
        challengeId={challengeId}
        onVerified={() => {
          setMfaOpen(false);
          router.replace(nachErfolg);
        }}
      />
    </div>
  );
}

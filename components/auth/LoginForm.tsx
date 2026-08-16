// components/auth/LoginForm.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon, AppleIcon } from '@/components/auth/provider-icons';
import { MFATotpDialog } from '@/components/auth/MFATotpDialog';
import { getAAL, startTotpChallenge } from '@/lib/auth/mfa';
import {
  Mail as MailIcon,
  Lock,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

/** Nach der Anmeldung landen Reisende bei ihren Reisen. */
const AFTER_LOGIN_ROUTE = '/reisen';

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

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [capsLock, setCapsLock] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState<null | 'google' | 'apple'>(null);

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
    if (!em || !password) {
      setErrorMsg('Bitte E-Mail und Passwort ausfüllen.');
      return;
    }

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
      router.replace(AFTER_LOGIN_ROUTE);
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
      setErrorMsg('Bitte gib zuerst deine E-Mail ein.');
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

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setErrorMsg(null);
    setInfoMsg(null);
    setOauthLoading(provider);
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
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

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" icon={<MailIcon className="h-4 w-4" />}>
            E-Mail
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={!!errorMsg}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" icon={<Lock className="h-4 w-4" />}>
            Passwort
          </Label>

          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onPasswordKey}
            onKeyUp={onPasswordKey}
            required
            aria-invalid={!!errorMsg}
          />

          {capsLock && (
            <div className="flex items-center gap-2 text-amber-600 text-xs">
              <ShieldCheck className="h-4 w-4" />
              Feststelltaste (Caps Lock) ist aktiviert.
            </div>
          )}
        </div>

        {errorMsg && (
          <div
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <p>{errorMsg}</p>
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

      {/* Divider */}
      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>oder</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* OAuth */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('google')}
          className="w-full justify-center"
          isLoading={oauthLoading === 'google'}
          loadingText="Weiter mit Google…"
          leftIcon={<GoogleIcon />}
        >
          Weiter mit Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('apple')}
          className="w-full justify-center"
          isLoading={oauthLoading === 'apple'}
          loadingText="Weiter mit Apple…"
          leftIcon={<AppleIcon />}
        >
          Weiter mit Apple
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-primary hover:underline">Konto erstellen</Link>
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
          router.replace(AFTER_LOGIN_ROUTE);
        }}
      />
    </div>
  );
}

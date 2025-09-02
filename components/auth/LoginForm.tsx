// components/auth/LoginForm.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MFATotpDialog } from '@/components/auth/MFATotpDialog';
import { getAAL, startTotpChallenge } from '@/lib/auth/mfa';
import {
  Mail as MailIcon,
  Lock,
  Eye,
  EyeOff,
  Loader2,
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

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
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
      router.replace('/creator/creator-dashboard');
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
        <h1 className="text-2xl font-semibold tracking-tight">Creator Login</h1>
        <p className="text-sm text-muted-foreground">
          Zugriff auf Dashboard, Media-Studio & Analytics
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <MailIcon className="h-4 w-4" />
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
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Passwort
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onPasswordKey}
              onKeyUp={onPasswordKey}
              required
              aria-invalid={!!errorMsg}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

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
            className="text-sm text-primary hover:underline underline-offset-2"
          >
            Passwort vergessen?
          </button>

          <Button type="submit" disabled={loading} className="min-w-[8rem]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Einloggen…
              </>
            ) : (
              <>
                Login
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
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
        >
          {oauthLoading === 'google' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Weiter mit Google…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-4 w-4">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.6 18.8 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4c-7.7 0-14.2 4.3-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.4 36 27 37 24 37c-5.4 0-9.9-3.6-11.4-8.5l-6.6 5.1C8.6 39.7 15.8 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.2 3.8-5.7 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4c-7.7 0-14.2 4.3-17.7 10.7z" />
              </svg>
              Weiter mit Google
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('apple')}
          className="w-full justify-center"
        >
          {oauthLoading === 'apple' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Weiter mit Apple…
            </>
          ) : (
            <>
              <svg viewBox="0 0 14 18" className="mr-2 h-4 w-4" aria-hidden="true">
                <path
                  d="M13.22 14.51c-.23.53-.5 1.02-.8 1.45-.42.6-.77 1.02-1.05 1.25-.42.39-.86.59-1.31.6-.33 0-.73-.1-1.19-.28-.47-.19-.9-.29-1.29-.29-.4 0-.84.1-1.33.29-.49.19-.88.29-1.18.3-.44.02-.89-.19-1.35-.62-.29-.25-.65-.68-1.06-1.27-.45-.66-.73-1.29-.84-1.88-.13-.68-.2-1.33-.2-1.95 0-.72.15-1.35.45-1.89.24-.43.56-.78.97-1.05.41-.27.86-.41 1.33-.42.33 0 .77.12 1.31.36.54.24.89.36 1.07.36.15 0 .51-.14 1.08-.41.58-.27 1.06-.39 1.45-.35 1.07.09 1.88.51 2.43 1.26-.96.58-1.44 1.39-1.44 2.42 0 .81.3 1.49.9 2.03.27.25.57.44.9.58-.07.18-.14.34-.21.5zM9.21 0c0 .54-.2 1.05-.6 1.51-.48.56-1.06.88-1.7.83-.02-.06-.03-.12-.03-.18 0-.52.22-1.07.61-1.52C7.98.24 8.62-.08 9.2 0c.01.05.01.1.01.15z"
                  fill="currentColor"
                />
              </svg>
              Weiter mit Apple
            </>
          )}
        </Button>
      </div>

      <p className="mt-6 text-xs text-center text-muted-foreground">
        Mit dem Login stimmst du unseren Richtlinien zu. Für Creator- und Admin-Bereiche gilt{' '}
        <span className="font-medium">noindex</span>. Datenschutz: DSGVO &amp; CH-DSG konform.
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
          router.replace('/creator/creator-dashboard');
        }}
      />
    </div>
  );
}

// components/auth/RegisterForm.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User,
  Mail as MailIcon,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

function normalizeEmail(s: string) {
  return s.trim().toLowerCase();
}

function mapAuthError(message?: string) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('already registered')) return 'Diese E-Mail ist bereits registriert.';
  if (msg.includes('invalid email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (msg.includes('weak password') || msg.includes('password')) {
    return 'Passwortanforderungen nicht erfüllt.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Netzwerkproblem. Bitte versuche es später erneut.';
  }
  return message || 'Registrierung fehlgeschlagen.';
}

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}
function strengthLabel(score: number) {
  return ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark'][Math.max(0, score - 1)] || 'Sehr schwach';
}

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');

  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const [accept, setAccept] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState<null | 'google' | 'apple'>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSuccess(false);

    const em = normalizeEmail(email);
    const pwScore = scorePassword(password);

    if (!em) {
      setErrorMsg('Bitte E-Mail eingeben.');
      return;
    }
    if (pwScore < 2 || password.length < 8) {
      setErrorMsg('Das Passwort muss mindestens 8 Zeichen umfassen und sicher sein.');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (!accept) {
      setErrorMsg('Bitte akzeptiere die Nutzungsbedingungen & Datenschutzhinweise.');
      return;
    }

    setLoading(true);
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;

      const { data, error } = await supabase.auth.signUp({
        email: em,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: { name: name || em.split('@')[0] }, // user_metadata
        },
      });

      if (error) {
        setErrorMsg(mapAuthError(error.message));
        return;
      }

      // Falls E-Mail-Verification deaktiviert ist, gibt es ggf. schon eine Session
      if (data?.session) {
        router.replace('/creator/creator-dashboard');
        return;
      }

      setSuccess(true);
      setInfoMsg('Registrierung erfolgreich! Bitte bestätige deine E-Mail, um fortzufahren.');
      setName('');
      setEmail('');
      setPassword('');
      setPassword2('');
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message));
    } finally {
      setLoading(false);
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
      // Redirect via Supabase
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message));
    } finally {
      setOauthLoading(null);
    }
  };

  const s = scorePassword(password);
  const pct = (s / 5) * 100;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Account erstellen</h1>
        <p className="text-sm text-muted-foreground">
          Werde Jetnity Creator – Zugang zu Media-Studio, Dashboard & Analytics
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
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
        {success && (
          <div
            className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5" />
            <p>Registrierung erfolgreich! Prüfe deinen Posteingang und bestätige deine E-Mail.</p>
          </div>
        )}

        {/* Name (optional) */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Anzeigename (optional)
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="z. B. Sasa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* E-Mail */}
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

        {/* Passwort */}
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Passwort
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mind. 8 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
              aria-invalid={!!errorMsg}
            />
            <button
              type="button"
              aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength Meter */}
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{strengthLabel(s)}</p>
            <ul className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
              <li>• Mind. 8 Zeichen</li>
              <li>• Groß- & Kleinbuchstaben</li>
              <li>• Zahlen und Sonderzeichen empfohlen</li>
            </ul>
          </div>
        </div>

        {/* Passwort bestätigen */}
        <div className="space-y-2">
          <Label htmlFor="password2">Passwort bestätigen</Label>
          <div className="relative">
            <Input
              id="password2"
              type={showPw2 ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Wiederholen"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPw2 ? 'Passwort verbergen' : 'Passwort anzeigen'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setShowPw2((v) => !v)}
            >
              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={accept}
            onCheckedChange={(v) => setAccept(Boolean(v))}
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-6 text-muted-foreground">
            Ich akzeptiere die{' '}
            <Link href="/terms" className="text-primary hover:underline">Nutzungsbedingungen</Link>{' '}
            und die{' '}
            <Link href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
          </Label>
        </div>

        <Button type="submit" disabled={loading || !accept} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Erstellen…
            </>
          ) : (
            <>
              Account erstellen
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
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
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
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

      <p className="mt-6 text-sm text-center text-muted-foreground">
        Bereits einen Account?{' '}
        <Link href="/login" className="text-primary hover:underline">Zum Login</Link>
      </p>

      <p className="mt-2 text-[11px] text-center text-muted-foreground">
        Mit der Registrierung stimmst du unseren Richtlinien zu. Creator/Admin-Bereiche sind{' '}
        <span className="font-medium">noindex</span>. DSGVO &amp; CH-DSG konform.
      </p>
    </div>
  );
}

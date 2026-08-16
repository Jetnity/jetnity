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
import { GoogleIcon, AppleIcon } from '@/components/auth/provider-icons';
import {
  User,
  Mail as MailIcon,
  Lock,
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
  if (msg.includes('leaked') || msg.includes('pwned') || msg.includes('data breach')) {
    return 'Dieses Passwort wurde in einem Datenleck gefunden und ist nicht erlaubt.';
  }
  if (msg.includes('weak password') || msg.includes('password')) {
    return 'Passwortanforderungen nicht erfüllt.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Netzwerkproblem. Bitte versuche es später erneut.';
  }
  return message || 'Registrierung fehlgeschlagen.';
}

// Komplexitätsregeln passend zu Supabase-Einstellungen
function hasLower(pw: string) { return /[a-z]/.test(pw); }
function hasUpper(pw: string) { return /[A-Z]/.test(pw); }
function hasDigit(pw: string) { return /\d/.test(pw); }
function hasSymbol(pw: string) { return /[^A-Za-z0-9]/.test(pw); }
function meetsPolicy(pw: string) {
  return pw.length >= 12 && hasLower(pw) && hasUpper(pw) && hasDigit(pw) && hasSymbol(pw);
}

// kleines Meter (0–5) für UI
function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++; // Bonus
  if (hasLower(pw) && hasUpper(pw)) score++;
  if (hasDigit(pw)) score++;
  if (hasSymbol(pw)) score++;
  return Math.max(0, Math.min(score, 5));
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

    if (!em) {
      setErrorMsg('Bitte E-Mail eingeben.');
      return;
    }
    if (!meetsPolicy(password)) {
      setErrorMsg('Bitte nutze mind. 12 Zeichen inkl. Groß-/Kleinbuchstaben, Zahl und Symbol.');
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

      // Falls E-Mail-Verification deaktiviert wäre, gibt es ggf. schon eine Session
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
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mind. 12 Zeichen (a–z, A–Z, Zahl, Symbol)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={!!errorMsg}
          />

          {/* Strength Meter */}
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{strengthLabel(s)}</p>
            <ul className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
              <li>• Mind. 12 Zeichen</li>
              <li>• Groß- & Kleinbuchstaben</li>
              <li>• Mind. 1 Zahl</li>
              <li>• Mind. 1 Symbol (z. B. !?@#)</li>
            </ul>
          </div>
        </div>

        {/* Passwort bestätigen */}
        <div className="space-y-2">
          <Label htmlFor="password2">Passwort bestätigen</Label>
          <Input
            id="password2"
            type="password"
            autoComplete="new-password"
            placeholder="Wiederholen"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={accept}
            onCheckedChange={(v) => setAccept(Boolean(v))}
          />
          <Label
            htmlFor="terms"
            multiline
            className="text-sm font-normal leading-6 text-muted-foreground"
          >
            Ich akzeptiere die{' '}
            <Link href="/terms" className="text-primary hover:underline">Nutzungsbedingungen</Link>{' '}
            und die{' '}
            <Link href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading || !accept}
          className="w-full"
          isLoading={loading}
          loadingText="Erstellen…"
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Account erstellen
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

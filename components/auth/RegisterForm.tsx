// components/auth/RegisterForm.tsx
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
import { Checkbox } from '@/components/ui/checkbox';
import { GoogleIcon, AppleIcon } from '@/components/auth/provider-icons';
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

/** Nach der Registrierung landen Reisende bei ihren Reisen. */
const AFTER_REGISTER_ROUTE = '/reisen';

function mapAuthError(message?: string) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('already registered')) return 'Diese E-Mail ist bereits registriert.';
  if (msg.includes('invalid email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.';

  // Die Ablehnungen des Auth-Servers zum Passwort kommen aus einer Quelle, die
  // ihren Wortlaut kennt – darunter die des Lecks-Abgleichs, die keines der
  // naheliegenden Stichwörter enthält.
  const zumPasswort = passwortAblehnung(message);
  if (zumPasswort) return zumPasswort;

  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Netzwerkproblem. Bitte versuche es später erneut.';
  }
  return message || 'Registrierung fehlgeschlagen.';
}

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');

  const [accept, setAccept] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [feldfehler, setFeldfehler] = React.useState<Feldfehler<'email' | 'password' | 'password2' | 'terms'>>({});
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const password2Ref = React.useRef<HTMLInputElement>(null);
  const termsRef = React.useRef<HTMLDivElement>(null);
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
    const amFeld: Feldfehler<'email' | 'password' | 'password2' | 'terms'> = {
      ...(!em ? { email: 'Bitte gib eine gültige E-Mail-Adresse ein.' } : {}),
      ...(!erfuelltRichtlinie(password) ? { password: RICHTLINIE_TEXT } : {}),
      ...(password && password !== password2 ? { password2: 'Die Passwörter stimmen nicht überein.' } : {}),
      ...(!accept ? { terms: 'Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.' } : {}),
    };
    if (amFeld.email || amFeld.password || amFeld.password2 || amFeld.terms) {
      setFeldfehler(amFeld);
      const erstes = erstesFehlerfeld(amFeld, ['email', 'password', 'password2', 'terms']);
      const ziel =
        erstes === 'password' ? passwordRef.current
        : erstes === 'password2' ? password2Ref.current
        : erstes === 'terms' ? termsRef.current
        : emailRef.current;
      feldInSichtNehmen(ziel);
      return;
    }
    setFeldfehler({});

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
        router.replace(AFTER_REGISTER_ROUTE);
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

  const s = passwortStaerke(password);
  const pct = (s / 5) * 100;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Deine Reisen. Ein Konto.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Erstelle dein kostenloses Jetnity-Konto und speichere deine Reisen dauerhaft.
        </p>
      </div>

      <form noValidate onSubmit={handleRegister} className="space-y-5">
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
          <Label htmlFor="name" icon={<User className="h-4 w-4" />}>
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
          <Label htmlFor="email" icon={<MailIcon className="h-4 w-4" />}>
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
              setEmail(e.target.value)
              setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'email'))
            }}
            error={feldfehler.email}
          />
        </div>

        {/* Passwort */}
        <div className="space-y-2">
          <Label htmlFor="password" icon={<Lock className="h-4 w-4" />}>
            Passwort
          </Label>
          <Input
            id="password"
            ref={passwordRef}
            type="password"
            autoComplete="new-password"
            // Kurz genug, damit der Text auf 320 px nicht abgeschnitten wird.
            // Die vollstaendigen Regeln stehen unter dem Feld.
            placeholder={`Mindestens ${PASSWORT_RICHTLINIE.mindestlaenge} Zeichen`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'password'))
            }}
            error={feldfehler.password}
          />

          {/* Strength Meter */}
          <div className="mt-2">
            {/* Der Balken zeigt, was die Zeile darunter sagt. Fuer Hilfsmittel
                ist er deshalb ausgeblendet – sonst kaeme die Bewertung zweimal. */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
              <div
                className={cn('h-2 rounded-full transition-all', staerkeFarbe(s))}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{staerkeText(s)}</p>
            <ul className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
              {RICHTLINIE_PUNKTE.map((punkt) => (
                <li key={punkt}>• {punkt}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Passwort bestätigen */}
        <div className="space-y-2">
          <Label htmlFor="password2">Passwort bestätigen</Label>
          <Input
            id="password2"
            ref={password2Ref}
            type="password"
            autoComplete="new-password"
            placeholder="Wiederholen"
            value={password2}
            onChange={(e) => {
              setPassword2(e.target.value)
              setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'password2'))
            }}
            error={feldfehler.password2}
          />
        </div>

        {/* Terms */}
        <div
          ref={termsRef}
          tabIndex={-1}
          className={cn(
            'rounded-xl',
            feldfehler.terms && 'bg-surface-50 ring-2 ring-danger-600/20',
          )}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={accept}
              invalid={Boolean(feldfehler.terms)}
              aria-invalid={Boolean(feldfehler.terms) || undefined}
              aria-describedby={feldfehler.terms ? 'terms-fehler' : undefined}
              onCheckedChange={(v) => {
                setAccept(Boolean(v))
                if (v) setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'terms'))
              }}
            />
            <Label
              htmlFor="terms"
              multiline
              invalid={Boolean(feldfehler.terms)}
              className="text-sm font-normal leading-6 text-muted-foreground"
            >
              Ich akzeptiere die{' '}
              <Link href="/terms" className="text-primary hover:underline">Nutzungsbedingungen</Link>{' '}
              und die{' '}
              <Link href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
            </Label>
          </div>
          {feldfehler.terms ? (
            <p id="terms-fehler" role="alert" className="mt-2 text-sm text-danger-600">
              {feldfehler.terms}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={loading || !accept}
          className="w-full"
          isLoading={loading}
          loadingText="Erstellen…"
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Konto erstellen
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
        Du hast schon ein Konto?{' '}
        <Link href="/login" className="text-primary hover:underline">Zur Anmeldung</Link>
      </p>

      <p className="mt-2 text-[11px] text-center text-muted-foreground">
        Mit der Registrierung stimmst du unseren Richtlinien zu. Datenschutz: DSGVO &amp; CH-DSG konform.
      </p>
    </div>
  );
}

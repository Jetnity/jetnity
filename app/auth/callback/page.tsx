// app/auth/callback/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = React.useState<'processing' | 'ok' | 'error'>('processing');
  const [message, setMessage] = React.useState<string>('Authentifiziere…');

  React.useEffect(() => {
    const run = async () => {
      try {
        // 1) Password-Recovery / Magic-Link (Token im Hash-Fragment)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (hash?.startsWith('#')) {
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          const type = params.get('type'); // z.B. 'recovery'

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;

            setState('ok');
            setMessage('Erfolgreich angemeldet.');
            // Bei Passwort-Reset direkt zur Update-Seite
            if (type === 'recovery') {
              router.replace('/auth/update-password');
            } else {
              router.replace('/creator/creator-dashboard');
            }
            return;
          }
        }

        // 2) OAuth (Authorization Code in ?code=…)
        const code = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('code')
          : null;

        if (code) {
          // supabase-js v2: code direkt übergeben
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          setState('ok');
          setMessage('Erfolgreich angemeldet.');
          router.replace('/creator/creator-dashboard');
          return;
        }

        // Fallback
        setState('error');
        setMessage('Ungültiger Callback: Kein Token/Code gefunden.');
      } catch (err: any) {
        console.error(err);
        setState('error');
        setMessage(err?.message || 'Anmeldung fehlgeschlagen.');
      }
    };

    run();
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      {state === 'processing' && (
        <>
          <Loader2 className="h-6 w-6 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="h-6 w-6 mb-3" />
          <p className="text-sm">{message}</p>
        </>
      )}
      {state === 'error' && (
        <>
          <AlertTriangle className="h-6 w-6 text-destructive mb-3" />
          <p className="text-sm text-destructive">{message}</p>
        </>
      )}
    </div>
  );
}

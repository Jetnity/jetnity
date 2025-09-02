// app/(public)/login/page.tsx
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/server';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login – Jetnity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  const supabase = createServerComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/creator/creator-dashboard');
  }

  return (
    <main className="min-h-[70vh] container mx-auto px-4 py-10 flex items-center justify-center">
      <LoginForm />
    </main>
  );
}

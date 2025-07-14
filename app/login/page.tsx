// app/login/page.tsx
import LoginForm from "@/components/auth/LoginForm"; // ✅ korrigierter Pfad

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Login für Creator</h1>
        <LoginForm />
      </div>
    </main>
  );
}

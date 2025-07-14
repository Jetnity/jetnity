"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    if (password.length < 6) {
      setErrorMsg("Das Passwort muss mindestens 6 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || "Registrierung fehlgeschlagen.");
    } else {
      setSuccess(true);
      setEmail("");
      setPassword("");
      router.push("/login"); // oder z. B. /creator-dashboard
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleRegister}
      className="max-w-md mx-auto mt-10 bg-white p-6 rounded-md shadow-md space-y-4"
    >
      <h1 className="text-center text-2xl font-bold">Jetzt kostenlos registrieren</h1>

      {success && (
        <p className="text-green-600 text-sm text-center">
          Registrierung erfolgreich! Bitte bestätige deine E-Mail.
        </p>
      )}

      {errorMsg && (
        <p className="text-red-600 text-sm text-center">{errorMsg}</p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">E-Mail</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Passwort</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Wird gesendet..." : "Registrieren"}
      </button>
    </form>
  );
}

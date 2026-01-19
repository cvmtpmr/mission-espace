"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMsg("⏳ Connexion...");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setMsg("✅ Connecté !");
    router.replace("/"); // retourne au hub qui redirige child/parent
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Connexion</h1>

      <form onSubmit={login} style={{ display: "grid", gap: 10 }}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Se connecter</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}


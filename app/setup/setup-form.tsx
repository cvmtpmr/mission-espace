"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SetupForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [role, setRole] = useState<"parent" | "child">("parent");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      setLoading(false);
      setErrorMsg(userErr.message);
      return;
    }

    if (!user) {
      setLoading(false);
      setErrorMsg("Non connecté.");
      return;
    }

    // Upsert du profil (crée si absent)
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // Recharge -> middleware + page d'accueil feront le routing
    router.replace("/");
    router.refresh();
  }

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Configuration du compte</h1>
      <p>Choisis ton profil pour continuer.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Je suis :</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "parent" | "child")}
          >
            <option value="parent">Parent</option>
            <option value="child">Enfant</option>
          </select>
        </label>

        {errorMsg && (
          <p style={{ color: "crimson" }}>❌ {errorMsg}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Continuer"}
        </button>
      </form>
    </main>
  );
}

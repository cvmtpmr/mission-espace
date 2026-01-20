"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SetupForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [role, setRole] = useState<"parent" | "child">("parent");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanName = displayName.trim();

    if (cleanName.length < 2) {
      setLoading(false);
      setErrorMsg("Le nom affiché doit contenir au moins 2 caractères.");
      return;
    }

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
      setErrorMsg("Non connecté. Merci de te reconnecter.");
      router.replace("/login");
      return;
    }

    // ✅ Upsert du profil : respecte la contrainte NOT NULL sur display_name
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        role,
        display_name: cleanName,
        onboarded: true,
      },
      { onConflict: "id" }
    );

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // ✅ On force un refresh pour que le middleware + SSR relisent le profil
    router.replace("/");
    router.refresh();
  }

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Configuration du compte</h1>
      <p>Choisis ton profil pour continuer.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nom affiché :</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ex : Alex"
            required
            minLength={2}
            maxLength={40}
          />
        </label>

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

        {errorMsg && <p style={{ color: "crimson" }}>❌ {errorMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Continuer"}
        </button>
      </form>
    </main>
  );
}


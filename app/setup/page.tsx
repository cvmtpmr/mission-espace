"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Role = "parent" | "child";

export default function SetupPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [role, setRole] = useState<Role | "">("");
  const [displayName, setDisplayName] = useState("");

  // Pour l’enfant : rattachement à une famille existante (UUID)
  const [familyId, setFamilyId] = useState("");

  const [error, setError] = useState<string | null>(null);

  // 1) Vérifier session + si profil existe déjà, rediriger
  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        router.replace("/login");
        return;
      }

      const uid = authData.user.id;
      setUserId(uid);

      const { data: existing, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();

      if (profileErr) {
        // pas bloquant
        console.error(profileErr.message);
      }

      if (existing?.role === "child") router.replace("/child");
      if (existing?.role === "parent") router.replace("/parent");

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!userId) return;

    setError(null);

    if (!role) {
      setError("Choisis Parent ou Enfant.");
      return;
    }
    if (!displayName.trim()) {
      setError("Entre un prénom / pseudo (ex: Astronaute).");
      return;
    }
    if (role === "child" && !familyId.trim()) {
      setError("Pour un enfant, colle le family_id (UUID) de la famille.");
      return;
    }

    setSaving(true);

    try {
      let finalFamilyId = familyId.trim();

      // 2) Si Parent → créer une famille automatiquement
      if (role === "parent") {
        const { data: fam, error: famErr } = await supabase
          .from("families")
          .insert({ name: `Famille de ${displayName.trim()}` })
          .select("id")
          .single();

        if (famErr) throw new Error(`Création famille impossible : ${famErr.message}`);
        finalFamilyId = fam.id;
      }

      // 3) Créer/mettre à jour le profil (upsert)
      const { error: upsertErr } = await supabase.from("profiles").upsert(
        {
          id: userId,
          role,
          display_name: displayName.trim(),
          family_id: finalFamilyId || null,
        },
        { onConflict: "id" }
      );

      if (upsertErr) throw new Error(`Profil impossible : ${upsertErr.message}`);

      // 4) Redirection
      router.replace(role === "parent" ? "/parent" : "/child");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>🛠️ Setup</h1>
        <p>Chargement…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(180deg, #050b2e, #0b1a52)",
        color: "white",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>🛠️ Configuration</h1>
        <p style={{ opacity: 0.9 }}>
          Choisis ton rôle et on configure tout automatiquement.
        </p>

        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Je suis :</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setRole("parent")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: role === "parent" ? "2px solid #00c896" : "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                👨‍👩‍👧 Parent
              </button>
              <button
                onClick={() => setRole("child")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: role === "child" ? "2px solid #4f7cff" : "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                🧑‍🚀 Enfant
              </button>
            </div>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Nom affiché :</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={role === "child" ? "Astronaute" : "Parent"}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.15)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          {role === "child" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span>Family ID (UUID) :</span>
              <input
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                placeholder="colle ici le family_id (ex: 4527c30f-....)"
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.15)",
                  color: "white",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 13, opacity: 0.8 }}>
                Astuce : tu le trouves dans Supabase → table <strong>families</strong> → colonne <strong>id</strong>.
              </span>
            </label>
          )}

          {role === "parent" && (
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              ✅ En Parent : on va créer une famille automatiquement, puis te rediriger vers le dashboard parent.
            </div>
          )}

          {error && (
            <div style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.35)" }}>
              ❌ {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "12px 16px",
              borderRadius: 16,
              border: "none",
              background: saving ? "rgba(0,200,150,0.5)" : "#00c896",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 900,
              fontSize: 16,
              marginTop: 4,
            }}
          >
            {saving ? "⏳ Enregistrement..." : "✅ Valider"}
          </button>
        </div>
      </div>
    </main>
  );
}


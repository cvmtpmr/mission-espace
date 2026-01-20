import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "../components/LogoutButton";

type ExerciseMini = {
  title: string | null;
  type: string | null;
};

type ResultRow = {
  id: string;
  child_id: string;
  exercise_id: string;
  score: number | null;
  stars_earned: number | null;
  created_at: string;
  // IMPORTANT: Supabase renvoie un TABLEAU ici (exercises: ExerciseMini[])
  exercises: ExerciseMini[];
};

export default async function ParentPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // --- Ici, adapte si tu as un profil/family check dans ton code ---
  // Le but de cette version: compiler + afficher sans erreur TS.

  // 1) Charger des infos parent/enfants si tu en as (optionnel)
  // Tu peux garder ton logique existante autour, l’important est le typage Results.

  // 2) Récupérer les 20 derniers résultats (avec exercice lié)
  const { data: recentResults, error: recentErr } = await supabase
    .from("results")
    .select(
      "id, child_id, exercise_id, score, stars_earned, created_at, exercises(title, type)"
    )
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ResultRow[]>();

  if (recentErr) {
    // on affiche l’erreur plutôt que casser la build
    return (
      <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem" }}>👨‍👩‍🚀 Espace Parent</h1>
        <p style={{ color: "crimson", marginTop: 12 }}>
          Erreur chargement résultats : {recentErr.message}
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/login">↩️ Retour</Link>
        </div>
      </main>
    );
  }

  const results: ResultRow[] = recentResults ?? [];

  return (
    <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>👨‍👩‍🚀 Espace Parent</h1>

      <div style={{ marginBottom: 16 }}>
        <Link href="/parent/link-child">➕ Lier un enfant</Link>
      </div>

      <h2 style={{ fontSize: "1.2rem", marginTop: 24, marginBottom: 12 }}>
        📊 Derniers résultats (20)
      </h2>

      {results.length === 0 ? (
        <p>Aucun résultat pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {results.map((r) => {
            const ex = r.exercises?.[0]; // on prend le 1er élément
            return (
              <div
                key={r.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {ex?.title ?? "Mission"}{" "}
                  <span style={{ fontWeight: 400, opacity: 0.7 }}>
                    ({ex?.type ?? "type"})
                  </span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
                  Score: {r.score ?? "-"}% • ⭐ {r.stars_earned ?? 0} •{" "}
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <LogoutButton />
    </main>
  );
}



import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ParentActions from "./ParentActions";

type Child = {
  id: string;
  display_name: string | null;
};

type ResultRow = {
  id: string;
  child_id: string;
  exercise_id: string;
  score: number | null;
  stars_earned: number | null;
  created_at: string;
  exercises?: {
    title: string | null;
    type: string | null;
  } | null;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function rankFromStars(total: number) {
  if (total >= 50) return "🌌 Commandant";
  if (total >= 20) return "🛰️ Explorateur";
  if (total >= 5) return "🚀 Pilote";
  return "🧑‍🚀 Débutant";
}

export default async function ParentPage() {
  const supabase = await createSupabaseServerClient();

  // 1) Auth
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) redirect("/login");

  // 2) Profil du parent
  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("id, role, family_id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr) console.error(meErr.message);
  if (!me) redirect("/setup");
  if (me.role !== "parent") redirect("/child");
  if (!me.family_id) redirect("/setup");

  // 3) Enfants de la famille
  const { data: children, error: childrenErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("family_id", me.family_id)
    .eq("role", "child")
    .order("created_at", { ascending: true });

  if (childrenErr) console.error(childrenErr.message);

  const childList: Child[] = (children ?? []) as Child[];
  const childIds = childList.map((c) => c.id);

  // 4) Résultats récents (20 derniers) — uniquement si on a des enfants
  let results: ResultRow[] = [];
  if (childIds.length > 0) {
    const { data: recentResults, error: recentErr } = await supabase
      .from("results")
      .select("id, child_id, exercise_id, score, stars_earned, created_at, exercises(title, type)")
      .in("child_id", childIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentErr) console.error(recentErr.message);
    results = (recentResults ?? []) as ResultRow[];
  }

  // 5) Stats ⭐ par enfant (sur les 20 derniers résultats)
  const starsByChild = new Map<string, number>();
  const attemptsByChild = new Map<string, number>();

  for (const id of childIds) {
    starsByChild.set(id, 0);
    attemptsByChild.set(id, 0);
  }

  for (const r of results) {
    starsByChild.set(r.child_id, (starsByChild.get(r.child_id) ?? 0) + (r.stars_earned ?? 0));
    attemptsByChild.set(r.child_id, (attemptsByChild.get(r.child_id) ?? 0) + 1);
  }

  const totalFamilyStars = Array.from(starsByChild.values()).reduce((a, b) => a + b, 0);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>👨‍🚀 Dashboard Parent</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Parent : <strong>{me.display_name ?? "Parent"}</strong> — ⭐ Famille (20 derniers) :{" "}
            <strong>{totalFamilyStars}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>🏠 Hub</Link>
          <Link href="/child" style={{ textDecoration: "none" }}>➡️ Côté enfant</Link>
        </div>
      </header>

      {/* ✅ Actions parent : copier family_id + rattacher un enfant */}
      <section style={{ marginTop: 18 }}>
        <ParentActions familyId={me.family_id} />
      </section>

      {/* Enfants */}
      <section style={{ marginTop: 22 }}>
        <h2 style={{ marginBottom: 10 }}>🧑‍🚀 Enfants</h2>

        {childList.length === 0 ? (
          <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12, background: "white" }}>
            Aucun enfant trouvé dans cette famille.
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              Utilise “Rattacher un enfant” ci-dessus (colle l’UID de l’enfant).
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {childList.map((c) => {
              const stars = starsByChild.get(c.id) ?? 0;
              const attempts = attemptsByChild.get(c.id) ?? 0;
              return (
                <div
                  key={c.id}
                  style={{
                    padding: 14,
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    background: "white",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {c.display_name ?? "Enfant"}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    ⭐ Étoiles (20 derniers) : <strong>{stars}</strong>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    🧾 Tentatives (20 derniers) : <strong>{attempts}</strong>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    🎖️ Rang : <strong>{rankFromStars(stars)}</strong>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
                    child_id: {c.id}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Derniers résultats */}
      <section style={{ marginTop: 22 }}>
        <h2 style={{ marginBottom: 10 }}>📌 Derniers résultats</h2>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", background: "white" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "170px 1fr 90px 90px 190px",
              padding: 10,
              fontWeight: 900,
              borderBottom: "1px solid #eee",
            }}
          >
            <div>Enfant</div>
            <div>Exercice</div>
            <div>Score</div>
            <div>⭐</div>
            <div>Date</div>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: 12 }}>Aucun résultat pour le moment.</div>
          ) : (
            results.map((r) => {
              const childName = childList.find((c) => c.id === r.child_id)?.display_name ?? "Enfant";
              const exTitle = r.exercises?.title ?? `Exercice ${r.exercise_id.slice(0, 8)}…`;

              return (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "170px 1fr 90px 90px 190px",
                    padding: 10,
                    borderBottom: "1px solid #f2f2f2",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{childName}</div>
                  <div style={{ opacity: 0.9 }}>{exTitle}</div>
                  <div><strong>{r.score ?? 0}</strong></div>
                  <div><strong>{r.stars_earned ?? 0}</strong></div>
                  <div style={{ opacity: 0.75 }}>{fmtDate(r.created_at)}</div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
          Note : stats ⭐ calculées sur les 20 derniers résultats (rapide).
          On peut passer au total global (aggregation SQL) ensuite.
        </p>
      </section>
    </main>
  );
}


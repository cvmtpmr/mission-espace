import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Badge = {
  title: string | null;
  description: string | null;
  icon: string | null;
};

// Ici, d'après ton erreur TS, `badges` est un TABLEAU.
// Donc on tape comme: badges: Badge[]
type ChildBadgeRow = {
  badges: Badge[]; // relation renvoyée sous forme de tableau
};

export default async function Page() {
  const supabase = await createServerClient();

  // Sécurité : si pas connecté -> login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Récupération badges liés à l’enfant (selon ton schéma)
  // Si tu filtres par child_id normalement, adapte ici.
  const { data: badges, error } = await supabase
    .from("child_badges")
    .select("badges(title, description, icon)")
    .returns<ChildBadgeRow[]>();

  if (error) {
    return (
      <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>🏅 Badges</h1>
        <p style={{ color: "crimson" }}>
          Erreur lors du chargement : {error.message}
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/child">⬅️ Retour</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🏅 Badges</h1>
      <p style={{ marginBottom: "1.5rem", opacity: 0.85 }}>
        Voici les badges gagnés.
      </p>

      {!badges || badges.length === 0 ? (
        <p>Aucun badge pour le moment ✨</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {badges.map((b, i) => {
            // Comme `badges` est un tableau, on prend le 1er élément
            const badge = b.badges?.[0];

            return (
              <li
                key={i}
                style={{
                  marginBottom: 14,
                  padding: 12,
                  border: "1px solid #e5e5e5",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{badge?.icon ?? "🏅"}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {badge?.title ?? "Badge"}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.85 }}>
                      {badge?.description ?? ""}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/child">⬅️ Retour au dashboard enfant</Link>
      </div>
    </main>
  );
}



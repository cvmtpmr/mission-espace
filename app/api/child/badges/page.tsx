import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Badge = {
  title: string | null;
  description: string | null;
  icon: string | null;
};

type ChildBadgeRow = {
  // relation Supabase : child_badges.badges(...)
  badges: Badge | null;
};

export default async function ChildBadgesPage() {
  const supabase = await createServerClient();

  // Optionnel : s'assurer que l'utilisateur est connecté (sinon redirect)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // IMPORTANT :
  // - child_badges : table pivot
  // - badges : table badges (relation)
  // Le select retourne un tableau d'objets avec une propriété "badges"
  const { data: rows, error } = await supabase
    .from("child_badges")
    .select("badges(title, description, icon)")
    .returns<ChildBadgeRow[]>();

  if (error) {
    return (
      <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>🏅 Badges</h1>
        <p style={{ color: "crimson" }}>
          Erreur de chargement des badges : {error.message}
        </p>
      </main>
    );
  }

  const badges = (rows ?? [])
    .map((r) => r.badges)
    .filter((b): b is Badge => Boolean(b));

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🏅 Badges</h1>
      <p style={{ marginBottom: "1.5rem", opacity: 0.85 }}>
        Voici les badges gagnés.
      </p>

      {badges.length === 0 ? (
        <p>Aucun badge pour le moment ✨</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {badges.map((b, i) => (
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
                <span style={{ fontSize: 28 }}>{b.icon ?? "🏅"}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {b.title ?? "Badge"}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.85 }}>
                    {b.description ?? ""}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


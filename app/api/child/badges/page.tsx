import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ChildBadgesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "child") redirect("/parent");

  const { data: badges } = await supabase
    .from("child_badges")
    .select(`
      earned_at,
      badges (
        title,
        description,
        icon
      )
    `)
    .eq("child_id", user.id)
    .order("earned_at", { ascending: true });

  return (
    <main style={{ padding: 24 }}>
      <h1>🏅 Mes badges</h1>

      {!badges || badges.length === 0 && (
        <p>Aucun badge pour le moment 🙂</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {badges?.map((b, i) => (
          <li key={i} style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>{b.badges.icon}</span>
            <strong style={{ marginLeft: 8 }}>{b.badges.title}</strong>
            <div style={{ marginLeft: 36, fontSize: 14 }}>
              {b.badges.description}
            </div>
          </li>
        ))}
      </ul>

      <a href="/child">⬅ Retour</a>
    </main>
  );
}

// app/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pas connecté -> landing simple
  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Mission Espace</h1>
        <p>Bienvenue ! Connecte-toi pour continuer.</p>
        <p>
          <Link href="/login">Aller au login</Link>
        </p>
      </main>
    );
  }

  // Profil: 0 ou 1 (IMPORTANT)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Pas de profil -> setup
  if (!profile) redirect("/setup");

  // Sinon -> parcours
  if (profile.role === "parent") redirect("/parent");
  redirect("/child");
}


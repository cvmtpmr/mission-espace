// app/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
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
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Si tu veux une page erreur dédiée, tu peux redirect("/error")
    // Là on renvoie une petite page lisible plutôt que planter.
    return (
      <main style={{ padding: 24 }}>
        <h1>Erreur</h1>
        <p>Impossible de lire le profil.</p>
        <pre>{error.message}</pre>
      </main>
    );
  }

  // Pas de profil -> setup
  if (!profile) redirect("/setup");

  // Sinon -> parcours
  if (profile.role === "parent") redirect("/parent");
  redirect("/child");
}



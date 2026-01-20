// app/setup/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SetupForm from "./setup-form";

export default async function SetupPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Erreur</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  // ✅ IMPORTANT:
  // On redirige SEULEMENT si onboarded = true
  if (profile?.onboarded === true) {
    if (profile.role === "parent") redirect("/parent");
    redirect("/child");
  }

  // Si pas de profil OU onboarded=false -> on affiche le setup
  return <SetupForm />;
}






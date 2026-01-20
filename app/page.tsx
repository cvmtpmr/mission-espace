// app/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  // ✅ nouveau compte OU non onboardé -> setup
  if (!profile || profile.onboarded === false) redirect("/setup");

  if (profile.role === "parent") redirect("/parent");
  redirect("/child");
}





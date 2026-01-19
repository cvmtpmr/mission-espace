"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("⏳ Chargement...");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function go() {
      setStatus("🔎 Vérification connexion...");

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setStatus("➡️ Pas connecté → /login");
        router.replace("/login");
        return;
      }

      setStatus("👤 Connecté. Lecture du profil...");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        setStatus("❌ Erreur profiles: " + error.message);
        return;
      }

      if (!profile) {
        setStatus("➡️ Pas de profil → /setup");
        router.replace("/setup");
        return;
      }

      setStatus("➡️ Redirection...");
      router.replace(profile.role === "parent" ? "/parent" : "/child");
    }

    go();
  }, [router]);

  return <main style={{ padding: 24 }}><h1>{status}</h1></main>;
}

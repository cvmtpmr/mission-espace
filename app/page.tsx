// app/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 24 }}>
      <h1>Mission Espace</h1>

      {!user ? (
        <>
          <p>Bienvenue ! Connecte-toi pour continuer.</p>
          <Link href="/login">Aller au login</Link>
        </>
      ) : (
        <>
          <p>Tu es connecté.</p>
          <ul>
            <li>
              <Link href="/parent">Espace Parent</Link>
            </li>
            <li>
              <Link href="/child">Espace Enfant</Link>
            </li>
          </ul>
        </>
      )}
    </main>
  );
}






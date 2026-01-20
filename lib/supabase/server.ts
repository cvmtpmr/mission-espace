import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ⚠️ Adapte si tu as déjà une fonction avec un autre nom.
// L'important : utiliser NEXT_PUBLIC_* et cookies.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // En RSC, set peut échouer, c'est OK
          }
        },
      },
    }
  );
}

/**
 * ✅ Renvoie le profil si il existe, sinon null.
 * C'est LE fix du "Cannot coerce the result to a single JSON object".
 */
export async function getProfileOrNull(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle(); // ✅ IMPORTANT

  if (error) throw error; // vraie erreur DB
  return data; // Profil ou null
}



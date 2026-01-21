import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MissionsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Missions</h1>
        <p>Pas connecté.</p>
        <Link className="underline" href="/login">
          Aller au login
        </Link>
      </div>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.family_id) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Missions</h1>
        <p>family_id manquant dans profiles.</p>
        <p className="opacity-80">{profileError?.message}</p>
        <Link className="underline" href="/child">
          ← Retour
        </Link>
      </div>
    );
  }

  const { data: missions, error: missionsError } = await supabase
    .from("missions")
    .select("id,title,slug,stars_reward,status,due_date,created_at")
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false });

  if (missionsError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Missions</h1>
        <p>Erreur missions :</p>
        <pre className="opacity-80">{missionsError.message}</pre>
        <Link className="underline" href="/child">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 relative z-50">
      <h1 className="text-2xl font-bold">Missions</h1>

      {!missions?.length ? (
        <p>Aucune mission pour cette famille.</p>
      ) : (
        <ul className="space-y-2">
          {missions.map((m) => (
            <li key={m.id} className="rounded-lg border border-white/20 bg-black/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-sm opacity-80">
                    slug: {m.slug} • étoiles: {m.stars_reward} • statut: {m.status}
                  </div>
                </div>

                <Link className="underline" href={`/child/missions/${m.slug}`}>
                  Ouvrir →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link className="underline inline-block" href="/child">
        ← Retour
      </Link>
    </div>
  );
}






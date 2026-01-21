import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MissionSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Mission</h1>
        <p>Pas connecté.</p>
        <Link className="underline" href="/child">
          ← Retour
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
        <h1 className="text-2xl font-bold">Erreur profile</h1>
        <p>family_id manquant.</p>
        <p className="opacity-80">{profileError?.message}</p>
        <Link className="underline" href="/child/missions">
          ← Retour aux missions
        </Link>
      </div>
    );
  }

  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .select("id,title,slug,stars_reward,status,due_date,created_at")
    .eq("family_id", profile.family_id)
    .eq("slug", params.slug)
    .maybeSingle();

  if (missionError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Erreur mission</h1>
        <pre className="opacity-80">{missionError.message}</pre>
        <Link className="underline" href="/child/missions">
          ← Retour aux missions
        </Link>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Mission introuvable</h1>
        <p>slug: {params.slug}</p>
        <Link className="underline" href="/child/missions">
          ← Retour aux missions
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 relative z-50">
      <div className="flex items-center justify-between">
        <Link className="underline" href="/child/missions">
          ← Retour aux missions
        </Link>
        <Link className="underline" href="/child">
          Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold">{mission.title}</h1>

      <div className="rounded-lg border border-white/20 bg-black/40 p-4 space-y-2">
        <div><b>Slug :</b> {mission.slug}</div>
        <div><b>Statut :</b> {mission.status}</div>
        <div><b>Étoiles :</b> {mission.stars_reward}</div>
        <div><b>Date limite :</b> {String(mission.due_date)}</div>
      </div>

      {/* Prochaine étape: bouton "Terminer" / RPC */}
      <button
        className="rounded-lg bg-white/90 px-4 py-2 font-semibold text-black hover:bg-white"
        disabled
        title="On l'active à l'étape suivante"
      >
        Terminer la mission ⭐
      </button>
    </div>
  );
}










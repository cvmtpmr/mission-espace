import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MissionBySlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div className="p-6">Pas connecté</div>;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.family_id) {
    return (
      <div className="p-6">
        Erreur profile: {profileError?.message ?? "family_id manquant"}
      </div>
    );
  }

  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .select("id,title,slug,due_date,stars_reward,status,created_at,family_id")
    .eq("family_id", profile.family_id)
    .eq("slug", params.slug)
    .single();

  if (missionError || !mission) return notFound();

  return (
    <div className="p-6 space-y-4">
      <Link href="/child" className="underline">
        ← Retour
      </Link>

      <h1 className="text-3xl font-bold">{mission.title}</h1>

      <div className="rounded-lg border p-4 space-y-2">
        <div>
          <b>Slug :</b> {mission.slug}
        </div>
        <div>
          <b>Statut :</b> {mission.status}
        </div>
        <div>
          <b>Étoiles :</b> {mission.stars_reward}
        </div>
        <div>
          <b>Date limite :</b> {String(mission.due_date)}
        </div>
      </div>
    </div>
  );
}



import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ResultRow = {
  exercise_id: string;
  score: number;
  stars_earned: number;
};

function getRank(totalStars: number) {
  if (totalStars >= 30) return "🪐 Commandant";
  if (totalStars >= 20) return "🚀 Capitaine";
  if (totalStars >= 10) return "🛰️ Astronaute";
  if (totalStars >= 5) return "🌙 Explorateur";
  return "👶 Débutant";
}

export default async function ChildHomePage() {
  const supabase = await createSupabaseServerClient();

  // 1) Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2) Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, family_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/setup");
  if (profile.role !== "child") redirect("/parent");

  // 3) Récupérer les résultats de l'enfant
  // (On prend le meilleur par exercise: priorité aux étoiles puis au score)
  const { data: results, error: resultsError } = await supabase
    .from("results")
    .select("exercise_id, score, stars_earned")
    .eq("child_id", user.id);

  if (resultsError) {
    console.error("resultsError:", resultsError.message);
  }

  const rows = (results ?? []) as ResultRow[];

  const bestByExercise = new Map<string, { stars: number; score: number }>();
  for (const r of rows) {
    const prev = bestByExercise.get(r.exercise_id);
    if (!prev) {
      bestByExercise.set(r.exercise_id, { stars: r.stars_earned, score: r.score });
    } else {
      const better =
        r.stars_earned > prev.stars ||
        (r.stars_earned === prev.stars && r.score > prev.score);
      if (better) bestByExercise.set(r.exercise_id, { stars: r.stars_earned, score: r.score });
    }
  }

  const totalStars = Array.from(bestByExercise.values()).reduce((acc, v) => acc + v.stars, 0);
  const rank = getRank(totalStars);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">🚀 Mission Espace</h1>
        <p className="text-slate-300 mt-2">
          Bonjour <span className="font-semibold">{profile.display_name ?? "Astronaute"}</span> !
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl bg-slate-800 p-6">
          <p className="text-slate-300">⭐ Total d’étoiles</p>
          <p className="text-4xl font-bold mt-2">{totalStars}</p>
        </div>

        <div className="rounded-xl bg-slate-800 p-6">
          <p className="text-slate-300">🎖️ Rang</p>
          <p className="text-2xl font-bold mt-2">{rank}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/child/map"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 transition p-6 text-center font-semibold"
        >
          🪐 Carte des planètes
        </Link>

        <Link
          href="/child/badges"
          className="rounded-xl bg-slate-800 hover:bg-slate-700 transition p-6 text-center font-semibold"
        >
          🏅 Mes badges
        </Link>
      </section>

      <section className="mt-10 rounded-xl bg-slate-800 p-6">
        <h2 className="text-xl font-bold mb-2">🎯 Conseil</h2>
        <p className="text-slate-300">
          Essaie de gagner au moins <span className="font-semibold">1 étoile</span> sur chaque mission
          pour débloquer la suivante !
        </p>
      </section>
    </main>
  );
}


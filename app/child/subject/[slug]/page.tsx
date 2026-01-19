import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { slug: string };

type SubjectRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order_index: number | null;
};

type ExerciseRow = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  subject_id: string | null;
  order_index: number | null;
  difficulty?: string | null;
  ops?: string | null;
};

type ResultRow = {
  exercise_id: string;
  score: number;
  stars_earned: number;
};

function renderStars(n: number) {
  const safe = Math.max(0, Math.min(3, n));
  return "⭐".repeat(safe) + "☆".repeat(3 - safe);
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  // 1) Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2) Profil enfant
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, family_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/setup");
  if (profile.role !== "child") redirect("/parent");

  // 3) Subject (planète) via slug
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, order_index")
    .eq("slug", slug)
    .single();

  if (subjectError || !subject) notFound();

  const sub = subject as SubjectRow;

  // 4) Exercises de la planète (triés par order_index)
  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, title, type, created_at, subject_id, order_index, difficulty, ops")
    .eq("subject_id", sub.id)
    .order("order_index", { ascending: true });

  if (exercisesError) console.error("exercisesError:", exercisesError.message);

  const exs = (exercises ?? []) as ExerciseRow[];
  const exerciseIds = exs.map((e) => e.id);

  // 5) Results (best par exercise)
  const bestByExercise = new Map<string, { bestStars: number; bestScore: number }>();

  if (exerciseIds.length > 0) {
    const { data: results, error: resultsError } = await supabase
      .from("results")
      .select("exercise_id, score, stars_earned")
      .eq("child_id", user.id)
      .in("exercise_id", exerciseIds);

    if (resultsError) console.error("resultsError:", resultsError.message);

    const rows = (results ?? []) as ResultRow[];

    for (const r of rows) {
      const prev = bestByExercise.get(r.exercise_id);
      if (!prev) {
        bestByExercise.set(r.exercise_id, { bestStars: r.stars_earned, bestScore: r.score });
      } else {
        // Priorité étoiles puis score
        const better =
          r.stars_earned > prev.bestStars ||
          (r.stars_earned === prev.bestStars && r.score > prev.bestScore);
        if (better) bestByExercise.set(r.exercise_id, { bestStars: r.stars_earned, bestScore: r.score });
      }
    }
  }

  // 6) Progression planète: "complété" = bestStars >= 1
  const completedCount = exs.filter((e) => (bestByExercise.get(e.id)?.bestStars ?? 0) >= 1).length;
  const totalCount = exs.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/child/map"
          className="rounded-lg bg-slate-800 hover:bg-slate-700 transition px-3 py-2"
        >
          ← Carte
        </Link>

        <div>
          <h1 className="text-3xl font-bold">
            <span className="mr-2">{sub.icon ?? "🪐"}</span>
            {sub.name}
          </h1>
          <p className="text-slate-300">Choisis une mission sur cette planète</p>

          <div className="mt-3 rounded-xl bg-slate-800 p-4">
            <p className="text-slate-300 text-sm">
              Progression : <span className="font-semibold">{completedCount}/{totalCount}</span>{" "}
              missions complétées (≥ 1 ⭐)
            </p>
            <div className="mt-2 h-3 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-3 bg-indigo-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-slate-400 text-xs mt-1">{progressPercent}%</p>
          </div>
        </div>
      </div>

      {!exs.length ? (
        <div className="rounded-xl bg-slate-800 p-6 text-slate-200">
          <p className="font-semibold mb-2">Aucune mission pour le moment 😕</p>
          <p className="text-sm text-slate-300">
            Ajoute des exercices liés à cette planète et remplis{" "}
            <span className="font-mono">subject_id</span> +{" "}
            <span className="font-mono">order_index</span>.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {exs.map((ex, idx) => {
            const best = bestByExercise.get(ex.id);
            const bestStars = best?.bestStars ?? 0;
            const bestScore = best?.bestScore ?? 0;

            // 🔓 Déblocage: mission 1 libre, sinon >= 1 ⭐ sur la précédente
            const prevEx = idx > 0 ? exs[idx - 1] : null;
            const prevBestStars = prevEx ? (bestByExercise.get(prevEx.id)?.bestStars ?? 0) : 0;
            const unlocked = idx === 0 || prevBestStars >= 1;

            const meta =
              ex.ops || ex.difficulty
                ? `• ${ex.ops ?? ""}${ex.ops && ex.difficulty ? " / " : ""}${ex.difficulty ?? ""}`
                : "";

            return (
              <li key={ex.id} className="rounded-xl bg-slate-800 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {idx + 1}. {ex.title}
                    </p>
                    <p className="text-sm text-slate-300">
                      Type : {ex.type}{" "}
                      <span className="text-slate-400">{meta}</span>
                    </p>
                    <p className="text-sm mt-1">
                      {renderStars(bestStars)}{" "}
                      <span className="text-slate-300">• meilleur score : {bestScore}%</span>
                    </p>

                    {!unlocked && (
                      <p className="text-xs text-slate-400 mt-2">
                        🔒 Débloque cette mission en gagnant au moins 1 ⭐ sur la mission précédente.
                      </p>
                    )}
                  </div>

                  {unlocked ? (
                    <Link
                      href={`/child/missions/${ex.type}/${ex.id}`}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 transition px-4 py-2 font-semibold"
                    >
                      Lancer
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="rounded-lg bg-slate-700 px-4 py-2 font-semibold opacity-60 cursor-not-allowed"
                      title="Gagne au moins 1 étoile sur la mission précédente"
                    >
                      🔒 Verrouillée
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}


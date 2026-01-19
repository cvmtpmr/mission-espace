import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SubjectRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order_index: number | null;
};

type ExerciseRow = {
  id: string;
  subject_id: string | null;
};

type ResultRow = {
  exercise_id: string;
  score: number;
  stars_earned: number;
};

export default async function ChildMapPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, family_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/setup");
  if (profile.role !== "child") redirect("/parent");

  // Subjects (RLS filtre)
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, order_index")
    .order("order_index");

  const subs = (subjects ?? []) as SubjectRow[];
  const subjectIds = subs.map((s) => s.id);

  // Exercises liés à ces subjects
  let exs: ExerciseRow[] = [];
  if (subjectIds.length > 0) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, subject_id")
      .in("subject_id", subjectIds);

    exs = (exercises ?? []) as ExerciseRow[];
  }

  const exerciseIds = exs.map((e) => e.id);

  // Best results par exercise (pour l’enfant)
  const bestByExercise = new Map<string, { bestStars: number; bestScore: number }>();

  if (exerciseIds.length > 0) {
    const { data: results } = await supabase
      .from("results")
      .select("exercise_id, score, stars_earned")
      .eq("child_id", user.id)
      .in("exercise_id", exerciseIds);

    const rows = (results ?? []) as ResultRow[];

    for (const r of rows) {
      const prev = bestByExercise.get(r.exercise_id);
      if (!prev) {
        bestByExercise.set(r.exercise_id, { bestStars: r.stars_earned, bestScore: r.score });
      } else {
        const better =
          r.stars_earned > prev.bestStars ||
          (r.stars_earned === prev.bestStars && r.score > prev.bestScore);
        if (better) bestByExercise.set(r.exercise_id, { bestStars: r.stars_earned, bestScore: r.score });
      }
    }
  }

  // Somme des étoiles par subject
  const starsBySubject = new Map<string, number>();
  for (const e of exs) {
    if (!e.subject_id) continue;
    const best = bestByExercise.get(e.id);
    const stars = best?.bestStars ?? 0;
    starsBySubject.set(e.subject_id, (starsBySubject.get(e.subject_id) ?? 0) + stars);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-2">🪐 Carte des planètes</h1>
      <p className="mb-8 text-slate-300">Choisis une planète pour commencer une mission</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {subs.map((s) => {
          const totalStars = starsBySubject.get(s.id) ?? 0;

          return (
            <Link
              key={s.id}
              href={`/child/subject/${s.slug}`}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 transition p-6 flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-4">{s.icon ?? "🪐"}</div>
              <h2 className="text-xl font-semibold">{s.name}</h2>
              <p className="mt-2 text-sm text-slate-300">⭐ {totalStars} étoiles</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}




import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Attribue automatiquement des badges à l'enfant connecté
 * en fonction de ses résultats (toutes matières + Maths).
 * Retourne la liste des badges gagnés à cet appel.
 */

type BadgeRow = {
  id: string;
  code: string;
  title: string;
  icon: string;
};

type ExerciseRow = {
  id: string;
  subject_id: string | null;
  ops: string | null;
};

type ResultRow = {
  exercise_id: string;
  score: number;
  stars_earned: number;
};

export async function POST() {
  const supabase = await createSupabaseServerClient();

  // 1️⃣ Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2️⃣ Profil enfant
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "child") {
    return NextResponse.json({ error: "Not a child" }, { status: 403 });
  }

  const childId = user.id;

  // 3️⃣ Charger les badges existants
  const { data: badges } = await supabase
    .from("badges")
    .select("id, code, title, icon");

  const badgeByCode = new Map(
    (badges ?? []).map((b: BadgeRow) => [b.code, b])
  );

  const earnedCodes: string[] = [];

  // =========================
  // 🎯 BADGES GÉNÉRAUX
  // =========================

  // Première mission
  const { count: missionCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId);

  if ((missionCount ?? 0) >= 1) earnedCodes.push("first_mission");
  if ((missionCount ?? 0) >= 5) earnedCodes.push("five_missions");

  // Première étoile
  const { count: starCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .gte("stars_earned", 1);

  if ((starCount ?? 0) >= 1) earnedCodes.push("first_star");

  // Trois étoiles
  const { count: threeStarCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("stars_earned", 3);

  if ((threeStarCount ?? 0) >= 1) earnedCodes.push("three_stars");

  // Score parfait
  const { count: perfectCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("score", 100);

  if ((perfectCount ?? 0) >= 1) earnedCodes.push("perfect_score");

  // =========================
  // 🧮 BADGES MATHS
  // =========================

  // Subject Maths
  const { data: mathsSubject } = await supabase
    .from("subjects")
    .select("id")
    .eq("slug", "maths")
    .single();

  if (mathsSubject) {
    // Exercices Maths
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, subject_id, ops")
      .eq("subject_id", mathsSubject.id);

    const exs = (exercises ?? []) as ExerciseRow[];
    const exIds = exs.map((e) => e.id);

    if (exIds.length > 0) {
      // Résultats Maths
      const { data: results } = await supabase
        .from("results")
        .select("exercise_id, score, stars_earned")
        .eq("child_id", childId)
        .in("exercise_id", exIds);

      const rows = (results ?? []) as ResultRow[];

      // Meilleur résultat par exercice
      const bestByExercise = new Map<
        string,
        { stars: number; score: number }
      >();

      for (const r of rows) {
        const prev = bestByExercise.get(r.exercise_id);
        if (!prev) {
          bestByExercise.set(r.exercise_id, {
            stars: r.stars_earned,
            score: r.score,
          });
        } else {
          const better =
            r.stars_earned > prev.stars ||
            (r.stars_earned === prev.stars && r.score > prev.score);
          if (better) {
            bestByExercise.set(r.exercise_id, {
              stars: r.stars_earned,
              score: r.score,
            });
          }
        }
      }

      // ⭐ Première étoile Maths
      const hasMathsStar = exIds.some(
        (id) => (bestByExercise.get(id)?.stars ?? 0) >= 1
      );
      if (hasMathsStar) earnedCodes.push("maths_first_star");

      // ✖️ Tables : 3 étoiles
      const tableIds = exs.filter((e) => e.ops === "mul").map((e) => e.id);
      const tablesMastered = tableIds.some(
        (id) => (bestByExercise.get(id)?.stars ?? 0) >= 3
      );
      if (tablesMastered) earnedCodes.push("tables_3stars");

      // 🪐 Planète Maths complète
      const planetComplete =
        exIds.length > 0 &&
        exIds.every(
          (id) => (bestByExercise.get(id)?.stars ?? 0) >= 1
        );

      if (planetComplete) earnedCodes.push("maths_planet_complete");
    }
  }

  // =========================
  // 🏅 INSERTION DES BADGES
  // =========================

  const badgeIdsToInsert = earnedCodes
    .map((code) => badgeByCode.get(code))
    .filter(Boolean) as BadgeRow[];

  if (badgeIdsToInsert.length > 0) {
    await supabase
      .from("child_badges")
      .upsert(
        badgeIdsToInsert.map((b) => ({
          child_id: childId,
          badge_id: b.id,
        })),
        {
          onConflict: "child_id,badge_id",
          ignoreDuplicates: true,
        }
      );
  }

  // =========================
  // 🎉 RETOURNER LES BADGES GAGNÉS
  // =========================

  const earnedBadges = badgeIdsToInsert.map((b) => ({
    code: b.code,
    title: b.title,
    icon: b.icon,
  }));

  return NextResponse.json({
    ok: true,
    earnedCodes,
    earnedBadges,
  });
}



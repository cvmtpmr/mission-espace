"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Difficulty = "easy" | "medium" | "hard";
type Ops = "add_sub" | "mul" | "mixed";

type Question = {
  a: number;
  b: number;
  op: "+" | "-" | "×";
  answer: number;
};

type EarnedBadge = {
  title: string;
  icon: string;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rangesForDifficulty(difficulty: Difficulty) {
  if (difficulty === "easy") return { min: 1, max: 10 };
  if (difficulty === "medium") return { min: 5, max: 20 };
  return { min: 10, max: 50 };
}

function pickOne<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeQuestionWithSettings(
  difficulty: Difficulty,
  ops: Ops,
  tables: number[] | null
): Question {
  const { min, max } = rangesForDifficulty(difficulty);

  let op: Question["op"];
  if (ops === "mul") op = "×";
  else if (ops === "add_sub") op = Math.random() < 0.5 ? "+" : "-";
  else {
    const r = Math.random();
    op = r < 0.34 ? "+" : r < 0.67 ? "-" : "×";
  }

  let a = randomInt(min, max);
  let b = randomInt(min, max);

  if (op === "-" && b > a) [a, b] = [b, a];

  if (op === "×") {
    // If exercise defines a list of tables, force 'a' to be one of them.
    if (tables && tables.length > 0) {
      a = pickOne(tables);
      b = randomInt(2, difficulty === "easy" ? 10 : difficulty === "medium" ? 12 : 20);
    } else {
      // Default multiplication ranges
      if (difficulty === "easy") {
        a = randomInt(2, 10);
        b = randomInt(2, 10);
      } else if (difficulty === "medium") {
        a = randomInt(2, 12);
        b = randomInt(2, 12);
      } else {
        a = randomInt(5, 20);
        b = randomInt(5, 20);
      }
    }
  }

  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { a, b, op, answer };
}

export default function CalcClozeMissionPage() {
  const router = useRouter();
  const params = useParams<{ exerciseId: string }>();
  const exerciseId = params.exerciseId;

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);

  const [exerciseTitle, setExerciseTitle] = useState<string>("Calculs à trous");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [ops, setOps] = useState<Ops>("add_sub");
  const [tables, setTables] = useState<number[] | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [inputs, setInputs] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);

  const total = questions.length;

  // Load exercise + generate questions
  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, family_id, display_name")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.replace("/setup");
        return;
      }

      if (profile.role !== "child") {
        router.replace("/parent");
        return;
      }

      const { data: ex, error: exErr } = await supabase
        .from("exercises")
        .select("id, title, type, difficulty, ops, data")
        .eq("id", exerciseId)
        .single();

      if (exErr || !ex) {
        console.error(exErr?.message ?? "exercise not found");
        router.replace("/child/map");
        return;
      }

      const exTitle = ex.title ?? "Calculs à trous";
      const exDiff = (ex.difficulty ?? "easy") as Difficulty;
      const exOps = (ex.ops ?? "add_sub") as Ops;

      const exTables =
        Array.isArray(ex.data?.tables) && ex.data.tables.every((n: any) => typeof n === "number")
          ? (ex.data.tables as number[])
          : null;

      setExerciseTitle(exTitle);
      setDifficulty(exDiff);
      setOps(exOps);
      setTables(exTables);

      const qs = Array.from({ length: 8 }, () =>
        makeQuestionWithSettings(exDiff, exOps, exTables)
      );
      setQuestions(qs);
      setInputs(Array.from({ length: qs.length }, () => ""));
      setSubmitted(false);
      setEarnedBadges([]);

      setLoading(false);
    };

    run();
  }, [exerciseId, router, supabase]);

  // Score shown after submitted
  const correctCount = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((acc, q, i) => {
      const val = Number(inputs[i]);
      return acc + (Number.isFinite(val) && val === q.answer ? 1 : 0);
    }, 0);
  }, [submitted, questions, inputs]);

  const scorePercent = useMemo(() => {
    if (!submitted || total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  }, [submitted, correctCount, total]);

  const starsEarned = useMemo(() => {
    if (!submitted) return 0;
    if (scorePercent >= 90) return 3;
    if (scorePercent >= 70) return 2;
    if (scorePercent >= 50) return 1;
    return 0;
  }, [submitted, scorePercent]);

  const handleSubmit = async () => {
    if (submitted) return;

    // Compute score directly (not dependent on setState timing)
    const correct = questions.reduce((acc, q, i) => {
      const val = Number(inputs[i]);
      return acc + (Number.isFinite(val) && val === q.answer ? 1 : 0);
    }, 0);

    const percent = Math.round((correct / questions.length) * 100);

    let stars = 0;
    if (percent >= 90) stars = 3;
    else if (percent >= 70) stars = 2;
    else if (percent >= 50) stars = 1;

    setSubmitted(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase.from("results").insert({
      child_id: user.id,
      exercise_id: exerciseId,
      score: percent,
      stars_earned: stars,
    });

    if (error) {
      console.error("results insert error:", error.message);
      return;
    }

    // Award badges (server) and show popup with returned badges
    try {
      const res = await fetch("/api/child/award-badges", { method: "POST" });
      const json = await res.json();
      setEarnedBadges((json?.earnedBadges ?? []) as EarnedBadge[]);
    } catch (e) {
      console.error("award badges error:", e);
    }
  };

  const handleRetry = () => {
    const qs = Array.from({ length: 8 }, () => makeQuestionWithSettings(difficulty, ops, tables));
    setQuestions(qs);
    setInputs(Array.from({ length: qs.length }, () => ""));
    setSubmitted(false);
    setEarnedBadges([]);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-6">
        <p className="text-slate-300">Chargement de la mission…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 transition px-3 py-2"
        >
          ← Retour
        </button>

        <div className="text-right">
          <h1 className="text-2xl font-bold">🧩 {exerciseTitle}</h1>
          <p className="text-slate-300 text-sm">
            Mode : {ops} • Niveau : {difficulty} • 8 questions
            {tables?.length ? ` • Tables : ${tables.join(", ")}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const userVal = inputs[i];
          const isCorrect = submitted && userVal !== "" && Number(userVal) === q.answer;
          const isWrong = submitted && (userVal === "" || Number(userVal) !== q.answer);

          return (
            <div
              key={i}
              className="rounded-xl bg-slate-800 p-5 flex items-center justify-between gap-4"
            >
              <div className="text-lg font-semibold">
                {q.a} {q.op} {q.b} =
              </div>

              <div className="flex items-center gap-3">
                <input
                  value={userVal}
                  onChange={(e) => {
                    if (submitted) return;
                    const v = e.target.value.replace(/[^\d-]/g, "");
                    setInputs((prev) => {
                      const next = [...prev];
                      next[i] = v;
                      return next;
                    });
                  }}
                  className="w-24 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                  inputMode="numeric"
                  placeholder="?"
                />

                {submitted && (
                  <span className="text-sm">
                    {isCorrect ? "✅" : isWrong ? `❌ (${q.answer})` : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl bg-slate-800 p-6">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 transition px-4 py-3 font-semibold"
          >
            Valider
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-lg font-semibold">
              Score : {correctCount}/{total} ({scorePercent}%)
            </p>
            <p className="text-lg">
              Étoiles gagnées : {"⭐".repeat(starsEarned)}
              {"☆".repeat(3 - starsEarned)}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => router.replace("/child/map")}
                className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-700 transition px-4 py-3 font-semibold"
              >
                Carte des planètes
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition px-4 py-3 font-semibold"
              >
                Rejouer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🎉 Badge popup */}
      {earnedBadges.length > 0 && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-xl bg-slate-800 border border-slate-700 p-4 shadow-lg">
          <p className="font-semibold mb-2">🎉 Badge débloqué !</p>
          <ul className="space-y-2">
            {earnedBadges.map((b, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-2xl">{b.icon}</span>
                <span>{b.title}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setEarnedBadges([])}
            className="mt-3 w-full rounded-lg bg-slate-900 hover:bg-slate-700 transition px-3 py-2 font-semibold"
          >
            OK
          </button>
        </div>
      )}
    </main>
  );
}




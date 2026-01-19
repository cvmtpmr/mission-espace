"use client";

import { useMemo, useState } from "react";

type Op = "+" | "-" | "×";

type Question = {
  id: string;
  a: number;
  b: number;
  op: Op;
  answer: number; // résultat
  prompt: string; // ex: "7 + __ = 12"
  hole: "a" | "b" | "result";
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQuestion(level: number, idx: number): Question {
  const ops: Op[] = level >= 2 ? ["+", "-", "×"] : ["+", "-"];
  const op = ops[randInt(0, ops.length - 1)];

  let a = 0;
  let b = 0;

  if (op === "×") {
    a = randInt(2, 9);
    b = randInt(2, 9);
  } else {
    const max = level >= 2 ? 50 : 20;
    a = randInt(1, max);
    b = randInt(1, max);
  }

  // éviter les résultats négatifs
  if (op === "-" && b > a) [a, b] = [b, a];

  let answer = 0;
  if (op === "+") answer = a + b;
  if (op === "-") answer = a - b;
  if (op === "×") answer = a * b;

  const holeRoll = randInt(0, 2);
  const hole: Question["hole"] = holeRoll === 0 ? "result" : holeRoll === 1 ? "a" : "b";

  let prompt = "";
  if (hole === "result") prompt = `${a} ${op} ${b} = __`;
  if (hole === "a") prompt = `__ ${op} ${b} = ${answer}`;
  if (hole === "b") prompt = `${a} ${op} __ = ${answer}`;

  return {
    id: `q_${level}_${idx}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    a,
    b,
    op,
    answer,
    prompt,
    hole,
  };
}

function expectedForHole(q: Question): number {
  if (q.hole === "result") return q.answer;

  if (q.hole === "a") {
    if (q.op === "+") return q.answer - q.b;
    if (q.op === "-") return q.answer + q.b;
    // ×
    return q.answer / q.b;
  }

  // hole === "b"
  if (q.op === "+") return q.answer - q.a;
  if (q.op === "-") return q.a - q.answer;
  // ×
  return q.answer / q.a;
}

export default function MissionCalculPage() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(0);

  const questions = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, i) => buildQuestion(level, i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  function resetMission() {
    setAnswers({});
    setChecked(false);
    setScore(0);
    setSaveState("idle");
    setSaveError(null);
    setSeed((s) => s + 1);
  }

  async function check() {
    let s = 0;

    for (const q of questions) {
      const expected = expectedForHole(q);
      const val = Number(answers[q.id]);

      if (!Number.isNaN(val) && val === expected) {
        s += 1;
      }
    }

    setScore(s);
    setChecked(true);

    // 🔥 Sauvegarde en base (results)
    setSaveState("saving");
    setSaveError(null);

    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: "f4cd6253-234a-4f3e-83a9-20fe46884a3e",
          score: s,
          stars_earned: s, // simple : 1 bonne réponse = 1 ⭐
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveState("error");
        setSaveError(json?.error ?? "Erreur inconnue");
        return;
      }

      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "Erreur réseau");
    }
  }

  const success = checked && score === questions.length;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 20,
        background: "linear-gradient(180deg, #050b2e, #0b1a52)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>🪐 Mission B — Calculs à trous</h1>
        <p style={{ marginTop: 0, opacity: 0.9 }}>
          Remplis les cases pour recharger le vaisseau 🔋✨
        </p>

        <section
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: 0.9 }}>Niveau :</span>
            <select
              value={level}
              onChange={(e) => {
                setLevel(Number(e.target.value));
                resetMission();
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
              }}
            >
              <option value={1}>🚀 Facile</option>
              <option value={2}>🌟 Moyen</option>
            </select>
          </label>

          <button
            onClick={resetMission}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🔄 Nouvelle mission
          </button>
        </section>

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {questions.map((q, idx) => {
            const expected = expectedForHole(q);
            const valNum = Number(answers[q.id]);
            const isOk = checked && !Number.isNaN(valNum) && valNum === expected;

            return (
              <div
                key={q.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 16,
                  padding: 14,
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>🛰️ Calcul {idx + 1}</strong>
                  {checked && <span style={{ fontWeight: 800 }}>{isOk ? "✅ +1 ⭐" : "❌"}</span>}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 22,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{q.prompt.replace("__", "")}</span>

                  <input
                    inputMode="numeric"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="?"
                    style={{
                      width: 120,
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(0,0,0,0.15)",
                      color: "white",
                      fontSize: 20,
                      outline: "none",
                    }}
                  />
                </div>

                {checked && !isOk && (
                  <div style={{ marginTop: 8, opacity: 0.95 }}>
                    Indice : la bonne réponse était <strong>{expected}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={check}
            style={{
              padding: "12px 16px",
              borderRadius: 16,
              border: "none",
              background: "#00c896",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            ✅ Vérifier
          </button>

          {checked && (
            <div style={{ fontSize: 18 }}>
              Score : <strong>{score}/{questions.length}</strong>{" "}
              {success ? "🚀 Mission réussie !" : "🛠️ Continue, tu peux y arriver !"}
            </div>
          )}

          {checked && (
            <div style={{ opacity: 0.9 }}>
              {saveState === "saving" && "💾 Sauvegarde en cours..."}
              {saveState === "saved" && "✅ Résultat sauvegardé !"}
              {saveState === "error" && (
                <span>
                  ❌ Erreur sauvegarde : <strong>{saveError ?? "inconnue"}</strong>
                </span>
              )}
            </div>
          )}
        </section>

        {success && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(0,255,0,0.25)",
              background: "rgba(0,255,0,0.08)",
            }}
          >
            🎉 Bravo Astronaute ! Tu gagnes <strong>{questions.length} ⭐</strong> et le badge “Rechargeur du vaisseau”
            🏅
          </div>
        )}
      </div>
    </main>
  );
}

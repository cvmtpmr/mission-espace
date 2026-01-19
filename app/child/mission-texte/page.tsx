"use client";

import { useMemo, useState } from "react";

type Gap = { id: string; answer: string; placeholder: string };

export default function MissionTextePage() {
  const gaps: Gap[] = useMemo(
    () => [
      { id: "g1", answer: "Lune", placeholder: "Lune" },
      { id: "g2", answer: "astronaute", placeholder: "astronaute" },
      { id: "g3", answer: "fusée", placeholder: "fusée" },
    ],
    []
  );

  const [values, setValues] = useState<Record<string, string>>({
    g1: "",
    g2: "",
    g3: "",
  });

  const [result, setResult] = useState<string | null>(null);

  function check() {
    const ok = gaps.every(
      (g) => values[g.id].trim().toLowerCase() === g.answer.toLowerCase()
    );
    setResult(ok ? "✅ Bravo ! Mission réussie 🎉" : "❌ Oups… essaie encore 🙂");
  }

  function reset() {
    setValues({ g1: "", g2: "", g3: "" });
    setResult(null);
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 700 }}>
      <h1 style={{ marginBottom: 6 }}>🪐 Mission Français : Texte à trous</h1>
      <p style={{ marginTop: 0 }}>
        Complète le message secret de la station spatiale !
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          Aujourd’hui, je vais sur la{" "}
          <InlineInput
            value={values.g1}
            placeholder="Lune"
            onChange={(v) => setValues((s) => ({ ...s, g1: v }))}
          />{" "}
          . Je suis un{" "}
          <InlineInput
            value={values.g2}
            placeholder="astronaute"
            onChange={(v) => setValues((s) => ({ ...s, g2: v }))}
          />{" "}
          et je monte dans une{" "}
          <InlineInput
            value={values.g3}
            placeholder="fusée"
            onChange={(v) => setValues((s) => ({ ...s, g3: v }))}
          />
          .
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          onClick={check}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "white",
            fontWeight: 700,
          }}
        >
          Vérifier ✅
        </button>

        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "white",
          }}
        >
          Recommencer 🔄
        </button>
      </div>

      {result && (
        <p style={{ marginTop: 14, fontSize: 18, fontWeight: 700 }}>{result}</p>
      )}

      <p style={{ marginTop: 24, opacity: 0.8 }}>
        Astuce : écris exactement les mots affichés en gris 😉
      </p>
    </main>
  );
}

function InlineInput(props: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
      style={{
        width: 140,
        padding: "6px 8px",
        borderRadius: 8,
        border: "1px solid #ccc",
        margin: "0 6px",
        fontSize: 16,
      }}
    />
  );
}



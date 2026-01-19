"use client";

import { useState } from "react";

export default function ParentActions({ familyId }: { familyId: string }) {
  const [childId, setChildId] = useState("");
  const [status, setStatus] = useState<"idle" | "copy" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function copyFamilyId() {
    try {
      await navigator.clipboard.writeText(familyId);
      setStatus("copy");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setError("Impossible de copier (autorisation navigateur).");
      setStatus("error");
    }
  }

  async function linkChild() {
    setError(null);
    if (!childId.trim()) {
      setError("Colle l’UID de l’enfant.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    try {
      const res = await fetch("/api/parent/link-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? "Erreur inconnue");
        setStatus("error");
        return;
      }

      setStatus("ok");
      setChildId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 1500);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid #ddd",
          background: "white",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>🔑 Family ID</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <code style={{ padding: "6px 8px", background: "#f6f6f6", borderRadius: 8 }}>
            {familyId}
          </code>
          <button onClick={copyFamilyId} style={{ padding: "8px 12px", cursor: "pointer" }}>
            📋 Copier
          </button>
          {status === "copy" && <span style={{ color: "green", fontWeight: 700 }}>Copié !</span>}
        </div>
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
          L’enfant peut coller ce code dans <strong>/setup</strong> pour se rattacher.
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid #ddd",
          background: "white",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>🧑‍🚀 Rattacher un enfant (UID)</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            placeholder="UID enfant (ex: bed246fc-...)"
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ccc", minWidth: 320 }}
          />
          <button onClick={linkChild} style={{ padding: "10px 14px", cursor: "pointer", fontWeight: 700 }}>
            {status === "saving" ? "⏳..." : "✅ Rattacher"}
          </button>
          {status === "ok" && <span style={{ color: "green", fontWeight: 800 }}>OK !</span>}
        </div>

        {status === "error" && error && (
          <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>❌ {error}</div>
        )}

        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
          L’UID enfant = <strong>profiles.id</strong> de l’enfant (ou auth user id).
        </div>
      </div>
    </div>
  );
}

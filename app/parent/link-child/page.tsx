import Link from "next/link";

export default function LinkChildPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
        👨‍👩‍👧 Lier un enfant
      </h1>

      <p style={{ marginBottom: "1.5rem" }}>
        Cette page permet au parent de lier un compte enfant à sa famille.
      </p>

      {/* À remplacer plus tard par ton vrai formulaire */}
      <div
        style={{
          padding: "1rem",
          border: "1px dashed #ccc",
          borderRadius: "8px",
          marginBottom: "1.5rem",
        }}
      >
        <p>🔧 Formulaire de liaison à venir</p>
      </div>

      <Link href="/parent">
        ⬅️ Retour au tableau de bord parent
      </Link>
    </main>
  );
}


type Props = {
  params: { slug: string };
};

const TITLES: Record<string, string> = {
  mercure: "Mission Mercure",
  venus: "Mission Vénus",
  terre: "Mission Terre",
};

export default function MissionPage({ params }: Props) {
  const title = TITLES[params.slug] ?? `Mission: ${params.slug}`;

  return (
    <main style={{ padding: 24, color: "white" }}>
      <h1>{title}</h1>
      <p>Ici tu mettras le contenu de la mission (quiz, vidéo, mini-jeu...).</p>

      <div style={{ marginTop: 16 }}>
        <a href="/child" style={{ color: "white", textDecoration: "underline" }}>
          ← Retour à la carte
        </a>
      </div>
    </main>
  );
}

import styles from "./child.module.css";

export default function ChildPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>🚀 Mission Espace</h1>

        <p><strong>Bonjour Enfant !</strong></p>

        <p>⭐ Total d’étoiles</p>
        <p>0</p>

        <p>🏅 Rang</p>
        <p>🐣 Débutant</p>

        <p>🪐 Carte des planètes · 🎖️ Mes badges</p>

        <h2>🎯 Conseil</h2>
        <p>
          Essaie de gagner au moins 1 étoile sur chaque mission pour débloquer la suivante !
        </p>
      </div>
    </main>
  );
}









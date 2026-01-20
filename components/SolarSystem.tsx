"use client";

import Link from "next/link";
import styles from "./solar.module.css";

type Mission = {
  slug: string;
  name: string;
  orbitClass: string;
  planetClass: string;
  durationSec: number;
};

const MISSIONS: Mission[] = [
  { slug: "mercure", name: "Mercure", orbitClass: styles.orbit1, planetClass: styles.planet1, durationSec: 12 },
  { slug: "venus", name: "Vénus", orbitClass: styles.orbit2, planetClass: styles.planet2, durationSec: 18 },
  { slug: "terre", name: "Terre", orbitClass: styles.orbit3, planetClass: styles.planet3, durationSec: 26 },
];

export default function SolarSystem() {
  return (
    <div className={styles.space} aria-hidden="false">
      <div className={styles.sun} aria-label="Soleil" />

      {MISSIONS.map((m) => (
        <div
          key={m.slug}
          className={`${styles.orbit} ${m.orbitClass}`}
          style={{ animationDuration: `${m.durationSec}s` }}
          aria-label={`Orbite de ${m.name}`}
        >
          <Link
            href={`/child/missions/${m.slug}`}
            className={`${styles.planetLink} ${styles.planet} ${m.planetClass}`}
            aria-label={`Ouvrir la mission ${m.name}`}
          />
        </div>
      ))}
    </div>
  );
}




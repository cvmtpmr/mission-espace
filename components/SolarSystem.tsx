import styles from "./solar.module.css";

export default function SolarSystem() {
  return (
    <div className={styles.space}>
      <div className={styles.sun}></div>

      <div className={`${styles.orbit} ${styles.orbit1}`}>
        <div className={`${styles.planet} ${styles.planet1}`} />
      </div>

      <div className={`${styles.orbit} ${styles.orbit2}`}>
        <div className={`${styles.planet} ${styles.planet2}`} />
      </div>

      <div className={`${styles.orbit} ${styles.orbit3}`}>
        <div className={`${styles.planet} ${styles.planet3}`} />
      </div>
    </div>
  );
}



import Link from "next/link";

export default function MissionsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Missions</h1>

      <ul style={{ marginTop: 16 }}>
        <li>
          <Link
            href="/child/missions/mercure-1"
            style={{ textDecoration: "underline" }}
          >
            Mission Mercure
          </Link>
        </li>

        <li>
          <Link
            href="/child/missions/venus-1"
            style={{ textDecoration: "underline" }}
          >
            Mission Vénus
          </Link>
        </li>
      </ul>
    </div>
  );
}





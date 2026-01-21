import Link from "next/link";

export default function MissionsIndexPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Missions index</h1>
      <p>Test :</p>
      <Link href="/child/missions/mercure-1">Aller à mercure-1</Link>
    </div>
  );
}





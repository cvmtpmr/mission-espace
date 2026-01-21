import Link from "next/link";

export default function MissionSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>
        Mission : {params.slug}
      </h1>

      <pre
        style={{
          marginTop: 16,
          background: "#111",
          color: "#0f0",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {JSON.stringify(params, null, 2)}
      </pre>

      <Link
        href="/child/missions"
        style={{ display: "inline-block", marginTop: 24, textDecoration: "underline" }}
      >
        ← Retour aux missions
      </Link>
    </div>
  );
}









import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MissionDebugPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // UI au-dessus du SolarSystem
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        padding: 24,
        background: "rgba(0,0,0,0.65)",
        color: "white",
        overflow: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "rgba(0,0,0,0.65)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );

  if (!user) {
    return (
      <Shell>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Pas connecté</h1>
        <Link href="/child" style={{ textDecoration: "underline", color: "white" }}>
          ← Retour
        </Link>
      </Shell>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  const { data: rows, error: rowsError } = await supabase
    .from("missions")
    .select("id,title,slug,family_id,due_date,stars_reward,status,created_at")
    .eq("slug", params.slug);

  return (
    <Shell>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>DEBUG mission</h1>

      <p>
      <b>params :</b>
<pre style={{ whiteSpace: "pre-wrap" }}>
  {JSON.stringify(params, null, 2)}
</pre>

      </p>

      <p>
        <b>profileError :</b> {profileError ? profileError.message : "aucune"}
      </p>

      <p>
        <b>profile.family_id :</b> {String(profile?.family_id)}
      </p>

      <p>
        <b>rowsError :</b> {rowsError ? rowsError.message : "aucune"}
      </p>

      <p>
        <b>Nombre de missions avec ce slug :</b> {rows?.length ?? 0}
      </p>

      <pre style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>
        {JSON.stringify(rows, null, 2)}
      </pre>

      <Link href="/child" style={{ textDecoration: "underline", color: "white" }}>
        ← Retour
      </Link>
    </Shell>
  );
}








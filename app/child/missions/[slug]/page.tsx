import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MissionBySlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // On force une UI au-dessus du SolarSystem
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
          maxWidth: 720,
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
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Pas connecté</h1>
        <p>Connecte-toi en enfant puis réessaie.</p>
        <Link href="/child" style={{ textDecoration: "underline" }}>
          ← Retour
        </Link>
      </Shell>
    );
  }

  // Récupère family_id via profiles (si ton schéma diffère, on adaptera)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.family_id) {
    return (
      <Shell>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Erreur profile</h1>
        <p>{profileError?.message ?? "family_id manquant dans profiles"}</p>
        <Link href="/child" style={{ textDecoration: "underline" }}>
          ← Retour
        </Link>
      </Shell>
    );
  }

  const { data: rows, error: rowsError } = await supabase
  .from("missions")
  .select("id,title,slug,family_id,due_date,stars_reward,status,created_at")
  .eq("slug", params.slug);

return (
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
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>DEBUG mission</h1>
      <p>
        <b>slug demandé :</b> {params.slug}
      </p>
      <p>
        <b>profile.family_id :</b> {String(profile.family_id)}
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

      <p style={{ marginTop: 12 }}>
        <a href="/child" style={{ textDecoration: "underline", color: "white" }}>
          ← Retour
        </a>
      </p>
    </div>
  </div>
);


  if (missionError || !mission) {
    return (
      <Shell>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Mission introuvable</h1>
        <p>slug demandé : {params.slug}</p>
        <p style={{ opacity: 0.9 }}>
          {missionError?.message ?? "Aucune ligne retournée (ou RLS)"}.
        </p>
        <p style={{ opacity: 0.9 }}>
          Vérifie que la mission a le même <b>family_id</b> que l’enfant.
        </p>
        <Link href="/child" style={{ textDecoration: "underline" }}>
          ← Retour
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link href="/child" style={{ textDecoration: "underline" }}>
        ← Retour
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>
        {mission.title}
      </h1>

      <div style={{ marginTop: 12, lineHeight: 1.8 }}>
        <div>
          <b>Slug :</b> {mission.slug}
        </div>
        <div>
          <b>Statut :</b> {mission.status}
        </div>
        <div>
          <b>Étoiles :</b> {mission.stars_reward}
        </div>
        <div>
          <b>Date limite :</b> {String(mission.due_date)}
        </div>
      </div>
    </Shell>
  );
}







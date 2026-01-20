import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ParentChildrenPage() {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("id, role, onboarded, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!me || me.onboarded === false) redirect("/setup");
  if (me.role !== "parent") redirect("/child");

  // Liste des enfants via join vers profiles
  const { data: children, error } = await supabase
    .from("children")
    .select("id, created_at, child_profile_id, child:profiles!children_child_profile_id_fkey(id, display_name, role)")
    .eq("parent_id", me.id)
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 24 }}>
      <h1>👨‍👩‍👧 Mes enfants</h1>
      <p>
        <Link href="/parent">← Retour</Link>
      </p>

      <section style={{ marginTop: 16 }}>
        <h2>Ajouter un enfant</h2>
        <p style={{ maxWidth: 720 }}>
          Pour l’instant, on associe un enfant par son <strong>UID</strong> (profiles.id).
          Ensuite, on améliorera avec un code d’invitation.
        </p>
        <AddChildForm />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Enfants liés</h2>

        {error && (
          <p style={{ color: "crimson" }}>❌ {error.message}</p>
        )}

        {!children || children.length === 0 ? (
          <p>Aucun enfant associé pour l’instant.</p>
        ) : (
          <ul>
            {children.map((row: any) => (
              <li key={row.id} style={{ marginBottom: 10 }}>
                <strong>{row.child?.display_name ?? "(sans nom)"}</strong>{" "}
                — UID: <code>{row.child_profile_id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Import client component (voir fichier ci-dessous)
import AddChildForm from "./AddChildForm";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ParentInvitePanel from "./ParentInvitePanel";

export default async function ParentInvitePage() {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("id, role, onboarded")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!me || me.onboarded === false) redirect("/setup");
  if (me.role !== "parent") redirect("/child");

  return (
    <main style={{ padding: 24 }}>
      <h1>🔑 Inviter un enfant</h1>
      <p>
        <Link href="/parent">← Retour</Link>
      </p>

      <ParentInvitePanel />
    </main>
  );
}

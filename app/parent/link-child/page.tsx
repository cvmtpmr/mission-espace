import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { child_id } = await req.json();
  if (!child_id || typeof child_id !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Vérifier que le demandeur est bien parent + récupérer family_id
  const { data: parentProfile, error: parentErr } = await supabase
    .from("profiles")
    .select("role, family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (parentErr) return NextResponse.json({ error: parentErr.message }, { status: 400 });
  if (!parentProfile || parentProfile.role !== "parent" || !parentProfile.family_id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  // Rattacher l'enfant (policy RLS fera la sécurité)
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ family_id: parentProfile.family_id })
    .eq("id", child_id)
    .eq("role", "child")
    .is("family_id", null);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

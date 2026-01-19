import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "child") {
    return NextResponse.json({ error: "Not a child" }, { status: 403 });
  }

  const childId = user.id;

  const { data: badges } = await supabase.from("badges").select("id, code");
  const byCode = new Map((badges ?? []).map((b) => [b.code, b.id]));

  const earned: string[] = [];

  // total missions (results)
  const { count: resultsCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId);

  if ((resultsCount ?? 0) >= 1) earned.push("first_mission");
  if ((resultsCount ?? 0) >= 5) earned.push("five_missions");

  // first star
  const { count: starCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .gte("stars_earned", 1);

  if ((starCount ?? 0) >= 1) earned.push("first_star");

  // three stars
  const { count: threeCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("stars_earned", 3);

  if ((threeCount ?? 0) >= 1) earned.push("three_stars");

  // Insert (ignore duplicates)
  for (const code of earned) {
    const badgeId = byCode.get(code);
    if (!badgeId) continue;

    await supabase.from("child_badges").insert({
      child_id: childId,
      badge_id: badgeId,
    });
  }

  return NextResponse.json({ ok: true, earned });
}

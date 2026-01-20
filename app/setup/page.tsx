// app/setup/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SetupForm from "./setup-form";

export default async function SetupPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // IMPORTANT: maybeSingle
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Si le profil existe déjà, on sort
  if (profile?.role === "parent") redirect("/parent");
  if (profile?.role === "child") redirect("/child");

  return <SetupForm />;
}



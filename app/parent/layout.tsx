import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .single();

  if (!profile || profile.onboarded === false) redirect("/setup");
  if (profile.role !== "parent") redirect("/child");

  return <>{children}</>;
}

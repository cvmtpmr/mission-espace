"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/";
}


  return <button onClick={logout}>Se déconnecter</button>;
}

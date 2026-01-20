"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ParentInvitePanel() {
  const supabase = createSupabaseBrowserClient();

  async function generate() {
    const { data, error } = await supabase.rpc("create_child_invite", {
      ttl_minutes: 15,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Code généré : " + data);
  }

  return <button onClick={generate}>Générer un code</button>;
}

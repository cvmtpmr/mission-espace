"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function WhoAmI() {
  const supabase = createSupabaseBrowserClient();
  const [text, setText] = useState("🔎 session...");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const email = auth.user?.email ?? "(pas connecté)";

      if (!auth.user) {
        setText(`👤 ${email}`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarded")
        .eq("id", auth.user.id)
        .maybeSingle();

      setText(`👤 ${email} — role: ${profile?.role ?? "?"} — onboarded: ${profile?.onboarded ?? "?"}`);
    })();
  }, [supabase]);

  return (
    <div style={{ padding: 8, background: "#f2f2f2", marginBottom: 12, fontSize: 14 }}>
      {text}
    </div>
  );
}

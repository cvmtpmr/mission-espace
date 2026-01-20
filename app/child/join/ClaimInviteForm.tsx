"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ClaimInviteForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarded")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!profile || profile.onboarded === false) {
        router.replace("/setup");
        return;
      }

      // ✅ Si pas enfant, on envoie vers /parent
      if (profile.role !== "child") {
        router.replace("/parent");
        return;
      }

      setReady(true);
    })();
  }, [router, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const clean = code.trim();
    if (!/^\d{6}$/.test(clean)) {
      setLoading(false);
      setMsg("❌ Le code doit contenir exactement 6 chiffres.");
      return;
    }

    const { error } = await supabase.rpc("claim_child_invite", { p_code: clean });

    if (error) {
      setLoading(false);
      setMsg("❌ " + error.message);
      return;
    }

    setLoading(false);
    setMsg("✅ Parent lié !");
    window.location.href = "/child";
  }

  if (!ready) {
    return <p>⏳ Vérification du compte...</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Code (6 chiffres)</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          placeholder="Ex: 123456"
          maxLength={6}
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Validation..." : "Valider"}
      </button>

      {msg && <p>{msg}</p>}
    </form>
  );
}



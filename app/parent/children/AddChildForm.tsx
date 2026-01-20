"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AddChildForm() {
  const supabase = createSupabaseBrowserClient();

  const [childUid, setChildUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const uid = childUid.trim();
    if (!uid) {
      setLoading(false);
      setMsg("Entre l’UID de l’enfant.");
      return;
    }

    // Récupère le user connecté (parent)
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setLoading(false);
      setMsg("Non connecté.");
      return;
    }

    const parentId = authData.user.id;

    // (Optionnel) vérifier que la cible est bien un profil enfant
    const { data: childProfile, error: childErr } = await supabase
      .from("profiles")
      .select("id, role, onboarded, display_name")
      .eq("id", uid)
      .maybeSingle();

    if (childErr) {
      setLoading(false);
      setMsg(childErr.message);
      return;
    }
    if (!childProfile) {
      setLoading(false);
      setMsg("Aucun profil trouvé avec cet UID.");
      return;
    }
    if (childProfile.role !== "child") {
      setLoading(false);
      setMsg("Ce profil n’est pas un compte enfant.");
      return;
    }
    if (childProfile.onboarded === false) {
      setLoading(false);
      setMsg("Cet enfant n’a pas terminé son setup.");
      return;
    }

    // Crée l’association (RLS vérifie parent_id)
    const { error } = await supabase.from("children").insert({
      parent_id: parentId,
      child_profile_id: uid,
    });

    if (error) {
      setLoading(false);
      setMsg(error.message);
      return;
    }

    setLoading(false);
    setChildUid("");
    setMsg("✅ Enfant ajouté !");
    // refresh simple
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
      <input
        value={childUid}
        onChange={(e) => setChildUid(e.target.value)}
        placeholder="UID de l’enfant (profiles.id)"
      />
      <button disabled={loading} type="submit">
        {loading ? "Ajout..." : "Ajouter"}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}

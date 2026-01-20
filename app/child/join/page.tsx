import Link from "next/link";
import ClaimInviteForm from "./ClaimInviteForm";

export default function ChildJoinPage() {
  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>🔗 Entrer un code parent</h1>
      <p>
        <Link href="/child">← Retour</Link>
      </p>
      <ClaimInviteForm />
    </main>
  );
}

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "red", padding: 20 }}>
      <div style={{ background: "yellow", padding: 10, fontWeight: "bold" }}>
        ✅ LAYOUT CHILD ACTIF
      </div>

      {children}
    </div>
  );
}



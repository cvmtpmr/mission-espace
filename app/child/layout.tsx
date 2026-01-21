import SolarSystem from "@/components/SolarSystem";

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SolarSystem />
      <div style={{ position: "relative", zIndex: 50 }}>
  {children}
</div>

    </>
  );
}




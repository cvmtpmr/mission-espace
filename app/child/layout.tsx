import SolarSystem from "@/components/SolarSystem";

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SolarSystem />
      {children}
    </>
  );
}




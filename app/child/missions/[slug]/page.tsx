export default function MissionTestPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "white",
        color: "black",
        zIndex: 99999,
        padding: 24,
        fontSize: 22,
      }}
    >
      <h1>MISSION PAGE OK</h1>
      <p>slug: {params.slug}</p>
    </div>
  );
}






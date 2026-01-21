export default function Page({ params }: { params: { slug: string } }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "white",
        color: "black",
        zIndex: 999999,
        padding: 40,
        fontSize: 24,
      }}
    >
      <h1>PAGE MISSION</h1>
      <p>Slug : {params.slug}</p>
    </div>
  );
}











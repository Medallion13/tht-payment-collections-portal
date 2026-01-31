export default function HomePage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Tht Payment Portal</h1>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <a href="/quote">Quote Page</a>
        <a href="/confirmation">Confirmation Page</a>
      </div>
    </div>
  );
}

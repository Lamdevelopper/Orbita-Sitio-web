export default function Loading() {
  return (
    <div className="page-shell listing-page">
      <div style={{ width: 120, height: 12, background: "#e0e4ed", borderRadius: 4, marginBottom: 24 }} />
      <div style={{ width: "45%", height: 64, background: "#e8ebf0", borderRadius: 4, marginBottom: 48 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "28px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ aspectRatio: ".76", background: "#eef1f6", borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}

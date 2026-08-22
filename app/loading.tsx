export default function Loading() {
  return (
    <div className="page-shell" style={{ paddingBlock: 100 }} role="status" aria-busy="true">
      <span className="sr-only">Cargando la portada…</span>
      {/* Hero skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", minHeight: 650, borderLeft: "1px solid var(--orbita-line)", borderRight: "1px solid var(--orbita-line)" }}>
        <div style={{ background: "#eef1f6" }} />
        <div style={{ padding: "70px 58px", background: "white" }}>
          <div style={{ width: 120, height: 12, background: "#e0e4ed", borderRadius: 4 }} />
          <div style={{ width: "80%", height: 48, background: "#e8ebf0", marginTop: 28, borderRadius: 4 }} />
          <div style={{ width: "60%", height: 48, background: "#e8ebf0", marginTop: 8, borderRadius: 4 }} />
          <div style={{ width: "90%", height: 16, background: "#eef1f6", marginTop: 28, borderRadius: 4 }} />
          <div style={{ width: "70%", height: 16, background: "#eef1f6", marginTop: 8, borderRadius: 4 }} />
        </div>
      </div>
      {/* Story strip skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", marginTop: 2 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: "40px 32px", borderRight: "1px solid var(--orbita-line)" }}>
            <div style={{ aspectRatio: "1.55", background: "#eef1f6", marginBottom: 24 }} />
            <div style={{ width: "70%", height: 14, background: "#e0e4ed", borderRadius: 4 }} />
            <div style={{ width: "90%", height: 24, background: "#e8ebf0", marginTop: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

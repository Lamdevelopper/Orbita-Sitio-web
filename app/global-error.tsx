"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "Georgia, serif", background: "#fdfdfd", color: "#020202", display: "grid", placeItems: "center", minHeight: "100vh", padding: 32, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: "3rem", fontWeight: 500, margin: 0 }}>Orbita</h1>
          <p style={{ fontSize: "1.1rem", color: "#5b6069", maxWidth: 500, margin: "24px auto" }}>
            Un error critico impide cargar la pagina. Intenta recargar.
          </p>
          <button
            onClick={reset}
            style={{ background: "#506ab8", color: "white", border: 0, padding: "14px 28px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}

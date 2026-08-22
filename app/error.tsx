"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      context: "ErrorBoundary",
      message: error.message,
      stack: error.stack,
    }));
  }, [error]);

  return (
    <div className="page-shell listing-page" style={{ textAlign: "center", paddingBlock: 140 }}>
      <span className="eyebrow">ERROR INESPERADO</span>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(3rem, 5vw, 5rem)", fontWeight: 500, lineHeight: ".93", margin: "24px 0" }}>
        Algo salió mal.
      </h1>
      <p style={{ fontSize: "1.16rem", lineHeight: 1.7, maxWidth: 680, marginInline: "auto", color: "#5b6069" }}>
        El equipo editorial ya fue notificado. Mientras tanto, puedes intentar de nuevo.
      </p>
      <button
        onClick={reset}
        style={{
          display: "inline-flex",
          marginTop: 32,
          background: "var(--orbita-blue)",
          color: "white",
          padding: "14px 24px",
          fontWeight: 700,
          border: 0,
          cursor: "pointer",
        }}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

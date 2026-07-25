import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell listing-page" style={{ textAlign: "center", paddingBlock: 140 }}>
      <span className="eyebrow">ERROR 404</span>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(4rem, 7vw, 7rem)", fontWeight: 500, lineHeight: ".93", margin: "24px 0" }}>
        Esta pagina no esta en orbita.
      </h1>
      <p style={{ fontSize: "1.16rem", lineHeight: 1.7, maxWidth: 680, marginInline: "auto", color: "#5b6069" }}>
        Quiza el enlace que seguiste ya no existe, o el articulo fue movido a otra edicion.
      </p>
      <Link
        href="/articulos"
        style={{
          display: "inline-flex",
          marginTop: 32,
          background: "var(--orbita-blue)",
          color: "white",
          padding: "14px 24px",
          fontWeight: 700,
        }}
      >
        Explorar articulos &rarr;
      </Link>
    </div>
  );
}

import Link from "next/link";

export function SiteHeader() {
  return <>
    <div className="utility-bar"><span>Revista de divulgación científica</span><span>AAFI · FI UNAM</span></div>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Órbita, inicio">
        <span className="brand-mark" aria-hidden="true">O</span>
        <span className="brand-word">ÓRBITA</span>
        <img src="/brand/aafi-wordmark.svg" alt="Aerospace AAFI" className="brand-partner" />
      </Link>
      <nav aria-label="Navegación principal">
        <Link href="/articulos">Artículos</Link><Link href="/ediciones">Ediciones</Link><Link href="/autores">Autores</Link><Link href="/acerca">Acerca</Link>
      </nav>
      <Link href="/articulos" className="search-link" aria-label="Buscar artículos">Buscar <span aria-hidden="true">↗</span></Link>
    </header>
  </>;
}

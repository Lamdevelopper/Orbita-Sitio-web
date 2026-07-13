import Link from "next/link";

export function SiteHeader() {
  return <>
    <div className="utility-bar"><span>Divulgación científica desde la comunidad universitaria</span><span>AAFI · Facultad de Ingeniería</span></div>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Órbita · Aerospace AAFI, inicio"><span className="brand-mark" aria-hidden="true">O</span><span className="brand-word">ÓRBITA</span><span className="brand-partner"><img src="/brand/aerospace-aafi.png" alt="Aerospace AAFI"/></span></Link>
      <nav aria-label="Navegación principal">
        <Link href="/articulos">Artículos</Link><Link href="/ediciones">Ediciones</Link><Link href="/autores">Autores</Link><Link href="/acerca">Acerca</Link>
      </nav>
      <Link href="/articulos" className="search-link" aria-label="Buscar artículos">Buscar <span aria-hidden="true">↗</span></Link>
    </header>
  </>;
}

"use client";
import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/articulos", label: "Artículos" },
  { href: "/ediciones", label: "Ediciones" },
  { href: "/autores", label: "Autores" },
  { href: "/acerca", label: "Acerca" },
];

export function SiteHeader() {
  // El nav colapsa bajo 900px. Sin esto, Autores/Acerca/búsqueda quedaban
  // inalcanzables en móvil (antes se ocultaban con display:none).
  const [menuOpen, setMenuOpen] = useState(false);

  return <>
    <div className="utility-bar"><span>Divulgación científica desde la comunidad universitaria</span><span>AAFI · Facultad de Ingeniería</span></div>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Órbita · Divulgación AAFI, inicio">
        <img className="brand-logo" src="/brand/aafi-logo.svg" alt="" aria-hidden="true" />
        <span className="brand-copy">
          <span className="brand-word">ÓRBITA</span>
          <span className="brand-tagline">REVISTA · AEROSPACE AAFI</span>
        </span>
      </Link>
      <nav id="primary-nav" className="primary-nav" aria-label="Navegación principal" data-open={menuOpen}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>
        ))}
        <Link href="/articulos" className="mobile-search-link" onClick={() => setMenuOpen(false)}>
          Buscar artículos
        </Link>
      </nav>
      <div className="header-end">
        <Link href="/articulos" className="search-link" aria-label="Buscar artículos">Buscar <span aria-hidden="true">↗</span></Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">{menuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            {menuOpen
              ? <><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
          </svg>
        </button>
      </div>
    </header>
  </>;
}

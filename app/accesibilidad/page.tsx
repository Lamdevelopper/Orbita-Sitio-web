import type { Metadata } from "next";
import { SITE_CONTACT } from "../../lib/site-config";

export const metadata: Metadata = {
  title: "Declaración de accesibilidad",
  description: "Estado de accesibilidad del sitio público de Órbita, estándar WCAG 2.2 AA, limitaciones conocidas y canal de retroalimentación.",
};

export default function AccesibilidadPage() {
  return (
    <div className="page-shell legal-page">
      <span className="eyebrow">TRANSPARENCIA</span>
      <h1>Declaración de accesibilidad</h1>
      <p className="lead">
        Queremos que cualquier persona pueda leer Órbita, con o sin tecnologías de asistencia.
        Esta declaración describe el estado de accesibilidad del sitio y cómo reportar barreras.
      </p>

      <h2>Alcance</h2>
      <p>
        Aplica al sitio público de Órbita ({SITE_CONTACT.siteUrl.replace("https://", "")}):
        portada, artículos, ediciones, autores y páginas informativas. El panel editorial privado
        (<code>/admin</code>), reservado al equipo, queda fuera de este alcance.
      </p>

      <h2>Estándar de referencia</h2>
      <p>
        Nos basamos en las <strong>Pautas de Accesibilidad al Contenido Web (WCAG) 2.2, nivel AA</strong>,
        el estándar técnico al que hacen referencia la legislación de accesibilidad digital,
        incluyendo el Título III de la ADA en Estados Unidos y el European Accessibility Act en la Unión Europea.
      </p>

      <h2>Estado de conformidad</h2>
      <p>
        <strong>Parcialmente conforme con WCAG 2.2 nivel AA.</strong> La mayor parte del contenido cumple
        los criterios, pero existen excepciones señaladas más abajo. La evaluación más reciente es de
        <strong> agosto de 2026</strong>, mediante auditoría interna con análisis automatizado (axe-core sobre
        Playwright) y revisión manual de navegación por teclado, zoom al 200% y estructura semántica.
      </p>

      <h2>Medidas adoptadas</h2>
      <ul>
        <li>Semántica HTML con regiones landmarks y un solo encabezado principal por página.</li>
        <li>Navegación completa por teclado, con enlace para saltar al contenido e indicadores de foco visibles.</li>
        <li>Menú de navegación operativo en pantallas pequeñas.</li>
        <li>Textos alternativos en las imágenes editoriales y decoraciones ocultas a los lectores de pantalla.</li>
        <li>Formularios etiquetados, con autocompletado y mensajes de error anunciados automáticamente.</li>
        <li>Respeto por la preferencia de movimiento reducido del sistema operativo.</li>
        <li>Pruebas automatizadas de accesibilidad integradas al repositorio (<code>npm run test:a11y</code>).</li>
      </ul>

      <h2>Limitaciones conocidas</h2>
      <ul>
        <li>
          Las fotografías de archivo reutilizadas de ediciones impresas pueden tener descripciones breves;
          se siguen enriqueciendo conforme se revisa cada historia.
        </li>
        <li>
          Texto superpuesto a fotografías de portada puede reducir su contraste dependiendo de la imagen original.
        </li>
        <li>El panel privado <code>/admin</code> no ha sido adaptado aún a lectores de pantalla.</li>
      </ul>

      <h2>Retroalimentación</h2>
      <p>
        Si encuentras una barrera de acceso, escríbenos a{" "}
        <a href={`mailto:${SITE_CONTACT.contactEmail}`}>{SITE_CONTACT.contactEmail}</a>{" "}
        o contáctanos en Instagram{" "}
        <a href={SITE_CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
          {SITE_CONTACT.instagramHandle} <span aria-hidden="true">↗</span><span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>.
        Intentamos responder en un máximo de 10 días hábiles y priorizar las correcciones que afectan la lectura.
      </p>

      <h2>Reevaluación</h2>
      <p>
        Esta declaración se revisa al menos una vez al año o cuando cambie de forma sustancial
        la estructura del sitio. La metodología y el detalle técnico viven en el repositorio,
        en <code>docs/accessibility.md</code>.
      </p>
    </div>
  );
}

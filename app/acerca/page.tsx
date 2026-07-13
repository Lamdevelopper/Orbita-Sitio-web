import type { Metadata } from "next";

export const metadata: Metadata = { title: "Acerca de Órbita" };

const instagramUrl = "https://www.instagram.com/aerospaceaafi/";

export default function About() {
  return (
    <div className="about-page">
      <section className="page-shell about-hero">
        <div className="about-hero-grid">
          <div>
            <span className="eyebrow">ACERCA DE ÓRBITA</span>
            <h1>La curiosidad también necesita un lugar para encontrarse.</h1>
            <p>
              Órbita es la revista universitaria de divulgación científica de
              Aerospace AAFI. Acercamos la ciencia, la ingeniería y la
              exploración aeroespacial a nuevas generaciones con historias que
              nacen desde la Facultad de Ingeniería.
            </p>
            <a
              className="button-like about-social"
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Sigue a Aerospace AAFI en Instagram ↗
            </a>
          </div>

          <aside className="about-identity-card" aria-label="Aerospace AAFI">
            <span>AAFI · FACULTAD DE INGENIERÍA</span>
            <strong>AAFI</strong>
            <p>Asociación Aeroespacial de la Facultad de Ingeniería</p>
            <small>Una comunidad para imaginar, aprender y construir.</small>
          </aside>
        </div>
      </section>

      <section className="about-blue">
        <div className="page-shell about-values">
          <div>
            <span>01</span>
            <h2>Nuestra misión</h2>
            <p>
              Inspirar la curiosidad y el interés por la ciencia en la
              sociedad, especialmente entre jóvenes estudiantes apasionados
              por la exploración aeroespacial. Creamos un espacio donde cada
              persona pueda descubrir y desarrollar su potencial científico.
            </p>
          </div>
          <div>
            <span>02</span>
            <h2>Nuestra visión</h2>
            <p>
              Fomentar la pasión por el mundo aeroespacial en México y en el
              mundo, para que más infancias y jóvenes se animen a estudiar una
              carrera STEM o a encontrar su propio camino hacia el espacio.
            </p>
          </div>
          <div>
            <span>03</span>
            <h2>Cómo lo hacemos</h2>
            <p>
              Convertimos preguntas en historias: publicamos entrevistas,
              explicaciones y crónicas con acompañamiento editorial, fuentes
              claras y la mirada cercana de la comunidad universitaria.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

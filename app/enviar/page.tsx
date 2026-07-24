import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EnvÃ­a tu artÃ­culo Â· Ã“rbita",
  description: "GuÃ­a para colaborar con la revista Ã“rbita. Aprende a enviar tu artÃ­culo usando nuestra plantilla.",
};

export default function EnviarPage() {
  return (
    <div className="listing-page">
      <div className="page-shell">
        <div className="listing-intro">
          <h1>EnvÃ­a tu artÃ­culo a Ã“rbita</h1>
          <p>
            Â¿Tienes una historia sobre ciencia, ingenierÃ­a o exploraciÃ³n espacial que quieras compartir?
            En Ã“rbita publicamos voces de la comunidad aeroespacial mexicana y latinoamericana.
            Usa esta guÃ­a para preparar una sola carpeta con tu texto y tus imÃ¡genes.
          </p>
        </div>

        <section className="template-guide">
          <h2>Una carpeta por artÃ­culo</h2>
          <p className="lead">
            Crea una carpeta con un nombre corto, guarda dentro el archivo <code>.txt</code> o <code>.md</code>
            y agrega todas las imÃ¡genes originales. El nombre escrito en <code>RUTA:</code> debe ser idÃ©ntico
            al nombre del archivo, incluida su extensiÃ³n.
          </p>
          <div className="template-example">
            <pre>{`mi-articulo-cansat/
  articulo.txt
  foto-del-evento.webp
  equipo-en-lanzamiento.jpg`}</pre>
          </div>
        </section>

        <section className="template-guide">
          <h2>La plantilla</h2>
          <p className="lead">
            Todos los artÃ­culos deben seguir este formato para que podamos procesarlos correctamente.
            Cada campo va en una lÃ­nea aparte, con el nombre del campo en mayÃºsculas, dos puntos y el valor.
          </p>
          <div className="template-example">
            <pre>{`TÃTULO: Mi experiencia en el CanSat Competition 2026
AUTOR: Tu nombre completo
CATEGORÃA: IngenierÃ­a
SUBTÍTULO: Un resumen breve de una o dos frases que enganche al lector.
EDICIÃ“N: julio-2026

---

## CÃ³mo empezÃ³ todo

El primer pÃ¡rrafo introduce el tema y ubica al lector. AquÃ­ puedes contar
el contexto de tu historia: cÃ³mo surgiÃ³ la idea o quÃ© te motivÃ³.

> Una cita que resuma el corazÃ³n de tu artÃ­culo.

## El desarrollo

ContinÃºa con los detalles. Explica lo que aprendiste, los retos que
enfrentaste y cÃ³mo los resolviste. SÃ© especÃ­fico: menciona nombres,
lugares, tecnologÃ­as y resultados concretos.

[IMAGEN 1]
RUTA: foto-del-evento.webp
PIE DE FOTO: Pie de foto descriptivo

## ConclusiÃ³n

Cierra con una reflexiÃ³n, una lecciÃ³n aprendida o una idea que quieras
dejar en quienes te leen.`}</pre>
          </div>
        </section>

        <section className="template-guide">
          <h2>Paso a paso</h2>
          <ol>
            <li>
              <strong>Elige un tema.</strong> Debe estar relacionado con ciencia, tecnologÃ­a, ingenierÃ­a o exploraciÃ³n
              espacial, con conexiÃ³n a MÃ©xico o LatinoamÃ©rica.
            </li>
            <li>
              <strong>Escribe tu artÃ­culo.</strong> Usa la plantilla de arriba y guarda el resultado como archivo
              <code> .txt</code> o <code>.md</code>. TambiÃ©n puedes pegar el texto directamente en tu mensaje.
            </li>
            <li>
              <strong>Las secciones con ##</strong> se convierten en subtÃ­tulos dentro del artÃ­culo. Ãšsalas para dividir
              tu texto en partes lÃ³gicas.
            </li>
            <li>
              <strong>Las citas con &gt;</strong> aparecen destacadas en azul dentro del artÃ­culo. Ãšsalas para frases
              que quieras resaltar.
            </li>
            <li>
              <strong>Numera cada imagen.</strong> Escribe un bloque <code>[IMAGEN 1]</code>, seguido por
              <code> RUTA:</code> y <code>PIE DE FOTO:</code>. Repite con 2, 3 y asÃ­ sucesivamente.
            </li>
            <li>
              <strong>Elige una categorÃ­a.</strong> Algunas opciones: IngenierÃ­a, Entrevista, Perfil, Aeroespacial,
              Ciencias espaciales, BiotecnologÃ­a, Comunidad, InvestigaciÃ³n.
            </li>
            <li>
              <strong>EnvÃ­a la carpeta.</strong> ComprÃ­mela como <code>.zip</code> y escrÃ­benos con el asunto
              &ldquo;Propuesta de artÃ­culo&rdquo;. Si no puedes comprimirla, comparte el texto y todas las imÃ¡genes juntas.
            </li>
          </ol>
        </section>

        <section className="template-guide">
          <h2>Plantilla lista para copiar</h2>
          <p className="lead">
            Copia este bloque, pÃ©galo en tu editor y reemplaza cada campo con tu contenido.
          </p>
          <div className="template-copy">
            <pre>{`TÃTULO:
AUTOR:
CATEGORÃA:
SUBTÍTULO:
EDICIÃ“N:

---

## Primer subtÃ­tulo

Tu primer pÃ¡rrafo aquÃ­.

> Una cita destacada.

## Segundo subtÃ­tulo

ContinÃºa desarrollando tu historia.

[IMAGEN 1]
RUTA: tu-imagen.webp
PIE DE FOTO: Pie de foto

## ConclusiÃ³n

Cierra con una idea que quieras dejar en tus lectores.`}</pre>
          </div>
        </section>

        <section className="template-guide template-faq">
          <h2>Â¿Dudas?</h2>
          <p>
            Si tienes preguntas sobre el formato, el proceso o quieres proponer un tema antes de escribirlo,
            escrÃ­benos. El equipo editorial de Ã“rbita revisa cada propuesta y te respondemos en unos dÃ­as.
          </p>
          <p>
            Puedes contactarnos a travÃ©s de nuestras redes sociales o por correo electrÃ³nico.
            Busca <strong>Ã“rbita Revista</strong> en Instagram o escribe a la direcciÃ³n que aparece
            en nuestra pÃ¡gina de <a href="/acerca">Acerca</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

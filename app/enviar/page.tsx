import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Envía tu artículo · Órbita",
  description: "Guía para colaborar con la revista Órbita. Aprende a enviar tu artículo usando nuestra plantilla.",
};

export default function EnviarPage() {
  return (
    <div className="listing-page">
      <div className="page-shell">
        <div className="listing-intro">
          <h1>Envía tu artículo a Órbita</h1>
          <p>
            ¿Tienes una historia sobre ciencia, ingeniería o exploración espacial que quieras compartir?
            En Órbita publicamos voces de la comunidad aeroespacial mexicana y latinoamericana.
            Usa esta guía para preparar tu texto y enviárnoslo.
          </p>
        </div>

        <section className="template-guide">
          <h2>La plantilla</h2>
          <p className="lead">
            Todos los artículos deben seguir este formato para que podamos procesarlos correctamente.
            Cada campo va en una línea aparte, con el nombre del campo en mayúsculas, dos puntos y el valor.
          </p>
          <div className="template-example">
            <pre>{`TÍTULO: Mi experiencia en el CanSat Competition 2026
AUTOR: Tu nombre completo
CATEGORÍA: Ingeniería
BAJADA: Un resumen breve de una o dos frases que enganche al lector.
EDICIÓN: julio-2026

---

## Cómo empezó todo

El primer párrafo introduce el tema y ubica al lector. Aquí puedes contar
el contexto de tu historia: cómo surgió la idea o qué te motivó.

> Una cita que resuma el corazón de tu artículo.

## El desarrollo

Continúa con los detalles. Explica lo que aprendiste, los retos que
enfrentaste y cómo los resolviste. Sé específico: menciona nombres,
lugares, tecnologías y resultados concretos.

[IMAGEN 1]
RUTA: foto-del-evento.webp
PIE DE FOTO: Pie de foto descriptivo

## Conclusión

Cierra con una reflexión, una lección aprendida o una idea que quieras
dejar en quienes te leen.`}</pre>
          </div>
        </section>

        <section className="template-guide">
          <h2>Paso a paso</h2>
          <ol>
            <li>
              <strong>Elige un tema.</strong> Debe estar relacionado con ciencia, tecnología, ingeniería o exploración
              espacial, con conexión a México o Latinoamérica.
            </li>
            <li>
              <strong>Escribe tu artículo.</strong> Usa la plantilla de arriba. Puedes escribir en cualquier editor de
              texto (Word, Google Docs, Bloc de notas). Respeta el formato de campos, encabezados y separadores.
            </li>
            <li>
              <strong>Las secciones con ##</strong> se convierten en subtítulos dentro del artículo. Úsalas para dividir
              tu texto en partes lógicas.
            </li>
            <li>
              <strong>Las citas con &gt;</strong> aparecen destacadas en azul dentro del artículo. Úsalas para frases
              que quieras resaltar.
            </li>
            <li>
              <strong>Las imágenes con [IMAGEN url]</strong> se insertan en el cuerpo del artículo. Agrega un pie de foto
              después de una barra vertical si quieres: <code>[IMAGEN url | descripción]</code>.
            </li>
            <li>
              <strong>Elige una categoría.</strong> Algunas opciones: Ingeniería, Entrevista, Perfil, Aeroespacial,
              Ciencias espaciales, Biotecnología, Comunidad, Investigación.
            </li>
            <li>
              <strong>Envía tu texto.</strong> Escríbenos con el asunto &ldquo;Propuesta de artículo&rdquo; y pega tu
              texto completo en el cuerpo del mensaje o adjúntalo como documento.
            </li>
          </ol>
        </section>

        <section className="template-guide">
          <h2>Plantilla lista para copiar</h2>
          <p className="lead">
            Copia este bloque, pégalo en tu editor y reemplaza cada campo con tu contenido.
          </p>
          <div className="template-copy">
            <pre>{`TÍTULO:
AUTOR:
CATEGORÍA:
BAJADA:
EDICIÓN:

---

## Primer subtítulo

Tu primer párrafo aquí.

> Una cita destacada.

## Segundo subtítulo

Continúa desarrollando tu historia.

[IMAGEN 1]
RUTA: tu-imagen.webp
PIE DE FOTO: Pie de foto

## Conclusión

Cierra con una idea que quieras dejar en tus lectores.`}</pre>
          </div>
        </section>

        <section className="template-guide template-faq">
          <h2>¿Dudas?</h2>
          <p>
            Si tienes preguntas sobre el formato, el proceso o quieres proponer un tema antes de escribirlo,
            escríbenos. El equipo editorial de Órbita revisa cada propuesta y te respondemos en unos días.
          </p>
          <p>
            Puedes contactarnos a través de nuestras redes sociales o por correo electrónico.
            Busca <strong>Órbita Revista</strong> en Instagram o escribe a la dirección que aparece
            en nuestra página de <a href="/acerca">Acerca</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

export type Article = {
  slug: string;
  category: string;
  title: string;
  dek: string;
  author: string;
  authorSlug: string;
  readingMinutes: number;
  published: string;
  image: string;
  edition: string;
  featured?: boolean;
  body: Array<{ heading?: string; paragraphs: string[]; quote?: string }>;
};

export const articles: Article[] = [
  {
    slug: "mexico-construye-su-futuro-espacial",
    category: "Aeroespacial",
    title: "México construye su futuro espacial desde las aulas",
    dek: "Laboratorios universitarios, equipos CanSat y nuevas comunidades están convirtiendo la curiosidad en infraestructura científica.",
    author: "Matías Lamoyi",
    authorSlug: "matias-lamoyi",
    readingMinutes: 8,
    published: "12 julio 2026",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&q=86",
    edition: "fronteras",
    featured: true,
    body: [
      { paragraphs: ["Antes de que un vehículo llegue a la plataforma de lanzamiento, existe una cadena de preguntas, prototipos y personas aprendiendo a trabajar juntas. En México, una parte importante de esa cadena comienza en las universidades.", "Los proyectos estudiantiles permiten que conceptos abstractos —telemetría, estructuras, control y ciencia de datos— se conviertan en decisiones que deben sobrevivir fuera del pizarrón."] },
      { heading: "Aprender construyendo", paragraphs: ["Un CanSat concentra en el volumen de una lata los sistemas esenciales de una misión: energía, sensores, comunicación y recuperación. Su escala lo vuelve accesible sin eliminar la exigencia técnica.", "El verdadero resultado no es solamente el dispositivo. Es el equipo que aprende a documentar, probar, fallar con método y comunicar lo que descubrió."], quote: "La infraestructura científica también está hecha de confianza, lenguaje compartido y memoria técnica." },
      { heading: "Una comunidad que permanece", paragraphs: ["Cuando los proyectos documentan sus procesos y abren espacios de divulgación, el conocimiento deja de reiniciarse cada generación. Ahí aparece una oportunidad para revistas universitarias como Órbita: conectar los experimentos con las historias humanas que los hacen posibles."] },
    ],
  },
  {
    slug: "cansat-ciencia-en-una-lata",
    category: "Ingeniería",
    title: "CanSat: ciencia, presión y telemetría dentro de una lata",
    dek: "Una misión pequeña obliga a tomar grandes decisiones de ingeniería.",
    author: "Ximena Gaona",
    authorSlug: "ximena-gaona",
    readingMinutes: 6,
    published: "8 julio 2026",
    image: "https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=1400&q=84",
    edition: "fronteras",
    body: [{ paragraphs: ["Diseñar un CanSat es negociar con límites reales. Cada gramo, cada miliamperio y cada línea de código compiten por un lugar dentro de la misión.", "Esa restricción convierte al proyecto en un laboratorio ideal para aprender ingeniería de sistemas."] }, { heading: "La prueba también es diseño", paragraphs: ["Un prototipo útil no sólo funciona una vez. Debe dejar evidencia: qué se probó, bajo qué condiciones y qué cambió después del resultado."] }],
  },
  {
    slug: "mirar-el-universo-con-ondas",
    category: "Física",
    title: "Mirar el universo con ondas que no podemos ver",
    dek: "La astronomía moderna escucha señales invisibles para reconstruir la historia del cosmos.",
    author: "Andrea Ruiz",
    authorSlug: "andrea-ruiz",
    readingMinutes: 10,
    published: "2 julio 2026",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=84",
    edition: "fronteras",
    body: [{ paragraphs: ["Nuestros ojos ocupan una franja diminuta del espectro electromagnético. Para estudiar el universo completo necesitamos instrumentos que traduzcan otras señales en datos interpretables."] }, { heading: "Traducir sin inventar", paragraphs: ["Las imágenes científicas son mapas de mediciones. Sus colores suelen representar energía, temperatura o composición, y por eso requieren una explicación tan cuidadosa como cualquier gráfica."] }],
  },
  {
    slug: "laboratorio-materiales-extremos",
    category: "Investigación",
    title: "Materiales que aprenden a sobrevivir a lo extremo",
    dek: "Del vacío a la vibración: así se prueba lo que algún día viajará fuera de la Tierra.",
    author: "Sofía Hernández",
    authorSlug: "sofia-hernandez",
    readingMinutes: 7,
    published: "25 junio 2026",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=84",
    edition: "materia",
    body: [{ paragraphs: ["Un material espacial debe tolerar ciclos térmicos, radiación, vibración y vacío. Probarlo significa acelerar condiciones y observar cómo cambia antes de confiarle una misión."] }],
  },
];

export const editions = [
  { slug: "fronteras", number: "08", year: "2026", title: "Fronteras", summary: "Personas, ideas y tecnologías que expanden nuestro horizonte.", color: "blue", articleSlugs: articles.filter((a) => a.edition === "fronteras").map((a) => a.slug) },
  { slug: "materia", number: "07", year: "2025", title: "Materia", summary: "Lo que construye nuestro mundo, desde la escala atómica hasta la ingeniería.", color: "red", articleSlugs: articles.filter((a) => a.edition === "materia").map((a) => a.slug) },
  { slug: "senales", number: "06", year: "2025", title: "Señales", summary: "Cómo observamos, medimos y entendemos lo que parecía invisible.", color: "ink", articleSlugs: [] },
];

export const authors = [
  { slug: "matias-lamoyi", name: "Matías Lamoyi", area: "Ingeniería y divulgación", bio: "Escribe sobre proyectos científicos, tecnología y las personas que construyen comunidad alrededor de ellos." },
  { slug: "ximena-gaona", name: "Ximena Gaona", area: "Comunicación científica", bio: "Explora nuevas formas de acercar la ingeniería y la ciencia a públicos jóvenes." },
  { slug: "andrea-ruiz", name: "Andrea Ruiz", area: "Física", bio: "Estudiante y divulgadora interesada en astronomía observacional y visualización científica." },
  { slug: "sofia-hernandez", name: "Sofía Hernández", area: "Ciencia de materiales", bio: "Investiga cómo los materiales responden a ambientes extremos." },
];

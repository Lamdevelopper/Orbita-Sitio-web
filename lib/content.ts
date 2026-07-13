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
    author: "Ari Huizar Mayo",
    authorSlug: "ari-huizar-mayo",
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
    author: "Valentina González Méndez",
    authorSlug: "valentina-gonzalez-mendez",
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
    author: "Daniela Oceguera",
    authorSlug: "daniela-oceguera",
    readingMinutes: 7,
    published: "25 junio 2026",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=84",
    edition: "materia",
    body: [{ paragraphs: ["Un material espacial debe tolerar ciclos térmicos, radiación, vibración y vacío. Probarlo significa acelerar condiciones y observar cómo cambia antes de confiarle una misión."] }],
  },
];

export type Edition = { slug: string; number: string; year: string; title: string; summary: string; color: string; articleSlugs: string[]; externalUrl?: string; coverImage?: string };

export const editions: Edition[] = [
  { slug: "fronteras", number: "08", year: "2026", title: "Fronteras", summary: "Personas, ideas y tecnologías que expanden nuestro horizonte.", color: "blue", articleSlugs: articles.filter((a) => a.edition === "fronteras").map((a) => a.slug) },
  { slug: "materia", number: "07", year: "2025", title: "Materia", summary: "Edición histórica de Órbita disponible en Instagram.", color: "red", articleSlugs: articles.filter((a) => a.edition === "materia").map((a) => a.slug), externalUrl: "https://www.instagram.com/p/DaRQBDaDVzE/?igsh=YXd6MnN4YXRzdzVi", coverImage: "/editions/materia.png" },
  { slug: "senales", number: "06", year: "2025", title: "Señales", summary: "Edición histórica disponible en el visor digital.", color: "ink", articleSlugs: [], externalUrl: "https://heyzine.com/flip-book/9874b3c7ea.html", coverImage: "/editions/senales.png" },
  { slug: "trayectorias", number: "05", year: "2024", title: "Trayectorias", summary: "Una edición anterior conservada en el archivo digital de Órbita.", color: "blue", articleSlugs: [], externalUrl: "https://heyzine.com/flip-book/7a7fc16697.html#page/1", coverImage: "/editions/trayectorias.png" },
];

const teamProfile = (slug: string, name: string) => ({ slug, name, area: "Equipo de Divulgación · Aerospace AAFI", bio: "Integrante del equipo de Divulgación AAFI Aerospace y de la comunidad editorial de Órbita." });

export const authors = [
  teamProfile("matias-lamoyi", "Matías Lamoyi"),
  teamProfile("aram-salvador-cuevas-perez", "Aram Salvador Cuevas Pérez"),
  teamProfile("valentina-gonzalez-mendez", "Valentina González Méndez"),
  teamProfile("ari-huizar-mayo", "Ari Huizar Mayo"),
  teamProfile("paloma-jimenez-san-juan", "Paloma Jiménez San Juan"),
  teamProfile("hector-sebastian-merino-lopez", "Héctor Sebastián Merino López"),
  teamProfile("natalia-velazquez", "Natalia Velázquez"),
  teamProfile("daniela-oceguera", "Daniela Oceguera"),
  teamProfile("irving-david-romero-alvarez", "Irving David Romero Álvarez"),
  teamProfile("adelle-alexa-caballero-cabrera", "Adelle Alexa Caballero Cabrera"),
  teamProfile("sebastian-e-castro-b", "Sebastián E. Castro B."),
  teamProfile("gustavo-cruz-velazquez", "Gustavo Cruz Velázquez"),
  teamProfile("sofia-cuevas", "Sofía Cuevas"),
  teamProfile("dario-pineda-sanchez", "Darío Pineda Sánchez"),
  teamProfile("oney-esteban-escobar-hernandez", "Oney Esteban Escobar Hernández"),
  teamProfile("deni-gallardo", "Dení Gallardo"),
  teamProfile("andrea-guadarrama-o", "Andrea Guadarrama O."),
  teamProfile("angel-gabriel-gutierrez-grajales", "Ángel Gabriel Gutiérrez Grajales"),
  teamProfile("sebastian-leonardo-hernandez-angeles", "Sebastián Leonardo Hernández Ángeles"),
  teamProfile("joice-vania-martinez-flores", "Joice Vania Martínez Flores"),
  teamProfile("michelle-padilla-rodriguez", "Michelle Padilla Rodríguez"),
  teamProfile("roberto-agustin-monroy-dominguez", "Roberto Agustín Monroy Domínguez"),
  teamProfile("natalia-tapia-santin", "Natalia Tapia Santín"),
  teamProfile("mireya-basurto-nuno", "Mireya Basurto Nuño"),
  teamProfile("brandxn-pelcastre", "Brandxn Pelcastre"),
  teamProfile("valery-pena", "Valery Peña"),
  teamProfile("jose-gael-pilo-rosagel", "José Gael Pilo Rosagel"),
  teamProfile("leonardo-jaramillo-rosas", "Leonardo Jaramillo Rosas"),
];

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
  imageCaption?: string;
  edition: string;
  sourceLabel?: string;
  featured?: boolean;
  body: Array<{ heading?: string; paragraphs: string[]; quote?: string; image?: { url: string; caption?: string } }>;
};

export const articles: Article[] = [
  {
    slug: "jorge-ferrer-tecnologia-espacial-desde-mexico",
    category: "Entrevista",
    title: "Jorge Ferrer: construir tecnología espacial desde México",
    dek: "Del sueño de ser astronauta a levantar laboratorios y capacidades satelitales en la UNAM: una trayectoria guiada por la resiliencia y el espacio.",
    author: "Matías Lamoyi",
    authorSlug: "matias-lamoyi",
    readingMinutes: 7,
    published: "junio 2026",
    image: "/articles/archive/jorge-ferrer.webp",
    imageCaption: "El Dr. Jorge Ferrer dentro de la cámara de termovacío de la Unidad de Alta Tecnología de la UNAM.",
    edition: "junio-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 12 · Junio 2026",
    featured: true,
    body: [
      {
        paragraphs: [
          "Hay cosas en el universo que nos cautivan naturalmente. Para Jorge Alfredo Ferrer fue imaginar el espacio y sus posibilidades. Desde niño le gustaban la ciencia ficción y las naves; su primera motivación era convertirse en astronauta.",
          "Su camino, sin embargo, no comenzó con una decisión clara. Deliberó entre la música, la filosofía y la ciencia antes de elegir la ruta que podía acercarlo al espacio. Estudió Física en la UNAM y, aunque la disciplina le representó retos, la terminó summa cum laude.",
        ],
        quote: "Lo único que me daba la fuerza era decir: este es mi sueño.",
      },
      {
        heading: "Un camino no lineal",
        paragraphs: [
          "Después de graduarse, Ferrer trabajó en la industria farmacéutica. Debía decidir entre continuar por una ruta comercial o regresar a la academia para perseguir su vocación. Eligió volver y orientar su formación hacia la ingeniería mecánica y aeroespacial.",
          "En la Universidad de Notre Dame conectó la física con una visión aplicada. Su trabajo en semiconductores y transferencia de calor encontró un rumbo espacial: la ingeniería se convirtió en el medio para transformar conocimiento en tecnología.",
        ],
      },
      {
        heading: "Llegar a la UAT y construir desde cero",
        paragraphs: [
          "Durante el último año de su doctorado, cuando evaluaba oportunidades en compañías aeroespaciales de Estados Unidos, su asesor le habló de un grupo que comenzaba a desarrollar proyectos satelitales en Querétaro. Buscaban a alguien con experiencia térmica. Ferrer llegó a una Unidad de Alta Tecnología que todavía era un sueño en desarrollo.",
          "Con el tiempo, la UAT se consolidó como un espacio para sistemas satelitales, pruebas espaciales e ingeniería avanzada. Proyectos como Cóndor y Quetzal ayudaron a dar credibilidad al equipo e impulsaron laboratorios capaces de probar componentes en vacío y ante cambios extremos de temperatura.",
          "Crear esa infraestructura exigió diseñar, adaptar y construir soluciones que no existían en el país. Para Ferrer, esa es una parte esencial de hacer ingeniería en México: crear las condiciones para que la tecnología pueda existir.",
        ],
        quote: "Cuando yo llegué, todo lo que ahorita hay no existía.",
      },
      {
        heading: "Tecnología para las necesidades de México",
        paragraphs: [
          "El desarrollo espacial va más allá de cohetes y astronautas. Puede mejorar la conectividad de zonas remotas, dar independencia satelital y producir imágenes del territorio sin depender de agencias externas. Ese trabajo reúne materiales, electrónica, telecomunicaciones, mecánica y muchas otras especialidades.",
          "A quienes quieren acercarse al sector, Ferrer recomienda construir bases sólidas en matemáticas, física, lectura, escritura e inglés. Su consejo decisivo es más sencillo: acercarse, leer, preguntar y perder el miedo. Esperar a tener el mapa completo puede impedirnos empezar.",
        ],
        quote: "Mi sueño es que algo de lo que haya hecho aquí en la Tierra esté volando allá en el espacio.",
      },
    ],
  },
  {
    slug: "alondra-balancan-construir-antes-de-sentirte-lista",
    category: "Perfil",
    title: "Alondra Balancán: construir antes de sentirte lista",
    dek: "La curiosidad, el autoaprendizaje y Hija de Newton como herramientas para abrirse camino entre la ingeniería automotriz y la aeroespacial.",
    author: "Matías Lamoyi",
    authorSlug: "matias-lamoyi",
    readingMinutes: 5,
    published: "mayo 2026",
    image: "/articles/archive/alondra-balancan.webp",
    imageCaption: "Alondra Balancán, creadora de Hija de Newton. Fotografía incluida en Órbita No. 11.",
    edition: "mayo-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 11 · Mayo 2026",
    body: [
      {
        paragraphs: [
          "La carrera STEM de Alondra Balancán nace de una curiosidad constante por entender cómo funcionan las cosas. Desde pequeña desarmaba objetos, cuestionaba las respuestas fáciles y buscaba el mecanismo detrás de cada explicación. Con el tiempo descubrió que esa forma de mirar tenía un nombre: ingeniería.",
          "La disposición a aprender por cuenta propia la llevó a mudarse sola de Mérida a la Ciudad de México para estudiar ingeniería eléctrica-electrónica. No llegó con todas las respuestas; llegó con dudas y voluntad de aprender en el camino.",
        ],
        quote: "No esperes a sentirte lista, porque nadie lo está al inicio. Métete aunque tengas dudas.",
      },
      {
        heading: "Una voz propia para el mundo STEM",
        paragraphs: [
          "Hija de Newton nació como una extensión de su vida estudiantil y de su deseo por romper paradigmas sobre quién puede dedicarse a la ingeniería. El proyecto conecta con jóvenes curiosos, a veces confundidos, que buscan un lugar en la ciencia y el espacio.",
          "El nombre expresa esa intención: formar parte de la historia de la ciencia sin renunciar a una perspectiva propia. En la cuenta comparte consejos, experiencias y el proceso real de estudiar ingeniería e involucrarse en el sector aeroespacial.",
        ],
      },
      {
        heading: "Entre lo automotriz y lo aeroespacial",
        paragraphs: [
          "La industria automotriz le ha permitido trabajar con sistemas reales donde calidad, validación y seguridad son condiciones indispensables. Esa exigencia conecta con el sector aeroespacial: ambos dependen de equipos multidisciplinarios, procesos rigurosos y poco margen de error.",
          "Alondra también participa en cohetería experimental y explora tecnología aeroespacial modular. Dividir un sistema grande en módulos que se pueden entender, construir, probar y mejorar vuelve el aprendizaje más accesible y abre una puerta para quienes apenas comienzan.",
        ],
      },
    ],
  },
  {
    slug: "natalia-zaldo-ingenieria-movilidad-sostenible",
    category: "Ingeniería",
    title: "Natalia Zaldo: investigar para transformar la movilidad",
    dek: "Un proyecto de transporte sostenible en Ciudad Universitaria convirtió las materias de ingeniería en decisiones con impacto social.",
    author: "Valentina González Méndez",
    authorSlug: "valentina-gonzalez-mendez",
    readingMinutes: 4,
    published: "abril 2026",
    image: "/articles/archive/natalia-zaldo.webp",
    imageCaption: "Natalia en la entrada principal de la Torre de Ingeniería de la UNAM.",
    edition: "abril-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 10 · Abril 2026",
    body: [
      {
        paragraphs: [
          "Desde pequeña, Natalia mostró afinidad por las matemáticas, los procesos y la idea de construir. Esa curiosidad evolucionó hacia la aeronáutica y hacia una pregunta más amplia: cómo funcionan los sistemas complejos.",
          "Durante los primeros semestres, las materias básicas parecían lejanas a la práctica profesional que imaginaba. Esa percepción cambió en el Instituto de Ingeniería, donde encontró un espacio en el que el conocimiento se aplica, se cuestiona y se pone al servicio de problemas reales.",
        ],
        quote: "Elegí ser ingeniera para dejar un impacto positivo en la sociedad.",
      },
      {
        heading: "Transformar lo cercano",
        paragraphs: [
          "Natalia participa en un proyecto que analiza la viabilidad de integrar sistemas de transporte más sostenibles dentro de Ciudad Universitaria. Más allá del enfoque técnico, la investigación le mostró que la ingeniería implica responsabilidad social: cada decisión tecnológica afecta la vida cotidiana.",
          "Trabajar para mejorar la movilidad de su propia comunidad dio otra dimensión a su formación. Aprender dejó de ser un objetivo aislado; ahora significa contribuir y participar, incluso desde una etapa temprana, en procesos capaces de generar cambios reales.",
        ],
      },
      {
        heading: "Ingeniería como ejercicio de comunidad",
        paragraphs: [
          "En el Instituto aprendió algo que rara vez se enseña explícitamente en el aula: la ingeniería no se construye en solitario. Se construye con preguntas, errores, propuestas y aprendizajes compartidos.",
          "Como mujer en espacios científicos y tecnológicos, Natalia también ha vivido momentos en que sus ideas no fueron valoradas de la misma forma. Su preparación, su constancia y la comunidad entre compañeras se han convertido en herramientas para sostener su lugar y ampliar el camino para quienes vienen después.",
        ],
      },
    ],
  },
  {
    slug: "thelma-liderazgo-femenino-aafi",
    category: "Comunidad",
    title: "Thelma: liderazgo en femenino para AAFI",
    dek: "Aprender sin sentirse lista, liderar con dudas y construir oportunidades colectivas para la ingeniería aeroespacial mexicana.",
    author: "Valentina González Méndez",
    authorSlug: "valentina-gonzalez-mendez",
    readingMinutes: 4,
    published: "marzo 2026",
    image: "/articles/archive/thelma-martinez.webp",
    imageCaption: "Thelma durante la Feria Aeroespacial México 2024.",
    edition: "marzo-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 9 · Marzo 2026",
    body: [
      {
        paragraphs: [
          "Thelma no creció soñando con el espacio. Durante su infancia quería estudiar medicina, hasta que un proyecto escolar sobre planetas encendió una curiosidad nueva. Con los años, esa chispa se convirtió en una decisión firme, incluso ante comentarios que cuestionaban su lugar en la ingeniería por ser mujer.",
          "Las voces que intentaban detenerla terminaron por darle impulso. Durante proyectos técnicos y competencias enfrentó inseguridad, jornadas agotadoras y retos que parecían rebasarla. Allí comprendió que aprender también significa equivocarse, insistir y volver a intentar.",
        ],
        quote: "Nunca vas a estar preparada para las cosas. O lo haces, o se te van las oportunidades.",
      },
      {
        heading: "Liderar también es dudar",
        paragraphs: [
          "Su paso por AAFI transformó sus habilidades técnicas y su manera de verse. De evitar hablar en público pasó a dirigir proyectos, gestionar equipos y asumir la presidencia de la asociación en uno de sus momentos más complejos.",
          "No romantiza el liderazgo: hubo dudas, cansancio y momentos en que pensó rendirse. Aun así decidió quedarse y convertir la incertidumbre en trabajo colectivo.",
        ],
      },
      {
        heading: "Soñar en colectivo",
        paragraphs: [
          "Su visión es crear tecnología aeroespacial mexicana y construir oportunidades para nuevas generaciones. La exploración espacial, como la transformación social, no es un esfuerzo individual.",
          "Thelma reconoce que su mayor red de apoyo ha sido femenina: su mamá, su hermana y sus compañeras. Cada vez más mujeres ocupan espacios dentro de la ingeniería y forman comunidades que se acompañan, protegen e impulsan.",
        ],
        quote: "Siente todo lo que tengas que sentir, pero nunca te rindas.",
      },
    ],
  },
  {
    slug: "ivana-millan-biotecnologia-espacial",
    category: "Biotecnología",
    title: "Ivana Millán: crear más allá de los límites",
    dek: "De la curiosidad por el cielo a la biotecnología espacial y la divulgación: el arte de atreverse a soñar en grande.",
    author: "Sofía Cuevas",
    authorSlug: "sofia-cuevas",
    readingMinutes: 5,
    published: "febrero 2026",
    image: "/articles/archive/ivana-millan.webp",
    imageCaption: "Ivana Millán durante su visita al U.S. Space & Rocket Center.",
    edition: "febrero-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 8 · Febrero 2026",
    body: [
      {
        paragraphs: [
          "Ivana Millán creció haciendo preguntas sobre el cielo, las estrellas y el universo. También bailaba y cantaba, y durante un tiempo sintió que debía elegir entre arte y ciencia. Más adelante comprendió que ambas podían formar parte de su identidad.",
          "Las matemáticas fueron un reto, pero decidió convertir la dificultad en una oportunidad. Una beca para estudiar en el Tecnológico de Monterrey le permitió definir su interés por las áreas STEM y combinar su afinidad por la biología con la fascinación por el cosmos.",
          "Después de graduarse, la pandemia abrió un periodo de incertidumbre. El lanzamiento del telescopio James Webb reavivó un sueño de infancia y lo convirtió en un objetivo concreto.",
        ],
      },
      {
        heading: "Biotecnología con destino espacial",
        paragraphs: [
          "Ivana encontró el International Air and Space Program de AEXA y decidió postularse. Consiguió patrocinio y se convirtió en la primera biotecnóloga astronauta análoga de México, integrando su preparación profesional con su pasión por el espacio.",
          "La biotecnología espacial será decisiva para misiones largas y posibles colonias fuera de la Tierra. Permite estudiar plantas y suelos capaces de crecer con menos recursos, pero también ofrece soluciones terrestres para combatir el hambre, mejorar la fertilidad del suelo y enfrentar plagas.",
        ],
      },
      {
        heading: "Divulgar para abrir oportunidades",
        paragraphs: [
          "Ivana encontró en la divulgación una manera de mezclar creatividad y análisis científico. En redes explica cómo la biotecnología puede aplicarse a otros mundos y combate la desinformación con una ciencia cercana y humana.",
          "Reconoce que para las mujeres puede ser más difícil acceder a oportunidades STEM. La resiliencia, la comunicación y la claridad sobre el propósito se convirtieron en sus herramientas para continuar.",
        ],
        quote: "Entiende cuáles son tus sueños, cuál es tu propósito y qué quieres dejarle a la humanidad, y aférrate a ello.",
      },
    ],
  },
  {
    slug: "diana-rojas-viento-solar",
    category: "Ciencias espaciales",
    title: "Diana Rojas y el rastro del Sol",
    dek: "El viento solar es invisible, pero puede producir auroras, alterar telecomunicaciones y revelar cómo interactúan los planetas con su estrella.",
    author: "Sofía Cuevas",
    authorSlug: "sofia-cuevas",
    readingMinutes: 5,
    published: "enero 2026",
    image: "/articles/archive/diana-rojas.webp",
    imageCaption: "Diana Rojas junto a colegas del Instituto de Geofísica de la UNAM.",
    edition: "enero-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 7 · Enero 2026",
    body: [
      {
        paragraphs: [
          "La trayectoria científica de Diana Rojas nació de una curiosidad temprana por entender el mundo. En secundaria participó en un programa de la Academia Mexicana de Ciencias que le permitió realizar una estancia de verano con un investigador de la UNAM.",
          "Eligió el Instituto de Geofísica y encontró en la investigadora Silvia Bravo una mentora que la impulsó a estudiar Física. Aquel proyecto, hoy conocido como Veranos de Investigación, confirmó su decisión de dedicarse a la ciencia.",
          "La formación fue exigente y tuvo que conciliar vida familiar, licenciatura, posgrado y trabajo científico. Ese proceso fortaleció su determinación.",
        ],
        quote: "Cualquier cosa que quieran hacer es posible; los caminos no necesariamente van a ser los más sencillos, pero no son imposibles.",
      },
      {
        heading: "Observar lo invisible",
        paragraphs: [
          "Diana estudia procesos del sistema solar a partir de datos de misiones espaciales. Su especialidad consiste en encontrar evidencia medible de fenómenos que no vemos y que ocurren a millones de kilómetros.",
          "El viento solar es un flujo constante de partículas emitidas por el Sol. Ella lo explica como el agua de un lago que encuentra piedras en su camino: cada planeta interactúa de forma diferente. La Tierra y Mercurio tienen campos magnéticos propios; Venus y Marte no, por lo que la respuesta cambia.",
        ],
      },
      {
        heading: "Del modelo a la vida cotidiana",
        paragraphs: [
          "Las partículas de alta energía pueden producir tormentas geomagnéticas y auroras, pero también afectar telecomunicaciones y redes eléctricas. Diana desarrolla modelos numéricos y simulaciones para estudiar esos procesos y reconstruir cómo pudieron ocurrir en el pasado.",
          "Aunque la ciencia básica puede parecer abstracta, construye el conocimiento que luego permite diseñar instrumentos, tecnologías y mejores formas de explorar el universo. Para que ese futuro exista, también es indispensable que quienes toman decisiones mantengan interés en la ciencia mexicana.",
        ],
      },
    ],
  },
  {
    slug: "toulouse-ciudad-que-toca-las-estrellas",
    category: "AAFI por el mundo",
    title: "Toulouse: la ciudad que toca las estrellas",
    dek: "Un recorrido por la capital europea del espacio, sus cohetes, laboratorios y la experiencia inmersiva de La Cité de l’espace.",
    author: "Natalia Tapia Santín",
    authorSlug: "natalia-tapia-santin",
    readingMinutes: 5,
    published: "noviembre 2025",
    image: "/articles/archive/toulouse-cite-espace.webp",
    imageCaption: "La Cité de l’espace en Toulouse, con réplicas del Ariane 5 y de la estación espacial Mir. Fotografías: Natalia Tapia.",
    edition: "noviembre-2025",
    sourceLabel: "Publicado originalmente en Órbita No. 5 · Noviembre 2025",
    body: [
      {
        paragraphs: [
          "Toulouse, la Ville Rose, mezcla iglesias románicas, universidades y atardeceres frente al río Garona con una identidad tecnológica única. Además de su patrimonio, es reconocida mundialmente como la capital europea del espacio.",
          "El CNES tiene su sede allí y ha impulsado investigaciones y lanzamientos de satélites. Airbus mantiene en la ciudad su centro para aviación comercial, y parte del conocimiento que hizo posible la misión Rosetta de la Agencia Espacial Europea también nació en Toulouse.",
        ],
      },
      {
        heading: "Una ciudad espacial dentro de la ciudad",
        paragraphs: [
          "La Cité de l’espace es un parque temático dedicado a la exploración. Inaugurado en 1997, reúne modelos a escala real del Ariane 5, la estación Mir y módulos Soyuz, además de planetarios, cine IMAX y exhibiciones interactivas.",
          "En el Centro de lanzamiento se puede seguir el recorrido de un cohete, comprender cómo se coloca un satélite en órbita y observar el funcionamiento del motor Vulcain. Las actividades explican propulsión, basura espacial y hasta el origen de la cuenta regresiva.",
        ],
      },
      {
        heading: "Tocar la Luna",
        paragraphs: [
          "El Andén del Sistema Solar muestra trajes de astronauta, una roca marciana y un fragmento lunar llevado a la Tierra por Apolo 15. Otra sala reconstruye la cabina de un módulo lunar y plantea los problemas de recursos y retorno a la Tierra.",
          "LuneXplorer, la atracción principal, convierte la visita en una misión lunar. La experiencia incluye preparación, una sesión informativa con astronautas europeos y una cápsula capaz de simular despegue y aterrizaje con aceleraciones de hasta 2 G.",
        ],
      },
      {
        heading: "Más allá del parque",
        paragraphs: [
          "La visita espacial convive con la Basílica de Saint-Sernin, el Jardín Japonés, el Capitolio y el Garona. En Toulouse, historia, vida universitaria e industria aeroespacial comparten una misma geografía.",
        ],
      },
    ],
  },
  {
    slug: "mexico-construye-su-futuro-espacial",
    category: "Aeroespacial",
    title: "México construye su futuro espacial desde las aulas",
    dek: "Laboratorios universitarios, equipos CanSat y nuevas comunidades convierten la curiosidad en infraestructura científica.",
    author: "Matías Lamoyi",
    authorSlug: "matias-lamoyi",
    readingMinutes: 8,
    published: "12 julio 2026",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&q=86",
    edition: "en-preparacion",
    body: [
      { paragraphs: ["Antes de que un vehículo llegue a una plataforma de lanzamiento existe una cadena de preguntas, prototipos y personas aprendiendo a trabajar juntas.", "En México, una parte importante de esa cadena comienza en las universidades."] },
      { heading: "Aprender construyendo", paragraphs: ["Un CanSat concentra en el volumen de una lata los sistemas esenciales de una misión: energía, sensores, comunicación y recuperación."], quote: "La infraestructura científica también está hecha de confianza, lenguaje compartido y memoria técnica." },
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
    edition: "en-preparacion",
    body: [{ paragraphs: ["Diseñar un CanSat es negociar con límites reales. Cada gramo, cada miliamperio y cada línea de código compiten por un lugar dentro de la misión."] }, { heading: "La prueba también es diseño", paragraphs: ["Un prototipo útil no sólo funciona una vez. Debe dejar evidencia de qué se probó, bajo qué condiciones y qué cambió después."] }],
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
    edition: "en-preparacion",
    body: [{ paragraphs: ["Nuestros ojos ocupan una franja diminuta del espectro electromagnético. Para estudiar el universo completo necesitamos instrumentos que traduzcan otras señales en datos interpretables."] }],
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
    edition: "en-preparacion",
    body: [{ paragraphs: ["Un material espacial debe tolerar ciclos térmicos, radiación, vibración y vacío. Probarlo significa acelerar condiciones y observar cómo cambia antes de confiarle una misión."] }],
  },
];

export type Edition = {
  slug: string;
  number: string;
  year: string;
  title: string;
  summary: string;
  color: string;
  articleSlugs: string[];
  externalUrl?: string;
  coverImage?: string;
};

const articleSlugsFor = (edition: string) => articles.filter((article) => article.edition === edition).map((article) => article.slug);

export const editions: Edition[] = [
  { slug: "junio-2026", number: "12", year: "2026", title: "Junio de 2026", summary: "Artemis II, decisiones bajo presión y tecnología espacial construida desde México.", color: "blue", articleSlugs: articleSlugsFor("junio-2026"), externalUrl: "https://www.instagram.com/p/DaRQBDaDVzE/?igsh=YXd6MnN4YXRzdzVi", coverImage: "/editions/12-junio-2026.webp" },
  { slug: "mayo-2026", number: "11", year: "2026", title: "Mayo de 2026", summary: "Liderazgo, ciencia extrema y nuevas voces que acercan las áreas STEM.", color: "red", articleSlugs: articleSlugsFor("mayo-2026"), coverImage: "/editions/11-mayo-2026.webp" },
  { slug: "abril-2026", number: "10", year: "2026", title: "Abril de 2026", summary: "Medicina aeroespacial, movilidad sostenible e ingeniería con impacto social.", color: "ink", articleSlugs: articleSlugsFor("abril-2026"), coverImage: "/editions/10-abril-2026.webp" },
  { slug: "marzo-2026", number: "09", year: "2026", title: "Marzo de 2026", summary: "Mujeres que construyen el futuro y medicina más allá de la Tierra.", color: "blue", articleSlugs: articleSlugsFor("marzo-2026"), coverImage: "/editions/09-marzo-2026.webp" },
  { slug: "febrero-2026", number: "08", year: "2026", title: "Febrero de 2026", summary: "Biotecnología espacial, mundos extraños y el arte de soñar en grande.", color: "red", articleSlugs: articleSlugsFor("febrero-2026"), coverImage: "/editions/08-febrero-2026.webp" },
  { slug: "enero-2026", number: "07", year: "2026", title: "Enero de 2026", summary: "Viento solar, trayectorias científicas y perseverancia en ingeniería.", color: "ink", articleSlugs: articleSlugsFor("enero-2026"), coverImage: "/editions/07-enero-2026.webp" },
  { slug: "noviembre-2025", number: "05", year: "2025", title: "Noviembre de 2025", summary: "Toulouse, proyectos jóvenes y divulgación bajo las estrellas.", color: "blue", articleSlugs: articleSlugsFor("noviembre-2025"), coverImage: "/editions/05-noviembre-2025.webp" },
  { slug: "septiembre-2025", number: "03", year: "2025", title: "Septiembre de 2025", summary: "NASA Space Apps Challenge, astrobiología y diseño aeronáutico universitario.", color: "red", articleSlugs: [], externalUrl: "https://heyzine.com/flip-book/7a7fc16697.html#page/1", coverImage: "/editions/trayectorias.png" },
  { slug: "agosto-2025", number: "02", year: "2025", title: "Agosto de 2025", summary: "3I/ATLAS, creatividad científica y equipos universitarios en construcción.", color: "ink", articleSlugs: [], externalUrl: "https://heyzine.com/flip-book/9874b3c7ea.html", coverImage: "/editions/senales.png" },
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

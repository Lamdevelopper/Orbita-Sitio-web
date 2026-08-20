import type { Article } from "../lib/content";

// Local branded artwork keeps draft stories usable when no editorial image has
// been approved yet. Replace it with an article-specific asset once available;
// do not add remote image hotlinks to the static fallback dataset.
const editorialPlaceholderImage = "/og.png";

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
    image: editorialPlaceholderImage,
    imageCaption: "Imagen editorial provisional de Órbita; sustituir cuando exista una portada aprobada.",
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
    image: editorialPlaceholderImage,
    imageCaption: "Imagen editorial provisional de Órbita; sustituir cuando exista una portada aprobada.",
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
    image: editorialPlaceholderImage,
    imageCaption: "Imagen editorial provisional de Órbita; sustituir cuando exista una portada aprobada.",
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
    image: editorialPlaceholderImage,
    imageCaption: "Imagen editorial provisional de Órbita; sustituir cuando exista una portada aprobada.",
    edition: "en-preparacion",
    body: [{ paragraphs: ["Un material espacial debe tolerar ciclos térmicos, radiación, vibración y vacío. Probarlo significa acelerar condiciones y observar cómo cambia antes de confiarle una misión."] }],
  },
  {
    slug: "cuando-el-corazon-humano-latio-desde-la-orbita-lunar",
    category: "Bitácora Espacial",
    title: "Cuando el corazón humano latió desde la órbita lunar",
    dek: "El Dr. Ramiro Iglesias Leal y la interpretación del primer electrocardiograma transmitido desde el espacio profundo.",
    author: "Fernando Rodríguez Solana",
    authorSlug: "fernando-rodriguez-solana",
    readingMinutes: 5,
    published: "marzo 2026",
    image: "/articles/archive/heart-orbit-hero.png",
    imageCaption: "La Tierra vista desde la oscuridad del espacio, imagen usada en la portada original de Órbita No. 9.",
    edition: "marzo-2026",
    sourceLabel: "Publicado originalmente en Órbita No. 9 · Marzo 2026. Texto recompuesto a partir de las páginas 10–15 de la edición impresa.",
    body: [
      {
        heading: "El origen de la medicina aeroespacial",
        paragraphs: [
          "La exploración espacial abrió una pregunta tan urgente como ambiciosa: ¿puede el cuerpo humano sobrevivir y adaptarse fuera de la Tierra? Desde los primeros satélites hasta las misiones lunares, cada avance tecnológico obligó a entender mejor la fisiología en un entorno desconocido.",
          "Durante las primeras décadas de la carrera espacial, la microgravedad, la radiación cósmica, el confinamiento y el estrés operacional representaban desafíos inéditos. Por eso el monitoreo biomédico se volvió una prioridad para los programas tripulados.",
          "Entre las herramientas decisivas estuvo el electrocardiograma. Registrar la actividad eléctrica del corazón y transmitirla a estaciones en la Tierra permitió vigilar a las tripulaciones mientras volaban y construir la primera evidencia sobre la adaptación cardiovascular en el espacio.",
          "En ese contexto, el cardiólogo mexicano Ramiro Iglesias Leal participó en la interpretación de un electrocardiograma transmitido desde una de las misiones más emblemáticas de la exploración espacial.",
        ],
        image: { url: "/articles/archive/heart-ramiro-iglesias.png", caption: "Ramiro Iglesias Leal durante una conferencia. Fuente: Ciencia MX." },
      },
      {
        heading: "La vigilancia médica en las primeras misiones",
        paragraphs: [
          "Desde el inicio de la era espacial, las agencias entendieron que la seguridad de los astronautas dependía tanto de la ingeniería de las naves como de comprender los cambios fisiológicos producidos por el vuelo.",
          "La telemetría biomédica permitió enviar en tiempo real la frecuencia cardiaca, la respiración, la presión arterial y la actividad eléctrica del corazón. Esos registros ayudaban a evaluar la salud de la tripulación y ofrecían datos científicos sobre la adaptación a la microgravedad.",
          "A través de sensores colocados en el tórax, los especialistas podían analizar el ritmo cardiaco desde estaciones terrestres. En los años sesenta, transmitir datos biomédicos desde el espacio exigía sistemas complejos, pero su desarrollo hizo posible vigilar misiones cada vez más largas y distantes.",
        ],
        image: { url: "/articles/archive/heart-ultrasound.png", caption: "Chris Hadfield realiza una exploración médica mediante ultrasonido a bordo de la Estación Espacial Internacional. Fuente: Escudo Digital." },
      },
      {
        heading: "La misión que cambió la historia de la exploración espacial",
        paragraphs: [
          "En diciembre de 1968, Apollo 8 se convirtió en la primera misión tripulada en abandonar la órbita terrestre, viajar hasta la Luna y entrar en órbita alrededor de ella. Frank Borman, James Lovell y William Anders demostraron que las misiones lunares eran posibles.",
          "Además de sus objetivos de navegación y reconocimiento, la misión registró cómo respondía el organismo durante un viaje de varios días y a una distancia mucho mayor que la de los vuelos anteriores.",
          "Los electrocardiogramas transmitidos desde la nave permitieron evaluar la respuesta fisiológica de los astronautas ante el estrés del vuelo, las maniobras orbitales y la microgravedad prolongada.",
        ],
        image: { url: "/articles/archive/heart-apollo8.png", caption: "La tripulación de Apollo 8 durante pruebas previas al vuelo. Fuente: NASA." },
      },
      {
        paragraphs: [],
        image: { url: "/articles/archive/heart-space-suit.png", caption: "Preparación y verificación de un traje espacial antes de una misión. Fuente: Spacelabs Healthcare." },
      },
      {
        heading: "Un cardiólogo mexicano en la historia de la medicina espacial",
        paragraphs: [
          "Dentro del equipo internacional que analizaba los datos biomédicos se encontraba Ramiro Iglesias Leal. Su trabajo consistió en evaluar registros electrocardiográficos obtenidos por telemetría y buscar alteraciones del ritmo asociadas con las condiciones del vuelo.",
          "Su participación fue notable para la medicina latinoamericana. En una época dominada por Estados Unidos y la Unión Soviética, la colaboración internacional permitió que especialistas de distintos países contribuyeran a interpretar los datos de las misiones espaciales.",
          "Los resultados mostraron que el corazón humano podía mantener un funcionamiento adecuado en microgravedad, aunque también revelaron adaptaciones como cambios en la distribución de fluidos corporales y variaciones en la frecuencia cardiaca.",
        ],
        image: { url: "/articles/archive/heart-ecg.png", caption: "Registro electrocardiográfico de William Anders. Tomado de Iglesias Leal, Cardiología aeroespacial (2012)." },
      },
      {
        paragraphs: [],
        image: { url: "/articles/archive/heart-ramiro-portrait.png", caption: "Ramiro Iglesias Leal, pionero de la cardiología espacial y la telemedicina." },
      },
      {
        heading: "El corazón humano más allá de la Tierra",
        paragraphs: [
          "El registro de electrocardiogramas confirmó que el sistema cardiovascular puede adaptarse a condiciones extremas. En microgravedad, los fluidos corporales se redistribuyen hacia la parte superior del cuerpo y cambian la dinámica circulatoria, el retorno venoso y la regulación del volumen sanguíneo.",
          "La interpretación de los registros obtenidos durante las primeras misiones permitió comprender mejor esos procesos y desarrollar protocolos para vuelos posteriores. Con el tiempo, la medicina aeroespacial incorporó ultrasonido, análisis metabólicos y sistemas de telemetría más avanzados.",
          "Hoy los astronautas de la Estación Espacial Internacional siguen siendo monitoreados con sistemas biomédicos sofisticados. Muchos de esos procedimientos tienen su origen en las experiencias de la era Apollo.",
        ],
        image: { url: "/articles/archive/heart-iss-exercise.png", caption: "Monitoreo biomédico de un astronauta a bordo de la Estación Espacial Internacional. Fuente: NASA." },
      },
      {
        heading: "Un legado poco conocido",
        paragraphs: [
          "La participación de médicos latinoamericanos en la historia espacial suele quedar fuera de los relatos más conocidos. La contribución de Iglesias Leal muestra cómo el conocimiento médico puede cruzar fronteras y sostener proyectos científicos de alcance global.",
          "Interpretar una señal cardiaca puede parecer una tarea cotidiana, pero hacerlo con un registro enviado desde una nave que orbitaba la Luna representó un desafío completamente nuevo. Aquellos datos fueron, en cierto sentido, los primeros latidos humanos escuchados más allá de la Tierra.",
        ],
      },
      {
        heading: "Mirando hacia el futuro",
        paragraphs: [
          "Las misiones que buscan regresar a la Luna y llegar a Marte plantean desafíos médicos mayores: exposición prolongada a la microgravedad y la radiación, aislamiento y viajes de varios años.",
          "La medicina aeroespacial seguirá desarrollando estrategias para proteger a las tripulaciones. La historia de Iglesias Leal recuerda que explorar el espacio no es sólo una hazaña tecnológica: también depende de comprender cómo responde el cuerpo humano.",
          "Cada avance acerca la posibilidad de explorar y habitar otros mundos. El legado de aquellos primeros electrocardiogramas demuestra que, incluso a cientos de miles de kilómetros, el corazón humano sigue siendo una señal que la medicina puede escuchar y comprender.",
        ],
        image: { url: "/articles/archive/heart-mars-habitat.png", caption: "Simulación de hábitat en Marte para estudiar la salud y adaptación humana en misiones de larga duración." },
      },
    ],
  },
  {
    slug: "mecanica-cuantica-en-el-espacio",
    category: "Bitácora Espacial",
    title: "¿Mecánica cuántica en el espacio?",
    dek: "Cómo la computación cuántica y la inteligencia artificial podrían transformar el sector aeroespacial.",
    author: "Cristofer Cisneros",
    authorSlug: "cristofer-cisneros",
    readingMinutes: 5,
    published: "agosto 2025",
    image: "/articles/archive/quantum-circuit-hero.png",
    imageCaption: "Circuitos y líneas de información cuántica. Imagen de portada de la edición original.",
    edition: "agosto-2025",
    sourceLabel: "Publicado originalmente en Órbita No. 2 · Agosto 2025. Texto revisado a partir de las páginas 11–14 de la edición impresa.",
    body: [
      {
        heading: "Contexto",
        paragraphs: [
          "El año 2025 fue designado por la UNESCO como el Año Internacional de la Ciencia y la Tecnología Cuántica, al cumplirse un siglo de las primeras herramientas matemáticas para explicar los fenómenos del mundo cuántico.",
          "Desde entonces, ese conocimiento ha impulsado avances que van del LED a la miniaturización de los circuitos electrónicos. La electrónica y la mecánica cuántica también hicieron posible la computación cuántica, basada en la superposición y el entrelazamiento de partículas.",
          "A diferencia de los bits clásicos, los qubits pueden representar una combinación de estados. La tecnología todavía es joven, pero ya se estudia para problemas de criptografía, telecomunicaciones, medicina, biología y análisis de riesgos.",
        ],
        image: { url: "/articles/archive/quantum-computer.png", caption: "Ordenador cuántico de IQM. Fuente: Business Wire." },
      },
      {
        heading: "Computación cuántica y cohetes",
        paragraphs: [
          "El crecimiento del sector aeroespacial ha aumentado la necesidad de optimizar materiales, combustibles, trayectorias y procesos. Diseñar un satélite o un cohete reutilizable exige coordinar recursos materiales, humanos y económicos, con poco margen para el desperdicio.",
          "La computación cuántica podría ayudar en grandes simulaciones y procesos de optimización. Su potencial incluye estudiar materiales de alta entropía y moléculas de combustible bajo distintas condiciones, aunque sus resultados siguen limitados por el número y la estabilidad de los qubits disponibles.",
        ],
        image: { url: "/articles/archive/quantum-simulations.png", caption: "Simulación de un vehículo aeroespacial. Fuente: vrx123/stock.adobe.com, vía CORDIS." },
      },
      {
        heading: "IA aeroespacial",
        paragraphs: [
          "La inteligencia artificial ya se utiliza para resolver problemas científicos complejos y puede tener un papel en la gestión del tráfico aéreo, los riesgos, la eficiencia de los planes de vuelo y la asistencia a la operación de vehículos.",
          "En el sector espacial, cualquier sistema autónomo debe operar con estándares rigurosos de seguridad y criterios éticos. La autonomía puede ampliar las capacidades de satélites, sondas y naves, pero no elimina la necesidad de supervisión humana.",
        ],
        image: { url: "/articles/archive/quantum-ai-hand.png", caption: "Representación de inteligencia artificial aplicada al diseño aeroespacial." },
      },
      {
        heading: "IA y computación cuántica",
        paragraphs: [
          "La inteligencia artificial cuántica busca combinar el aprendizaje automático con las capacidades de cálculo y optimización de los ordenadores cuánticos. En teoría, esa combinación podría acelerar ciertos algoritmos y ayudar a explorar espacios de soluciones demasiado grandes para una computadora clásica.",
          "El campo todavía está en una etapa temprana. Por eso conviene separar las posibilidades de investigación de las aplicaciones ya disponibles: el futuro es prometedor, pero depende de avances en hardware, control de errores y métodos verificables.",
        ],
        image: { url: "/articles/archive/quantum-ai-robot.png", caption: "Representación de un sistema de inteligencia artificial." },
      },
      {
        heading: "Un horizonte compartido",
        paragraphs: [
          "La combinación de computación cuántica e inteligencia artificial podría influir en el desarrollo de materiales, combustibles, protocolos de actuación, gestión de riesgos, asistencia de vuelo y operación de satélites o estaciones espaciales.",
          "Aún queda mucho por aprender sobre la mecánica cuántica y sus dispositivos. Si esas tecnologías maduran de forma segura y sostenible, podrían ampliar las herramientas de industrias como la biología, la medicina, la farmacología, la ciencia de datos y la exploración espacial.",
        ],
      },
    ],
  },
];

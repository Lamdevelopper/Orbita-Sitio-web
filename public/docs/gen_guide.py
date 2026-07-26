"""Build the writer handoff guide used by the Orbita CMS.

The PDF intentionally documents the parser contract in ``lib/submission.ts``:
plain metadata lines, a ``---`` separator, Markdown headings/quotes, and the
explicit image block understood by the current importer.
"""

from pathlib import Path
import os
import textwrap

from fpdf import FPDF


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = Path("C:/Windows/Fonts")
OUTPUT = ROOT / "public" / "docs" / "Guia_entrega_articulos_Orbita.pdf"

NAVY = (23, 35, 67)
BLUE = (80, 106, 184)
CORAL = (198, 70, 58)
INK = (28, 34, 48)
MUTED = (96, 112, 138)
PAPER = (246, 247, 250)
LINE = (220, 225, 234)
WHITE = (255, 255, 255)


class GuidePDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        for name, style, filename in (
            ("DejaVu", "", "DejaVuSans.ttf"),
            ("DejaVu", "B", "DejaVuSans-Bold.ttf"),
            ("DejaVuSerif", "", "DejaVuSerif.ttf"),
            ("DejaVuSerif", "B", "DejaVuSerif-Bold.ttf"),
            ("DejaVuSerif", "I", "DejaVuSerif-Italic.ttf"),
            ("DejaVuMono", "", "DejaVuSansMono.ttf"),
        ):
            self.add_font(name, style, str(FONT_DIR / filename))
        self.set_margins(16, 14, 16)
        self.set_auto_page_break(auto=True, margin=17)

    def footer(self):
        self.set_y(-12)
        self.set_font("DejaVu", "", 7.5)
        self.set_text_color(*MUTED)
        self.cell(0, 6, f"Orbita - Aerospace AAFI  |  Guia de colaboracion  |  Pagina {self.page_no()}/{{nb}}", align="C")


def wrap_code(text: str, width: int = 88):
    lines = []
    for raw in text.splitlines():
        if not raw:
            lines.append("")
            continue
        wrapped = textwrap.wrap(
            raw,
            width=width,
            replace_whitespace=False,
            drop_whitespace=False,
            break_long_words=False,
            break_on_hyphens=False,
        )
        lines.extend(wrapped or [""])
    return lines


def add_header(pdf: GuidePDF, eyebrow: str, title: str, subtitle: str | None = None):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("DejaVu", "B", 8.5)
    pdf.set_text_color(*CORAL)
    pdf.cell(0, 5, eyebrow.upper(), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("DejaVu", "B", 19)
    pdf.set_text_color(*NAVY)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 8, title)
    if subtitle:
        pdf.set_font("DejaVuSerif", "", 10.5)
        pdf.set_text_color(*MUTED)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, subtitle)
    pdf.ln(5)


def add_heading(pdf: GuidePDF, title: str, level: int = 2):
    if level == 1:
        size, height, color, before = 15, 7, NAVY, 3
    else:
        size, height, color, before = 10.8, 5.5, BLUE, 5
    pdf.ln(before)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("DejaVu", "B", size)
    pdf.set_text_color(*color)
    pdf.multi_cell(0, height, title)
    pdf.ln(1)


def add_body(pdf: GuidePDF, text: str, size: float = 9.5, color=INK, after: float = 2.5):
    pdf.set_font("DejaVuSerif", "", size)
    pdf.set_text_color(*color)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 4.8, text)
    pdf.ln(after)


def add_bullet(pdf: GuidePDF, lead: str, text: str, size: float = 9):
    pdf.set_x(pdf.l_margin + 3)
    pdf.set_font("DejaVu", "B", size)
    pdf.set_text_color(*INK)
    pdf.cell(pdf.get_string_width("- ") + pdf.get_string_width(lead), 4.5, "- " + lead)
    pdf.set_font("DejaVuSerif", "", size)
    pdf.multi_cell(0, 4.5, text)
    pdf.ln(0.8)


def add_code(pdf: GuidePDF, text: str, *, label: str | None = None, font_size: float = 7.3, line_height: float = 4.25, fill=PAPER):
    if label:
        pdf.set_font("DejaVu", "B", 8)
        pdf.set_text_color(*BLUE)
        pdf.cell(0, 4.5, label.upper(), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)
    lines = wrap_code(text)
    padding_x = 4
    padding_y = 3
    height = padding_y * 2 + line_height * len(lines) + 1
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.25)
    x = pdf.l_margin
    y = pdf.get_y()
    width = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.rect(x, y, width, height, "DF")
    pdf.set_xy(x + padding_x, y + padding_y)
    pdf.set_font("DejaVuMono", "", font_size)
    pdf.set_text_color(*INK)
    for line in lines:
        pdf.cell(width - (padding_x * 2), line_height, line, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(x + padding_x)
    pdf.set_y(y + height + 3)


def add_callout(pdf: GuidePDF, label: str, text: str, *, tone: str = "blue"):
    color = BLUE if tone == "blue" else CORAL
    fill = (235, 240, 252) if tone == "blue" else (253, 239, 236)
    lines = textwrap.wrap(text, width=100)
    height = 8 + len(lines) * 4.5
    x = pdf.l_margin
    y = pdf.get_y()
    width = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.6)
    pdf.rect(x, y, width, height, "DF")
    pdf.set_xy(x + 5, y + 4)
    pdf.set_font("DejaVu", "B", 8.5)
    pdf.set_text_color(*color)
    pdf.cell(0, 4.5, label.upper(), new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(x + 5)
    pdf.set_font("DejaVuSerif", "", 9)
    pdf.set_text_color(*INK)
    pdf.multi_cell(width - 10, 4.5, text)
    pdf.set_y(y + height + 4)


def add_rule(pdf: GuidePDF):
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.3)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(4)


def build_pdf(path: str | Path = OUTPUT):
    pdf = GuidePDF()
    pdf.alias_nb_pages()

    # Page 1 - orientation and handoff flow.
    pdf.add_page()
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, pdf.w, 68, "F")
    pdf.set_xy(pdf.l_margin, 13)
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(*CORAL)
    pdf.cell(0, 5, "GUIA DE COLABORACION", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("DejaVu", "B", 27)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 11, "Como entregar tu articulo", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVuSerif", "I", 11)
    pdf.set_text_color(220, 226, 242)
    pdf.multi_cell(0, 5.5, "Una carpeta ordenada, una plantilla Markdown y una vista previa antes de publicar.")
    pdf.set_y(76)
    add_callout(pdf, "La regla de oro", "No necesitas diseñar la pagina ni subir nada al sitio. Entrega el texto y sus imagenes juntos; el equipo editorial revisa, corrige y publica.")
    add_heading(pdf, "El proceso en cinco pasos", 1)
    steps = [
        ("Crea", "una carpeta con un nombre corto relacionado con tu articulo."),
        ("Copia", "la plantilla Markdown y guardala como articulo.md."),
        ("Escribe", "sin borrar los campos ni el separador --- entre metadatos y texto."),
        ("Agrega", "las imagenes dentro de la misma carpeta y usa sus nombres exactos."),
        ("Entrega", "la carpeta o el ZIP por el medio acordado con el responsable editorial."),
    ]
    for index, (lead, detail) in enumerate(steps, start=1):
        pdf.set_x(pdf.l_margin + 3)
        pdf.set_font("DejaVu", "B", 10)
        pdf.set_text_color(*BLUE)
        pdf.cell(8, 5, f"0{index}")
        pdf.set_font("DejaVu", "B", 9.5)
        pdf.set_text_color(*INK)
        pdf.cell(pdf.get_string_width(lead) + 2, 5, lead)
        pdf.set_font("DejaVuSerif", "", 9.5)
        pdf.multi_cell(0, 5, detail)
        pdf.ln(1)
    add_rule(pdf)
    add_heading(pdf, "Que hara el editor", 2)
    add_bullet(pdf, "Vista previa: ", "comprobara que el texto, las imagenes y los pies de foto correspondan.")
    add_bullet(pdf, "Correccion: ", "podra pedir datos faltantes o ajustar el formato antes de publicar.")
    add_bullet(pdf, "Publicacion: ", "el articulo pasara por el CMS como borrador y solo despues se hara publico.")
    add_body(pdf, "La plantilla es un acuerdo de trabajo: si una entrega necesita algo diferente, pregunta antes de cambiar sus etiquetas.", size=9, color=MUTED, after=0)

    # Page 2 - folder and copyable Markdown template.
    pdf.add_page()
    add_header(pdf, "01  Preparacion", "La carpeta y la plantilla", "Todo lo necesario para publicar debe viajar junto.")
    add_code(pdf, "mi-articulo-cansat/\n  articulo.md\n  portada.jpg\n  imagenes/\n    equipo-antes-del-lanzamiento.jpg\n    detalle-del-sensor.webp", label="Ejemplo de carpeta", font_size=7.6)
    add_bullet(pdf, "Nombres limpios: ", "usa letras, numeros, guiones y una sola extension. Evita IMG_0042 final FINAL.jpg.")
    add_bullet(pdf, "Formatos: ", "JPG, PNG o WebP. El limite actual del CMS es de 10 MB por imagen.")
    add_bullet(pdf, "Una fuente: ", "incluye un solo articulo.md o articulo.txt en la carpeta principal.")
    add_rule(pdf)
    add_header(pdf, "02  Plantilla", "Copia este Markdown", "Completa los datos de arriba y escribe el cuerpo debajo del separador.")
    template = """TÍTULO: La primera misión de nuestro equipo CanSat
AUTOR: Andrea Pérez López
CATEGORÍA: Ingeniería
SUBTÍTULO: Diseñar un satélite del tamaño de una lata
EDICIÓN: julio-2026
TIEMPO DE LECTURA: 8

---

## Una misión pequeña con preguntas grandes

Escribe aquí el primer párrafo de tu artículo.

> Una cita breve y atribuida. - Nombre, cargo o fuente.

## El día del lanzamiento

Continúa aquí la historia. Deja una línea vacía entre párrafos.

[IMAGEN 1]
RUTA: imagenes/equipo-antes-del-lanzamiento.jpg
PIE DE FOTO: El equipo revisa la telemetría antes del lanzamiento. Foto: Andrea Pérez."""
    add_code(pdf, template, label="Plantilla lista para copiar", font_size=6.85, line_height=3.85)
    add_callout(pdf, "Importante", "Usa SUBTÍTULO, no BAJADA. El tiempo de lectura debe ser un número entero entre 1 y 90 minutos. El editor podrá ajustarlo.", tone="red")

    # Page 3 - syntax guide.
    pdf.add_page()
    add_header(pdf, "03  Escritura", "Markdown sin complicaciones", "Solo necesitas cuatro señales para que el editor entienda la estructura.")
    add_heading(pdf, "Señales que sí reconoce el CMS", 1)
    add_code(pdf, "## Este texto se convierte en un subtítulo\n\nEste es un párrafo normal.\n\n> Esta línea se convierte en una cita destacada.", label="Texto y jerarquía", font_size=7.4)
    add_bullet(pdf, "Subtítulos: ", "comienza la línea con ## y deja una línea vacía antes y después.")
    add_bullet(pdf, "Párrafos: ", "separa los párrafos con una línea vacía para que sean fáciles de revisar.")
    add_bullet(pdf, "Citas: ", "usa > al inicio. Escribe la atribución en la misma línea para que no se pierda.")
    add_rule(pdf)
    add_heading(pdf, "Imágenes en el lugar correcto", 1)
    add_body(pdf, "El bloque aparece exactamente donde lo coloques dentro del texto. La RUTA debe coincidir con el nombre del archivo que entregas.")
    add_code(pdf, "[IMAGEN 1]\nRUTA: imagenes/detalle-del-sensor.webp\nPIE DE FOTO: El sensor registra la temperatura durante la prueba. Foto: Andrea Pérez.", label="Bloque de imagen", font_size=7.2)
    add_bullet(pdf, "Orden: ", "numera los bloques como [IMAGEN 1], [IMAGEN 2], [IMAGEN 3]...")
    add_bullet(pdf, "Pie de foto: ", "explica qué aparece, dónde ocurre, quién participa y quién tomó la foto.")
    add_bullet(pdf, "Crédito: ", "si la imagen pertenece a otra persona, institución o archivo, escríbelo en el PIE DE FOTO.")
    add_callout(pdf, "No pegues fotos dentro del texto", "Entrega las imágenes como archivos separados. Así el editor puede revisar su calidad, recortarlas y conservar sus créditos.")
    add_heading(pdf, "Fuentes y datos", 2)
    add_body(pdf, "Si el artículo utiliza datos, declaraciones o información externa, escribe la fuente completa al final del texto: institución, documento o enlace y fecha de consulta.", size=9)
    add_code(pdf, "Fuente: NASA, Artemis II Mission Overview, https://www.nasa.gov/\nConsulta: 25 de julio de 2026", font_size=7.3)

    # Page 4 - complete example.
    pdf.add_page()
    add_header(pdf, "04  Ejemplo", "Un artículo completo", "Este archivo puede copiarse y adaptarse para una entrega real.")
    example = """TÍTULO: La primera misión de nuestro equipo CanSat
AUTOR: Andrea Pérez López
CATEGORÍA: Ingeniería
SUBTÍTULO: Diseñar un satélite del tamaño de una lata nos enseñó a convertir límites reales en decisiones.
EDICIÓN: julio-2026
TIEMPO DE LECTURA: 8

---

## Una misión pequeña con preguntas grandes

Nuestro equipo comenzó con una pregunta sencilla: ¿cuántos sistemas podíamos integrar dentro del volumen de una lata sin perder confiabilidad?

Durante tres meses diseñamos la alimentación, la telemetría y el sistema de recuperación. Cada prueba dejó datos y una lista clara de cambios.

> El prototipo mejoró cuando dejamos de ocultar los errores y empezamos a documentarlos. - Andrea Pérez, responsable de telemetría.

## El día del lanzamiento

La mañana del lanzamiento revisamos conexiones, batería y recepción de datos. El descenso fue estable y recuperamos el CanSat sin daños.

[IMAGEN 1]
RUTA: equipo-antes-del-lanzamiento.jpg
PIE DE FOTO: El equipo verifica la telemetría minutos antes del lanzamiento. Foto: Andrea Pérez.

## Lo que sigue

La siguiente versión incorporará un sensor ambiental y una carcasa más ligera. También publicaremos el registro de pruebas para que otros equipos puedan aprender del proceso."""
    add_code(pdf, example, label="articulo.md", font_size=6.7, line_height=3.65)
    add_callout(pdf, "La idea", "El texto conserva su voz. Los encabezados, citas e imágenes solo le indican al editor cómo convertirlo en una historia legible.")

    # Page 5 - checklist and handoff.
    pdf.add_page()
    add_header(pdf, "05  Entrega", "Revisa antes de enviar", "Una revisión de dos minutos evita la mayoría de las correcciones posteriores.")
    checklist = [
        "El archivo se llama articulo.md o articulo.txt.",
        "TÍTULO, AUTOR y CATEGORÍA están completos.",
        "SUBTÍTULO resume la historia en una o dos frases.",
        "TIEMPO DE LECTURA contiene un número entero en minutos.",
        "La línea --- aparece sola entre los datos y el cuerpo.",
        "Los subtítulos comienzan con ## y las citas con >.",
        "Cada imagen tiene un bloque [IMAGEN N].",
        "Cada RUTA coincide con el nombre real del archivo.",
        "Cada imagen tiene PIE DE FOTO y crédito cuando corresponde.",
        "Revisaste ortografía, nombres propios, cifras, fuentes y enlaces.",
    ]
    x = pdf.l_margin
    y = pdf.get_y()
    height = 8 + len(checklist) * 6
    width = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.set_fill_color(*PAPER)
    pdf.set_draw_color(*LINE)
    pdf.rect(x, y, width, height, "DF")
    pdf.set_xy(x + 5, y + 5)
    pdf.set_font("DejaVu", "B", 10.5)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 5, "Checklist editorial", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 8.8)
    pdf.set_text_color(*INK)
    for item in checklist:
        pdf.set_x(x + 6)
        pdf.cell(7, 5.5, "[ ]")
        pdf.multi_cell(width - 18, 5.5, item)
    pdf.set_y(y + height + 8)
    add_heading(pdf, "Cómo enviar la carpeta", 1)
    add_bullet(pdf, "Carpeta: ", "si el equipo editorial te indicó una carpeta compartida, conserva los nombres y rutas.")
    add_bullet(pdf, "ZIP: ", "en Windows, clic derecho sobre la carpeta > Comprimir en archivo ZIP.")
    add_bullet(pdf, "Nombre: ", "usa apellido-titulo-corto.zip. Ejemplo: perez-mision-cansat.zip.")
    add_bullet(pdf, "Mensaje: ", "incluye tu nombre, el título y cualquier dato importante sobre las imágenes o fuentes.")
    add_rule(pdf)
    add_heading(pdf, "Qué pasa después", 2)
    add_bullet(pdf, "1. Vista previa: ", "el editor comprueba que el texto y las imágenes estén completos.")
    add_bullet(pdf, "2. Corrección: ", "si falta algo, podrás corregirlo antes de publicar.")
    add_bullet(pdf, "3. Publicación: ", "el equipo decide cuándo pasa de borrador a publicado.")
    add_callout(pdf, "¿Dudas?", "Pregunta antes de cambiar las etiquetas de la plantilla. Una pregunta breve suele ahorrar una ronda completa de correcciones.", tone="red")

    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output))
    print(f"PDF generado: {output} ({pdf.page_no()} paginas)")


if __name__ == "__main__":
    import sys

    build_pdf(sys.argv[1] if len(sys.argv) > 1 else OUTPUT)

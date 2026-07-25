from fpdf import FPDF
import os

class GuidePDF(FPDF):
    def __init__(self):
        super().__init__()
        font_dir = 'C:/Windows/Fonts'
        for name, style, file in [
            ('DejaVu', '', 'DejaVuSans.ttf'),
            ('DejaVu', 'B', 'DejaVuSans-Bold.ttf'),
            ('DejaVuSerif', '', 'DejaVuSerif.ttf'),
            ('DejaVuSerif', 'B', 'DejaVuSerif-Bold.ttf'),
            ('DejaVuSerif', 'I', 'DejaVuSerif-Italic.ttf'),
            ('DejaVuMono', '', 'DejaVuSansMono.ttf'),
        ]:
            self.add_font(name, style, os.path.join(font_dir, file))
    def header(self):
        pass
    def footer(self):
        self.set_y(-12)
        self.set_font('DejaVu', '', 7)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f'\u00d3rbita \u00b7 Aerospace AAFI \u00b7 P\u00e1gina {self.page_no()}/{{nb}}', align='C')

def build_pdf(path):
    pdf = GuidePDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(16, 12, 16)
    pdf.add_page()

    # Banner
    pdf.set_fill_color(30, 30, 40)
    pdf.rect(0, 0, 210, 52, 'F')
    pdf.set_y(12)
    pdf.set_font('DejaVu', 'B', 20)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 9, '\u00d3RBITA', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('DejaVuSerif', 'I', 11)
    pdf.set_text_color(190, 195, 210)
    pdf.cell(0, 6, 'Gu\u00eda de colaboraci\u00f3n', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(5)
    pdf.set_font('DejaVu', 'B', 10.5)
    pdf.set_text_color(50, 50, 60)
    pdf.cell(0, 6, 'C\u00f3mo entregar tu art\u00edculo', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('DejaVuSerif', 'I', 9)
    pdf.set_text_color(90, 90, 100)
    txt = 'Una carpeta ordenada con tu texto e im\u00e1genes. El editor revisa, da formato y publica.'
    pdf.cell(0, 5, txt, align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)
    pdf.set_draw_color(200, 200, 200)
    pdf.set_line_width(0.4)
    pdf.line(pdf.l_margin, pdf.get_y(), 210 - pdf.r_margin, pdf.get_y())
    pdf.ln(6)

    # Helper functions
    def section(n, title):
        pdf.set_font('DejaVu', 'B', 11.5)
        pdf.set_text_color(30, 30, 40)
        pdf.cell(0, 6, f'  {n}. {title}', new_x='LMARGIN', new_y='NEXT')
        pdf.ln(1)
    def body(t):
        pdf.set_font('DejaVuSerif', '', 9)
        pdf.set_text_color(50, 50, 55)
        pdf.multi_cell(0, 4.8, t)
        pdf.ln(1)
    def bullet(bold_part, rest):
        pdf.set_x(pdf.l_margin + 4)
        pdf.set_font('DejaVu', 'B', 9)
        pdf.set_text_color(50, 50, 55)
        w = pdf.get_string_width(bold_part)
        pdf.cell(w + 1, 4.5, bold_part)
        pdf.set_font('DejaVuSerif', '', 9)
        pdf.multi_cell(0, 4.5, rest)
        pdf.ln(0.3)
    def codes(text):
        pdf.ln(1)
        lines = text.split('\n')
        lh = 4.5
        bh = len(lines) * lh + 3
        ys = pdf.get_y()
        pdf.set_fill_color(245, 245, 248)
        pdf.rect(pdf.l_margin + 2, ys, 210 - pdf.l_margin - pdf.r_margin - 4, bh, 'F')
        pdf.set_x(pdf.l_margin + 4)
        pdf.set_font('DejaVuMono', '', 7.5)
        pdf.set_text_color(55, 55, 65)
        for line in lines:
            pdf.cell(0, lh, line, new_x='LMARGIN', new_y='NEXT')
            pdf.set_x(pdf.l_margin + 4)
        pdf.ln(3)
    def divider():
        pdf.set_draw_color(220, 220, 225)
        pdf.set_line_width(0.3)
        y = pdf.get_y()
        pdf.line(pdf.l_margin, y, 210 - pdf.r_margin, y)
        pdf.ln(3)
    def note(t):
        pdf.set_font('DejaVuSerif', 'I', 8.5)
        pdf.set_text_color(100, 100, 110)
        pdf.cell(0, 4.5, f'  \u2192 {t}', new_x='LMARGIN', new_y='NEXT')
        pdf.ln(1)

    section(1, 'Prepara una sola carpeta')
    body('Todo en una carpeta: el texto y las im\u00e1genes como archivos separados. Nada de pegar fotos dentro del documento.')
    codes('mi-articulo/\n  articulo.txt\n  foto-lanzamiento.jpg\n  equipo-en-vuelo.webp')
    bullet('Nombres limpios: ', 'Usa letras, n\u00fameros y guiones. Nada de IMG_0042 final FINAL.jpg.')
    bullet('Formato:         ', 'JPG, PNG o WebP, en la mayor resoluci\u00f3n disponible.')
    divider()

    section(2, 'Usa esta plantilla')
    body('Copia esto en articulo.txt o articulo.md. No ajustes tipograf\u00edas ni m\u00e1rgenes; el editor lo resuelve.')
    codes('TITULO:\nAUTOR:\nCATEGORIA:\nBAJADA:\nEDICION:\n\n---\n\n## Primer subtitulo\n\nTexto del art\u00edculo.\n\n> Una cita para destacar.\n\n[IMAGEN 1]\nRUTA: nombre-del-archivo.jpg\nPIE DE FOTO: Explica qu\u00e9 aparece, d\u00f3nde y qui\u00e9n tom\u00f3 la foto.')
    bullet('Importante: ', 'La l\u00ednea --- separa los datos del cuerpo. No la borres.')
    bullet('Se\u00f1ales:    ', '## convierte una l\u00ednea en subt\u00edtulo; > al inicio hace una cita.')
    bullet('Im\u00e1genes:   ', 'Numera en orden [IMAGEN 1], [IMAGEN 2]. Pon el bloque exactamente donde quieras que aparezca. RUTA debe coincidir letra por letra con el nombre del archivo.')
    divider()

    section(3, 'Ejemplo completo')
    body('As\u00ed se ve un art\u00edculo listo para entregar:')
    codes('TITULO: La primera misi\u00f3n de nuestro equipo CanSat\nAUTOR: Andrea P\u00e9rez L\u00f3pez\nCATEGORIA: Ingenier\u00eda\nBAJADA: Dise\u00f1ar un sat\u00e9lite del tama\u00f1o de una lata\n  nos ense\u00f1\u00f3 a convertir l\u00edmites en decisiones.\nEDICION: julio-2026\n\n---\n\n## Una misi\u00f3n peque\u00f1a con preguntas grandes\n\nDise\u00f1amos alimentaci\u00f3n, telemetr\u00eda y recuperaci\u00f3n.\nCada prueba dej\u00f3 datos y cambios claros.\n\n> El prototipo mejor\u00f3 cuando empezamos a\n> documentar los errores en vez de ocultarlos.\n\n[IMAGEN 1]\nRUTA: equipo-en-lanzamiento.jpg\nPIE DE FOTO: El equipo verifica la telemetr\u00eda antes\n  del lanzamiento. Foto: Andrea P\u00e9rez.')
    divider()

    section(4, 'Comprime y env\u00eda')
    bullet('', 'Windows: clic derecho > Comprimir en archivo ZIP. macOS: clic derecho > Comprimir.')
    bullet('', 'Nombra el ZIP: apellido-titulo-corto.zip (ej: perez-mision-cansat.zip).')
    bullet('', 'Adj\u00fantalo al responsable editorial por el medio acordado.')
    note('Si pesa mucho: comparte una carpeta de Drive con permiso de lectura y no muevas archivos despu\u00e9s de enviar el enlace.')
    pdf.ln(2)

    # Checklist
    y_box = pdf.get_y()
    box_h = 120
    pdf.set_fill_color(245, 245, 248)
    pdf.rect(pdf.l_margin, y_box, 210 - pdf.l_margin - pdf.r_margin, box_h, 'F')
    pdf.set_xy(pdf.l_margin + 4, y_box + 3.5)
    pdf.set_font('DejaVu', 'B', 10)
    pdf.set_text_color(30, 30, 40)
    pdf.cell(0, 5, 'Checklist antes de enviar', new_x='LMARGIN', new_y='NEXT')
    pdf.set_x(pdf.l_margin + 4)
    pdf.ln(1)

    checks = [
        'TITULO, AUTOR y CATEGORIA completos',
        'L\u00ednea --- entre los datos y el cuerpo',
        'Subt\u00edtulos con ##, citas con >',
        'Cada imagen tiene bloque [IMAGEN N] dentro de la carpeta',
        'RUTA coincide exactamente con el nombre del archivo',
        'Cada imagen tiene PIE DE FOTO con cr\u00e9dito',
        'Ortograf\u00eda, nombres propios, cifras y enlaces revisados',
        'El ZIP abre correctamente',
    ]
    for chk in checks:
        pdf.set_x(pdf.l_margin + 6)
        pdf.set_font('DejaVuMono', '', 7.5)
        pdf.set_text_color(80, 80, 90)
        pdf.cell(5, 4.5, '[ ]', new_x='END')
        pdf.set_x(pdf.l_margin + 14)
        pdf.set_font('DejaVuSerif', '', 8.5)
        pdf.set_text_color(50, 50, 55)
        pdf.cell(0, 4.5, chk, new_x='LMARGIN', new_y='NEXT')
        pdf.set_x(pdf.l_margin + 4)

    pdf.ln(4)
    pdf.set_font('DejaVuSerif', 'I', 8.5)
    pdf.set_text_color(100, 100, 110)
    pdf.cell(0, 4.5, '  \u00bfDudas? Pregunta antes de cambiar la plantilla. Una l\u00ednea ahorra correcciones.', new_x='LMARGIN', new_y='NEXT')

    pdf.output(path)
    print(f'PDF generated: {path} ({pdf.page_no()} pages)')

if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/docs/Guia_entrega_articulos_Orbita.pdf'
    build_pdf(out)

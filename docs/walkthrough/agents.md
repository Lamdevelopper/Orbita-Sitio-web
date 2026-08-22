# docs/walkthrough - Guia Word para escritores

## build_guia.py

Genera `Guia_entrega_articulos_Orbita.docx` usando `python-docx`. 
La guia documenta el contrato del parser en `lib/submission.ts`.

### Contrato (lib/submission.ts)

Campos obligatorios: `TITULO`, `AUTOR`, `CATEGORIA` (acepta acentos o no, normaliza NFD).
Campos opcionales: `SUBTITULO` (o `BAJADA`), `EDICION`, `TIEMPO DE LECTURA` (entero 1-90).
Separador: `---` en linea propia.
Cuerpo: Markdown con `##`, `>`, `[IMAGEN N]` + `RUTA:` + `PIE DE FOTO:`.

### Estructura del documento

- **Pagina 1**: Portada + proceso en 5 pasos + que hara el editor
- **Pagina 2**: Preparacion de carpeta + plantilla Markdown completa
- **Pagina 3**: Sintaxis de escritura (campos, separador, senales, imagenes)
- **Pagina 4**: Ejemplo completo de archivo listo para publicar
- **Pagina 5**: Checklist + instrucciones de envio

### Requisitos

- `python-docx >= 1.2.0`
- Calibri como fuente (disponible en Windows)

### Regenerar

```powershell
cd <repo>
python3 docs/walkthrough/build_guia.py
```

### Compatibilidad del DOCX entregado por edición

`edit_parser_guide.py` crea una copia `Guia_entrega_articulos_Orbita_parser-compatible.docx`
desde el archivo de Downloads y corrige únicamente las reglas descritas del parser:
metadatos en una línea, sin comas finales, separador `---`, `TIEMPO DE LECTURA` entre 1 y 90,
y bloques de imagen con `RUTA:` y `PIE DE FOTO:`.

import fitz, os

base = 'Ediciones_Extraer_articulos'
out = 'articulos_extraidos'
os.makedirs(out, exist_ok=True)

for f in sorted(os.listdir(base)):
    if not f.endswith('.pdf'):
        continue
    doc = fitz.open(os.path.join(base, f))
    lines = []
    for i, page in enumerate(doc):
        lines.append(f"--- PÁGINA {i+1} ---")
        lines.append(page.get_text())
    name = f.replace('.pdf', '') + '.txt'
    with open(os.path.join(out, name), 'w', encoding='utf-8') as fp:
        fp.write('\n\n'.join(lines))
    print(f'✓ {f}: {len(doc)} páginas')
    doc.close()
print('¡Listo!')

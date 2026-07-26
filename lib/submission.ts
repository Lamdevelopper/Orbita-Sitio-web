export interface ParsedSubmission {
  title: string;
  author: string;
  category: string;
  dek: string;
  edition?: string;
  readingMinutes?: number;
  body: string;
  images: Array<{ ref: string; fileName: string; caption: string }>;
}

function headerKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/**
 * Parse a writer's Markdown-compatible submission into structured article data.
 * Header keys tolerate missing accents for friendly handoffs; the canonical
 * template still uses the accented Spanish labels shown in the guide.
 */
export function parseSubmission(text: string): ParsedSubmission {
  const sepMatch = text.match(/\r?\n---\r?\n/);
  if (!sepMatch || sepMatch.index === undefined) {
    throw new Error("Formato inválido: falta el separador '---' después de los metadatos.");
  }

  const headerRaw = text.slice(0, sepMatch.index).trim();
  const bodyRaw = text.slice(sepMatch.index + sepMatch[0].length).trim();

  const fields: Record<string, string> = {};
  for (const line of headerRaw.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = headerKey(line.slice(0, colonIdx));
    fields[key] = line.slice(colonIdx + 1).trim();
  }

  if (!fields.TITULO) throw new Error("Formato inválido: falta 'TÍTULO' en los metadatos.");
  if (!fields.AUTOR) throw new Error("Formato inválido: falta 'AUTOR' en los metadatos.");
  if (!fields.CATEGORIA) throw new Error("Formato inválido: falta 'CATEGORÍA' en los metadatos.");

  const readingValue = fields["TIEMPO DE LECTURA"] || fields["TIEMPO DE LECTURA ESTIMADO"];
  const readingMinutes = readingValue
    ? Number(readingValue.match(/\d+/)?.[0] ?? NaN)
    : undefined;
  if (readingMinutes !== undefined && (!Number.isInteger(readingMinutes) || readingMinutes < 1 || readingMinutes > 90)) {
    throw new Error("Formato inválido: 'TIEMPO DE LECTURA' debe ser un número entero entre 1 y 90 minutos.");
  }

  // Keep image metadata one field per line so captions cannot consume body text.
  const imgBlockRegex =
    /\[IMAGEN (\d+)\][ \t]*\r?\nRUTA:[ \t]*([^\r\n]+)\r?\nPIE DE FOTO:[ \t]*([^\r\n]*)(?=\r?\n|$)/g;

  const images: ParsedSubmission["images"] = [];
  let match: RegExpExecArray | null;
  while ((match = imgBlockRegex.exec(bodyRaw)) !== null) {
    images.push({
      ref: `IMAGEN ${match[1]}`,
      fileName: match[2].trim(),
      caption: match[3].trim(),
    });
  }

  imgBlockRegex.lastIndex = 0;
  const body = bodyRaw.replace(imgBlockRegex, (_match: string, n: string) => `{{IMG:${n}}}`);

  return {
    title: fields.TITULO,
    author: fields.AUTOR,
    category: fields.CATEGORIA,
    dek: fields.SUBTITULO || fields.BAJADA || "",
    edition: fields.EDICION || undefined,
    readingMinutes,
    body,
    images,
  };
}

export interface ParsedSubmission {
  title: string;
  author: string;
  category: string;
  dek: string;
  edition?: string;
  body: string;
  images: Array<{ ref: string; fileName: string; caption: string }>;
}

/**
 * Parse a writer's .txt submission into a structured article object.
 *
 * Expected format:
 *
 *   TÍTULO: ...
 *   AUTOR: ...
 *   CATEGORÍA: ...
 *   BAJADA: ...
 *   EDICIÓN: ... (optional)
 *
 *   ---
 *
 *   Body text with ## headings, > quotes, and [IMAGEN N] blocks.
 *
 * Keys before `---` are case-insensitive; `---` separator is required.
 * Each [IMAGEN N] block in the body is replaced by a {{IMG:N}} marker,
 * and the image metadata (fileName, caption) is extracted into the images array.
 */
export function parseSubmission(text: string): ParsedSubmission {
  const sepMatch = text.match(/\r?\n---\r?\n/);
  if (!sepMatch || sepMatch.index === undefined) {
    throw new Error("Formato inválido: falta el separador '---' después de los metadatos.");
  }

  const headerRaw = text.slice(0, sepMatch.index).trim();
  const bodyRaw = text.slice(sepMatch.index + sepMatch[0].length).trim();

  // --- Parse header fields (case-insensitive keys) ---
  const fields: Record<string, string> = {};
  for (const line of headerRaw.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toUpperCase();
    const value = line.slice(colonIdx + 1).trim();
    fields[key] = value;
  }

  if (!fields["TÍTULO"]) throw new Error("Formato inválido: falta 'TÍTULO' en los metadatos.");
  if (!fields["AUTOR"]) throw new Error("Formato inválido: falta 'AUTOR' en los metadatos.");
  if (!fields["CATEGORÍA"]) throw new Error("Formato inválido: falta 'CATEGORÍA' en los metadatos.");

  // --- Extract image blocks from body ---
  // Image metadata is deliberately one line per field so the caption cannot
  // consume the article text that follows the block.
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

  // Replace image blocks with {{IMG:N}} markers for the body text
  imgBlockRegex.lastIndex = 0;
  const body = bodyRaw.replace(imgBlockRegex, (_match: string, n: string) => `{{IMG:${n}}}`);

  return {
    title: fields["TÍTULO"],
    author: fields["AUTOR"],
    category: fields["CATEGORÍA"],
    dek: fields["BAJADA"] || "",
    edition: fields["EDICIÓN"] || undefined,
    body,
    images,
  };
}

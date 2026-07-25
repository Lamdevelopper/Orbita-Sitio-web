import { env } from "cloudflare:workers";
import { isEditor } from "../../../lib/api";

type Runtime = { MEDIA?: R2Bucket };
const MAX_BYTES = 10 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const text = new TextDecoder("ascii").decode(bytes);
  if (type === "image/webp") return text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP";
  if (type === "image/gif") return text.startsWith("GIF87a") || text.startsWith("GIF89a");
  return false;
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !extensions[file.type])
    return Response.json({ error: "Usa una imagen JPG, PNG, WebP o GIF" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return Response.json({ error: "La imagen no puede exceder 10 MB" }, { status: 413 });

  const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!hasImageSignature(signature, file.type))
    return Response.json({ error: "El contenido del archivo no coincide con una imagen válida" }, { status: 400 });

  const bucket = (env as unknown as Runtime).MEDIA;
  if (!bucket) return Response.json({ error: "El almacenamiento de imágenes aún no está disponible" }, { status: 503 });

  const key = `editorial/${Date.now()}-${crypto.randomUUID()}.${extensions[file.type]}`;
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
      contentDisposition: "inline",
    },
  });
  return Response.json({ url: `/media/${key}` }, { status: 201 });
}

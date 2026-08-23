// Corrige las URLs de fuentes que vinext 0.0.50 deja con ruta absoluta de disco
// cuando se construye en Windows: fetchAndCacheFont escribe el caché con "/" pero
// _rewriteCachedFontCssToServedUrls compara contra un cacheDir generado con
// path.join ("\"), nunca coincide, y la reescritura a /assets/_vinext_fonts/ se
// salta en silencio. Los archivos sí se copian al bundle del cliente, así que
// basta con normalizar cualquier referencia absoluta residual al namespace servido.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const servedPrefix = "/assets/_vinext_fonts/";
// Cubre C:/... y C:\...\ (y variantes con minúscula) hasta el directorio de fuentes.
const absoluteFontPath = /[A-Za-z]:[\\/][^\s"'()]*\.vinext[\\/]fonts[\\/]/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

let filesFixed = 0;
let replacements = 0;
for (const file of walk(distDir)) {
  if (!/\.(js|mjs|css|html)$/.test(file)) continue;
  let content = readFileSync(file, "utf8");
  if (!absoluteFontPath.test(content)) continue;
  absoluteFontPath.lastIndex = 0;
  const matches = content.match(absoluteFontPath)?.length ?? 0;
  content = content.replace(absoluteFontPath, servedPrefix);
  writeFileSync(file, content);
  filesFixed += 1;
  replacements += matches;
  console.log(`[fix-font-paths] ${file}: ${matches} URLs corregidas`);
}

if (replacements === 0) {
  console.log("[fix-font-paths] sin rutas absolutas de fuentes que corregir");
} else {
  console.log(`[fix-font-paths] total: ${replacements} URLs en ${filesFixed} archivos`);
}

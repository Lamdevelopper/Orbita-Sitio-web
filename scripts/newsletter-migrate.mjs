import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { blindIndex, decryptEmail, encryptEmail, maskEmail } from "../lib/newsletter-crypto.ts";

const apply = process.argv.includes("--apply");
const rotate = process.argv.includes("--rotate");
const database = process.env.NEWSLETTER_D1_DATABASE;
const indexKey = process.env.NEWSLETTER_INDEX_KEY;
const keyVersion = Number(process.env.NEWSLETTER_KEY_VERSION ?? 1);
const keys = process.env.NEWSLETTER_ENCRYPTION_KEYS ? JSON.parse(process.env.NEWSLETTER_ENCRYPTION_KEYS) : {};
const currentKey = keys[String(keyVersion)] ?? process.env.NEWSLETTER_ENCRYPTION_KEY;

if (!database || !currentKey || !indexKey || !Number.isSafeInteger(keyVersion) || keyVersion < 1) {
  throw new Error("Configure NEWSLETTER_D1_DATABASE, NEWSLETTER_ENCRYPTION_KEY(S), NEWSLETTER_INDEX_KEY y NEWSLETTER_KEY_VERSION");
}

const wranglerBin = path.resolve("node_modules/wrangler/bin/wrangler.js");
function d1(sql) {
  const result = spawnSync(process.execPath, [wranglerBin, "d1", "execute", database, "--remote", "--json", "--command", sql], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Wrangler D1 fallo (${result.status}): ${result.stderr.trim()}`);
  const start = result.stdout.indexOf("[");
  if (start < 0) throw new Error("Wrangler no devolvio JSON");
  const payload = JSON.parse(result.stdout.slice(start));
  return payload.flatMap((entry) => Array.isArray(entry.results) ? entry.results : []);
}
function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }

async function backfillLegacy() {
  const legacy = d1("SELECT id, email FROM subscribers_legacy_0004 ORDER BY id");
  const prepared = [];
  const uniqueIndexes = new Set();
  for (const row of legacy) {
    const index = await blindIndex(String(row.email), indexKey);
    if (uniqueIndexes.has(index)) throw new Error("El preflight encontro correos legados duplicados; no se escribio nada");
    uniqueIndexes.add(index);
    const encrypted = await encryptEmail(String(row.email), currentKey, keyVersion);
    prepared.push({ id: Number(row.id), index, masked: maskEmail(String(row.email)), ...encrypted });
  }
  console.log(`Preflight legacy: ${prepared.length} filas, ${uniqueIndexes.size} indices unicos.`);
  if (!apply) return console.log("Dry run. Repite con --apply para escribir el backfill.");
  for (const row of prepared) {
    d1(`UPDATE subscribers SET email_ciphertext=${quote(row.ciphertext)}, email_nonce=${quote(row.nonce)}, email_blind_index=${quote(row.index)}, email_masked=${quote(row.masked)}, key_version=${row.keyVersion}, status='needs_reconfirmation', updated_at=${Date.now()} WHERE id=${row.id} AND email_ciphertext IS NULL`);
  }
  const [check] = d1("SELECT COUNT(*) AS total, SUM(CASE WHEN email_ciphertext IS NULL OR email_nonce IS NULL OR email_blind_index IS NULL OR email_masked IS NULL THEN 1 ELSE 0 END) AS missing, COUNT(DISTINCT email_blind_index) AS unique_indexes FROM subscribers");
  if (Number(check.missing) !== 0 || Number(check.total) !== prepared.length || Number(check.unique_indexes) !== prepared.length) throw new Error("La reconciliacion fallo; no ejecutes 0005");
  console.log(`Backfill verificado: ${check.total} filas, 0 campos faltantes.`);
}

async function rotateEncryption() {
  const rows = d1("SELECT id, email_ciphertext, email_nonce, key_version FROM subscribers WHERE email_ciphertext IS NOT NULL ORDER BY id");
  const prepared = [];
  const uniqueIndexes = new Set();
  for (const row of rows) {
    const oldKey = keys[String(row.key_version)] ?? (Number(row.key_version) === keyVersion ? currentKey : null);
    if (!oldKey) throw new Error(`Falta la clave para keyVersion ${row.key_version}`);
    const email = await decryptEmail({ ciphertext: String(row.email_ciphertext), nonce: String(row.email_nonce), keyVersion: Number(row.key_version) }, oldKey);
    const index = await blindIndex(email, indexKey);
    if (uniqueIndexes.has(index)) throw new Error("La rotacion encontro un blind index duplicado; no se escribio nada");
    uniqueIndexes.add(index);
    prepared.push({ id: Number(row.id), index, ...(await encryptEmail(email, currentKey, keyVersion)) });
  }
  console.log(`Preflight rotacion: ${prepared.length} filas hacia keyVersion ${keyVersion}.`);
  if (!apply) return console.log("Dry run. Repite con --rotate --apply para escribir la rotacion.");
  for (const row of prepared) d1(`UPDATE subscribers SET email_ciphertext=${quote(row.ciphertext)}, email_nonce=${quote(row.nonce)}, email_blind_index=${quote(row.index)}, key_version=${row.keyVersion}, updated_at=${Date.now()} WHERE id=${row.id}`);
  const [check] = d1(`SELECT COUNT(*) AS total, COUNT(DISTINCT email_blind_index) AS unique_indexes, SUM(CASE WHEN key_version=${keyVersion} THEN 0 ELSE 1 END) AS old_versions FROM subscribers WHERE email_ciphertext IS NOT NULL`);
  if (Number(check.old_versions) !== 0 || Number(check.unique_indexes) !== Number(check.total)) throw new Error("La rotacion no cubrio todas las filas");
  console.log(`Rotacion verificada: ${check.total} filas en keyVersion ${keyVersion}.`);
}

await (rotate ? rotateEncryption() : backfillLegacy());

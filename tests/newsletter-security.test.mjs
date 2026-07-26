import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { blindIndex, decryptEmail, encryptEmail, generateToken, hashToken, maskEmail } from "../lib/newsletter-crypto.ts";
import { toMaskedSubscriberDto, validateNewsletterContent } from "../lib/newsletter-model.ts";
import { renderNewsletter, UNSUBSCRIBE_PLACEHOLDER } from "../lib/newsletter-render.ts";
import { providerOutcome } from "../lib/newsletter-retry.ts";

const keyA = Buffer.alloc(32, 7).toString("base64");
const keyB = Buffer.alloc(32, 9).toString("base64");
const content = {
  subject: "Asunto seguro",
  preheader: "Resumen",
  blocks: [
    { type: "heading", text: "Hola", level: 2 },
    { type: "paragraph", text: "**Texto** <script>alert(1)</script> [sitio](https://orbitadivulgacion.com)" },
    { type: "bulletList", items: ["Uno", "Dos"] },
  ],
};
const footer = { organizationName: "Orbita", postalAddress: "Calle 1, Mexico", privacyUrl: "https://orbitadivulgacion.com/privacidad", contactUrl: "https://orbitadivulgacion.com/contacto" };

test("AES-GCM cifra, rota nonce y autentica keyVersion", async () => {
  const first = await encryptEmail("Persona@Example.com", keyA, 1);
  const second = await encryptEmail("persona@example.com", keyA, 1);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.notEqual(first.nonce, second.nonce);
  assert.equal(await decryptEmail(first, keyA), "persona@example.com");
  await assert.rejects(() => decryptEmail(first, keyB));
  assert.equal(JSON.stringify(first).includes("persona@example.com"), false);
});

test("blind index es estable, secreto y separado del cifrado", async () => {
  assert.equal(await blindIndex("A@EXAMPLE.COM", keyA), await blindIndex("a@example.com", keyA));
  assert.notEqual(await blindIndex("a@example.com", keyA), await blindIndex("a@example.com", keyB));
  assert.equal(maskEmail("persona@example.com"), "p***a@example.com");
});

test("tokens aleatorios se almacenan mediante hash", async () => {
  const token = generateToken();
  assert.ok(token.length >= 32);
  assert.notEqual(await hashToken(token), token);
});

test("modelo restringido rechaza HTML estructural y URLs inseguras", () => {
  assert.deepEqual(validateNewsletterContent(content).subject, content.subject);
  assert.throws(() => validateNewsletterContent({ ...content, html: "<b>no</b>" }), /unsupported field/);
  assert.throws(() => validateNewsletterContent({ ...content, blocks: [{ type: "image", url: "javascript:alert(1)", alt: "x" }] }), /http\(s\)/);
});

test("renderer escapa pegado HTML y siempre agrega footer HTML/texto", () => {
  const rendered = renderNewsletter(validateNewsletterContent(content), footer, UNSUBSCRIBE_PLACEHOLDER, "https://orbitadivulgacion.com/newsletter/demo");
  assert.equal(rendered.html.includes("<script>alert"), false);
  assert.ok(rendered.html.includes("&lt;script&gt;"));
  for (const expected of ["Orbita", "Calle 1", "Privacidad", "Contacto", "Ver en navegador", "Anular suscripcion"]) assert.ok(rendered.html.includes(expected));
  assert.ok(rendered.text.includes(UNSUBSCRIBE_PLACEHOLDER));
});

test("DTO enmascarado ignora toda PII y material criptografico", () => {
  const dto = toMaskedSubscriberDto({ id: 7, email: "secret@example.com", emailMasked: "s***t@example.com", emailCiphertext: "cipher", emailNonce: "nonce", emailBlindIndex: "index", status: "active", source: "website", consent: true, createdAt: new Date(), updatedAt: new Date() });
  const serialized = JSON.stringify(dto);
  assert.equal(Object.hasOwn(dto, "email"), false);
  assert.equal(serialized.includes("secret@example.com"), false);
  assert.equal(serialized.includes("cipher"), false);
  assert.deepEqual(Object.keys(dto).filter((key) => /cipher|nonce|blind|token|email$/i.test(key)), []);
});

test("politica de proveedor cubre 200, auth, 429, 502 y timeout", () => {
  assert.equal(providerOutcome(200, false, 1).success, true);
  assert.equal(providerOutcome(401, false, 1).retry, false);
  assert.equal(providerOutcome(403, false, 1).retry, false);
  assert.equal(providerOutcome(429, false, 1).retry, true);
  assert.equal(providerOutcome(502, false, 1).retry, true);
  assert.equal(providerOutcome(null, true, 1).retry, true);
  assert.equal(providerOutcome(502, false, 5).retry, false);
});

test("rutas y UI no contienen fallback de email completo ni exportacion", async () => {
  const files = [
    "app/api/subscribers/route.ts", "app/api/subscribers/[id]/route.ts", "app/api/subscribers/search/route.ts",
    "components/AdminNewsletter.tsx", "lib/newsletter-service.ts",
  ];
  const sources = await Promise.all(files.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));
  const joined = sources.join("\n");
  assert.doesNotMatch(joined, /row\.email\b|subscriber\.email\b|email\s*:\s*row\.email/);
  assert.doesNotMatch(joined, /export\s+(csv|subscribers)|download.*subscriber/i);
  assert.doesNotMatch(joined, /searchParams\.get\(["']email["']\)/);

  const sender = await readFile(new URL("../worker/newsletter-sender.ts", import.meta.url), "utf8");
  assert.match(sender, /status, "sending"[\s\S]+leaseExpiresAt/);
  assert.match(sender, /`\$\{campaign\.id\}:\$\{delivery\.id\}`/);
  assert.match(sender, /attempt < NEWSLETTER_SENDER_CONFIG\.maxAttempts/);
});

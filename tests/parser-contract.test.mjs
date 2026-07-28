import assert from "node:assert/strict";
import test from "node:test";
import { parseSubmission } from "../lib/submission.ts";

// Valid submission matching the PDF guide contract
const valid = `TÍTULO: La primera misión de nuestro equipo CanSat
AUTOR: Andrea Pérez López
CATEGORÍA: Ingeniería
SUBTÍTULO: Diseñar un satélite del tamaño de una lata
EDICIÓN: julio-2026
TIEMPO DE LECTURA: 8
---

## Una misión pequeña con preguntas grandes

Nuestro equipo comenzó con una pregunta sencilla.

> Una cita breve y atribuida. - Andrea Pérez.

## El día del lanzamiento

La mañana del lanzamiento revisamos conexiones.

[IMAGEN 1]
RUTA: equipo-antes-del-lanzamiento.jpg
PIE DE FOTO: El equipo revisa la telemetría. Foto: Andrea Pérez.

## Lo que sigue

La siguiente versión incorporará un sensor ambiental.`;

test("parsea un artículo válido del contrato de la guía", async () => {
  const result = parseSubmission(valid);
  assert.equal(result.title, "La primera misión de nuestro equipo CanSat");
  assert.equal(result.author, "Andrea Pérez López");
  assert.equal(result.category, "Ingeniería");
  assert.equal(result.dek, "Diseñar un satélite del tamaño de una lata");
  assert.equal(result.edition, "julio-2026");
  assert.equal(result.readingMinutes, 8);
  assert.ok(result.body.includes("## Una misión pequeña"));
  assert.ok(result.body.includes("{{IMG:1}}"));
  assert.ok(!result.body.includes("[IMAGEN 1]"));
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].ref, "IMAGEN 1");
  assert.equal(result.images[0].fileName, "equipo-antes-del-lanzamiento.jpg");
  assert.equal(result.images[0].caption, "El equipo revisa la telemetría. Foto: Andrea Pérez.");
});

// CRLF tolerance (Windows)
const crlf = "TÍTULO: Test\r\nAUTOR: Autor\r\nCATEGORÍA: Ciencia\r\nSUBTÍTULO: Subtítulo\r\n---\r\n\r\nTexto.";

test("tolera CRLF de Windows", async () => {
  const result = parseSubmission(crlf);
  assert.equal(result.title, "Test");
  assert.equal(result.author, "Autor");
  assert.equal(result.dek, "Subtítulo");
});

// Missing separator
const noSep = "TÍTULO: Hola\nAUTOR: Mundo\nCATEGORÍA: Ciencia\nTexto sin separador";

test("rechaza texto sin separador ---", async () => {
  assert.throws(() => parseSubmission(noSep), /separador/);
});

// Missing required fields
const missingTitle = "AUTOR: Alguien\nCATEGORÍA: Ciencia\n---\n\nTexto";

test("rechaza falta de TÍTULO", async () => {
  assert.throws(() => parseSubmission(missingTitle), /TÍTULO/);
});

const missingAuthor = "TÍTULO: Hola\nCATEGORÍA: Ciencia\n---\n\nTexto";

test("rechaza falta de AUTOR", async () => {
  assert.throws(() => parseSubmission(missingAuthor), /AUTOR/);
});

const missingCategory = "TÍTULO: Hola\nAUTOR: Mundo\n---\n\nTexto";

test("rechaza falta de CATEGORÍA", async () => {
  assert.throws(() => parseSubmission(missingCategory), /CATEGORÍA/);
});

// Reading time out of range
const badReading = "TÍTULO: Hola\nAUTOR: Mundo\nCATEGORÍA: Ciencia\nTIEMPO DE LECTURA: 120\n---\n\nTexto";

test("rechaza TIEMPO DE LECTURA fuera de rango 1-90", async () => {
  assert.throws(() => parseSubmission(badReading), /TIEMPO DE LECTURA/);
});

// Accent tolerance
const noAccent = "TITULO: Hola\nAUTOR: Mundo\nCATEGORIA: Ciencia\nSUBTITULO: Resumen\n---\n\nTexto.";

test("tolera claves sin acentos", async () => {
  const result = parseSubmission(noAccent);
  assert.equal(result.title, "Hola");
  assert.equal(result.category, "Ciencia");
  assert.equal(result.dek, "Resumen");
});

// Multiple images
const multiImg = "TÍTULO: Hola\nAUTOR: Mundo\nCATEGORÍA: Ciencia\n---\n\nTexto.\n\n[IMAGEN 1]\nRUTA: foto1.jpg\nPIE DE FOTO: Pie 1\n\n[IMAGEN 2]\nRUTA: foto2.jpg\nPIE DE FOTO: Pie 2";

test("extrae múltiples imágenes", async () => {
  const result = parseSubmission(multiImg);
  assert.equal(result.images.length, 2);
  assert.equal(result.images[0].fileName, "foto1.jpg");
  assert.equal(result.images[1].fileName, "foto2.jpg");
  assert.ok(result.body.includes("{{IMG:1}}"));
  assert.ok(result.body.includes("{{IMG:2}}"));
});

console.log("PARSER_CONTRACT_TESTS=OK");

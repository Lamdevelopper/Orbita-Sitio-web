import { desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { editions } from "../../../db/schema";
import { checkSameOrigin, isEditor, routeError, validSlug } from "../../../lib/api";
import { EDITION_LIMITS, boundedText, parseDateOnlyUtc, parseEditionNumber, parseStrictBoolean } from "../../../lib/editorial-contract";

export async function GET() {
  try { return Response.json({ editions: await getDb().select().from(editions).orderBy(desc(editions.isCurrent), desc(editions.number)) }); }
  catch (error) { return routeError(error); }
}

type EditionValues = {
  number: number; title: string; slug: string; summary: string; coverUrl: string | null; coverAlt: string | null;
  externalUrl: string | null; pdfUrl: string | null; isCurrent?: boolean; publishedAt?: Date | null;
};

function editionValues(body: Record<string, unknown>, includePublishedAt = false, forCreate = false): EditionValues | null {
  const number = parseEditionNumber(body.number);
  if (number === undefined) return null;
  const values: EditionValues = {
    number,
    title: boundedText(body.title, EDITION_LIMITS.title), slug: boundedText(body.slug, EDITION_LIMITS.slug),
    summary: boundedText(body.summary, EDITION_LIMITS.summary), coverUrl: boundedText(body.coverUrl, EDITION_LIMITS.coverUrl) || null, coverAlt: boundedText(body.coverAlt, EDITION_LIMITS.coverAlt) || null,
    externalUrl: boundedText(body.externalUrl, EDITION_LIMITS.externalUrl) || null, pdfUrl: boundedText(body.pdfUrl, EDITION_LIMITS.pdfUrl) || null,
  };
  if ("isCurrent" in body || forCreate) {
    const isCurrent = "isCurrent" in body ? parseStrictBoolean(body.isCurrent) : false;
    if (isCurrent === undefined) return null;
    values.isCurrent = isCurrent;
  }
  // Missing publication date stays null on create and untouched on update.
  if (includePublishedAt || "publishedAt" in body) {
    if (!body.publishedAt) values.publishedAt = null;
    else {
      const date = parseDateOnlyUtc(body.publishedAt);
      if (date === undefined) return null;
      values.publishedAt = date;
    }
  }
  return values;
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const values = editionValues(await request.json() as Record<string, unknown>, true, true);
    if (!values) return Response.json({ error: "Número de edición inválido" }, { status: 400 });
    if (!values.title || !validSlug(values.slug)) return Response.json({ error: "Titulo y slug validos son obligatorios" }, { status: 400 });
    const db = getDb();
    const [edition] = await db.insert(editions).values({ ...values, isCurrent: false, createdAt: new Date() }).returning();
    if (values.isCurrent) await db.batch([
      db.update(editions).set({ isCurrent: false }).where(ne(editions.id, edition.id)),
      db.update(editions).set({ isCurrent: true }).where(eq(editions.id, edition.id)),
    ]);
    const [saved] = await db.select().from(editions).where(eq(editions.id, edition.id)).limit(1);
    return Response.json({ edition: saved }, { status: 201 });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: "Edicion invalida" }, { status: 400 });
    const values = editionValues(body);
    if (!values) return Response.json({ error: "Número de edición inválido" }, { status: 400 });
    if (!values.title || !validSlug(values.slug)) return Response.json({ error: "Titulo y slug validos son obligatorios" }, { status: 400 });
    const db = getDb();
    const updateTarget = db.update(editions).set(values).where(eq(editions.id, id));
    if (values.isCurrent === true) {
      await db.batch([
        db.update(editions).set({ isCurrent: false }).where(ne(editions.id, id)),
        updateTarget,
      ]);
    } else {
      await updateTarget;
    }
    const [edition] = await db.select().from(editions).where(eq(editions.id, id)).limit(1);
    if (!edition) return Response.json({ error: "Edicion no encontrada" }, { status: 404 });
    return Response.json({ edition });
  } catch (error) { return routeError(error); }
}

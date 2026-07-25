import { desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { editions } from "../../../db/schema";
import { cleanText, isEditor, routeError, validSlug } from "../../../lib/api";

export async function GET() {
  try { return Response.json({ editions: await getDb().select().from(editions).orderBy(desc(editions.publishedAt)) }); }
  catch (error) { return routeError(error); }
}

function editionValues(body: Record<string, unknown>) {
  return {
    number: Math.max(1, Number(body.number) || 1), title: cleanText(body.title, 180), slug: cleanText(body.slug, 180),
    summary: cleanText(body.summary, 700), coverUrl: cleanText(body.coverUrl, 1000) || null, coverAlt: cleanText(body.coverAlt, 400) || null,
    externalUrl: cleanText(body.externalUrl, 1000) || null, pdfUrl: cleanText(body.pdfUrl, 1000) || null,
    isCurrent: Boolean(body.isCurrent), publishedAt: body.publishedAt ? new Date(String(body.publishedAt)) : new Date(),
  };
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const values = editionValues(await request.json() as Record<string, unknown>);
    if (!values.title || !validSlug(values.slug)) return Response.json({ error: "Titulo y slug validos son obligatorios" }, { status: 400 });
    const db = getDb();
    if (values.isCurrent) await db.update(editions).set({ isCurrent: false }).where(ne(editions.id, 0));
    const [edition] = await db.insert(editions).values({ ...values, createdAt: new Date() }).returning();
    return Response.json({ edition }, { status: 201 });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isInteger(id)) return Response.json({ error: "Edicion invalida" }, { status: 400 });
    const values = editionValues(body);
    if (!values.title || !validSlug(values.slug)) return Response.json({ error: "Titulo y slug validos son obligatorios" }, { status: 400 });
    const db = getDb();
    if (values.isCurrent) await db.update(editions).set({ isCurrent: false }).where(ne(editions.id, id));
    const [edition] = await db.update(editions).set(values).where(eq(editions.id, id)).returning();
    if (!edition) return Response.json({ error: "Edicion no encontrada" }, { status: 404 });
    return Response.json({ edition });
  } catch (error) { return routeError(error); }
}

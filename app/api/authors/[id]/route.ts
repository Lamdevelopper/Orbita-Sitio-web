import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors } from "../../../../db/schema";
import { cleanText, isEditor, routeError, validSlug } from "../../../../lib/api";
import { editorialSlug } from "../../../../lib/editorial";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const id = Number((await params).id);
    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if ("name" in body) updates.name = cleanText(body.name, 120);
    if ("slug" in body || "name" in body) updates.slug = cleanText(body.slug, 180) || editorialSlug(String(updates.name ?? body.name), "autor");
    if ("bio" in body) updates.bio = cleanText(body.bio, 1000);
    if ("area" in body) updates.area = cleanText(body.area, 160);
    if ("avatarUrl" in body) updates.avatarUrl = cleanText(body.avatarUrl, 1000) || null;
    if (updates.slug && !validSlug(String(updates.slug))) return Response.json({ error: "Slug invalido" }, { status: 400 });
    const [author] = await getDb().update(authors).set(updates).where(eq(authors.id, id)).returning();
    if (!author) return Response.json({ error: "Autor no encontrado" }, { status: 404 });
    return Response.json({ author });
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const id = Number((await params).id);
    const assigned = await getDb().select({ id: articles.id }).from(articles).where(eq(articles.authorId, id)).limit(1);
    if (assigned.length) return Response.json({ error: "No se puede quitar un autor con articulos asignados. Reasignalos primero." }, { status: 409 });
    const [author] = await getDb().delete(authors).where(eq(authors.id, id)).returning();
    if (!author) return Response.json({ error: "Autor no encontrado" }, { status: 404 });
    return Response.json({ author });
  } catch (error) { return routeError(error); }
}
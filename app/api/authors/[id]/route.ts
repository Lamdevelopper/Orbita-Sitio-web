import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors } from "../../../../db/schema";
import { checkSameOrigin, isEditor, routeError, validSlug } from "../../../../lib/api";
import { AUTHOR_LIMITS, boundedText, editorialSlug, parseOptionalId } from "../../../../lib/editorial-contract";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const id = parseOptionalId((await params).id);
    if (typeof id !== "number") return Response.json({ error: "Autor inválido" }, { status: 400 });
    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if ("name" in body) updates.name = boundedText(body.name, AUTHOR_LIMITS.name);
    if ("slug" in body || "name" in body) updates.slug = boundedText(body.slug, AUTHOR_LIMITS.slug) || editorialSlug(String(updates.name ?? body.name), "autor");
    if ("bio" in body) updates.bio = boundedText(body.bio, AUTHOR_LIMITS.bio);
    if ("area" in body) updates.area = boundedText(body.area, AUTHOR_LIMITS.area);
    if ("avatarUrl" in body) updates.avatarUrl = boundedText(body.avatarUrl, AUTHOR_LIMITS.avatarUrl) || null;
    if (updates.slug && !validSlug(String(updates.slug))) return Response.json({ error: "Slug invalido" }, { status: 400 });
    const [author] = await getDb().update(authors).set(updates).where(eq(authors.id, id)).returning();
    if (!author) return Response.json({ error: "Autor no encontrado" }, { status: 404 });
    return Response.json({ author });
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const id = parseOptionalId((await params).id);
    if (typeof id !== "number") return Response.json({ error: "Autor inválido" }, { status: 400 });
    const assigned = await getDb().select({ id: articles.id }).from(articles).where(eq(articles.authorId, id)).limit(1);
    if (assigned.length) return Response.json({ error: "No se puede quitar un autor con articulos asignados. Reasignalos primero." }, { status: 409 });
    const [author] = await getDb().delete(authors).where(eq(authors.id, id)).returning();
    if (!author) return Response.json({ error: "Autor no encontrado" }, { status: 404 });
    return Response.json({ author });
  } catch (error) { return routeError(error); }
}

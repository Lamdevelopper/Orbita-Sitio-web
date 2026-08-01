import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { articles, authors } from "../../../db/schema";
import { checkSameOrigin, cleanText, isEditor, routeError, validSlug } from "../../../lib/api";
import { editorialSlug } from "../../../lib/editorial";

export async function GET(request: Request) {
  try {
    const includeAll = new URL(request.url).searchParams.get("scope") === "all" && isEditor(request);
    const rows = await getDb().select({
      id: authors.id, name: authors.name, slug: authors.slug, bio: authors.bio, area: authors.area, avatarUrl: authors.avatarUrl,
      articleCount: sql<number>`count(${articles.id})`,
    }).from(authors).leftJoin(articles, eq(articles.authorId, authors.id)).groupBy(authors.id).orderBy(asc(authors.name));
    return Response.json({ authors: includeAll ? rows : rows.filter((author) => author.articleCount > 0) });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = cleanText(body.name, 120);
    const slug = cleanText(body.slug, 180) || editorialSlug(name, "autor");
    if (!name || !validSlug(slug)) return Response.json({ error: "Nombre y slug validos son obligatorios" }, { status: 400 });
    const [author] = await getDb().insert(authors).values({
      name, slug, bio: cleanText(body.bio, 1000), area: cleanText(body.area, 160), avatarUrl: cleanText(body.avatarUrl, 1000) || null, createdAt: new Date(),
    }).returning();
    return Response.json({ author }, { status: 201 });
  } catch (error) { return routeError(error); }
}

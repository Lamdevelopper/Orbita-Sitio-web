import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { articles, authors } from "../../../db/schema";
import { checkSameOrigin, isEditor, routeError, validSlug } from "../../../lib/api";
import { AUTHOR_LIMITS, boundedText, editorialSlug } from "../../../lib/editorial-contract";

export async function GET(request: Request) {
  try {
    const includeAll = new URL(request.url).searchParams.get("scope") === "all" && isEditor(request);
    const rows = await getDb().select({
      id: authors.id, name: authors.name, slug: authors.slug, bio: authors.bio, area: authors.area, avatarUrl: authors.avatarUrl,
      articleCount: sql<number>`count(${articles.id})`,
    }).from(authors).leftJoin(articles, and(eq(articles.authorId, authors.id), ne(articles.status, "archived"))).groupBy(authors.id).orderBy(asc(authors.name));
    return Response.json({ authors: includeAll ? rows : rows.filter((author) => author.articleCount > 0) });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = boundedText(body.name, AUTHOR_LIMITS.name);
    const slug = boundedText(body.slug, AUTHOR_LIMITS.slug) || editorialSlug(name, "autor");
    if (!name || !validSlug(slug)) return Response.json({ error: "Nombre y slug validos son obligatorios" }, { status: 400 });
    const [author] = await getDb().insert(authors).values({
      name, slug, bio: boundedText(body.bio, AUTHOR_LIMITS.bio), area: boundedText(body.area, AUTHOR_LIMITS.area), avatarUrl: boundedText(body.avatarUrl, AUTHOR_LIMITS.avatarUrl) || null, createdAt: new Date(),
    }).returning();
    return Response.json({ author }, { status: 201 });
  } catch (error) { return routeError(error); }
}

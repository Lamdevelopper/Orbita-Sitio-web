import { ARTICLE_STATUS_LABELS, HOMEPAGE_SLOT_LABELS } from "../../lib/editorial-contract";
import type { ArticleStatus, HomepageSlot } from "../../lib/editorial-contract";

export {
  articleStatuses,
  homepageSlots,
} from "../../lib/editorial-contract";
export const articleStatusLabels = ARTICLE_STATUS_LABELS;
export const homepageSlotLabels = HOMEPAGE_SLOT_LABELS;
export type { ArticleStatus, HomepageSlot } from "../../lib/editorial-contract";

export type Article = {
  id: number;
  slug: string;
  title: string;
  dek: string;
  body: string;
  category: string;
  authorId: number | null;
  editionId: number | null;
  status: ArticleStatus;
  homepageSlot: HomepageSlot;
  homepageRank?: number;
  heroUrl: string | null;
  heroCaption: string | null;
  readingMinutes: number;
  tags: string[];
  images: Array<{ ref: string; url: string; caption?: string }>;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type Author = { id: number; name: string; slug: string; bio: string; area: string; avatarUrl: string | null; articleCount: number };
export type Edition = { id: number; number: number; slug: string; title: string; summary: string; coverUrl: string | null; coverAlt: string | null; externalUrl: string | null; pdfUrl: string | null; isCurrent: boolean; publishedAt: string | null };
export type ArticleForm = Omit<Article, "id" | "updatedAt">;

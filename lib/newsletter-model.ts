import type { subscribers } from "../db/schema";

export const subscriberStatuses = ["pending", "active", "unsubscribed", "bounced", "needs_reconfirmation"] as const;
export type SubscriberStatus = (typeof subscriberStatuses)[number];

export const campaignStatuses = ["draft", "queued", "sending", "sent", "failed", "cancelled"] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export const deliveryStatuses = ["queued", "sending", "sent", "failed", "bounced", "skipped"] as const;
export type DeliveryStatus = (typeof deliveryStatuses)[number];

type SubscriberRow = typeof subscribers.$inferSelect;
type SubscriberLike = SubscriberRow | Record<string, unknown>;

export type MaskedSubscriberDto = {
  id: number;
  emailMasked: string | null;
  status: SubscriberStatus;
  source: string;
  consent: boolean;
  consentAt: Date | null;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  bouncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BlockBase = { text?: string };
export type NewsletterBlock =
  | (BlockBase & { type: "heading"; level?: 1 | 2 | 3 })
  | (BlockBase & { type: "paragraph" | "quote" })
  | { type: "bulletList" | "orderedList"; items: string[] }
  | (BlockBase & { type: "image"; url: string; alt: string; caption?: string })
  | { type: "divider"; text?: string };

export type NewsletterContent = {
  subject: string;
  preheader: string;
  blocks: NewsletterBlock[];
};

const MAX_BLOCKS = 50;
const MAX_TEXT = 12000;
const MAX_URL = 2048;
const blockTypes = new Set(["heading", "paragraph", "quote", "bulletList", "orderedList", "image", "divider"]);

function record(value: unknown, message = "Newsletter content must be an object"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function textField(value: unknown, field: string, maxLength: number, required = true): string | undefined {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return undefined;
    throw new Error(`Newsletter ${field} must be text`);
  }
  const text = value.normalize("NFKC").trim();
  if (required && !text) throw new Error(`Newsletter ${field} cannot be empty`);
  if (text.length > maxLength) throw new Error(`Newsletter ${field} is too long`);
  return text;
}

function safeUrl(value: unknown, field: string, required = true): string | undefined {
  const url = textField(value, field, MAX_URL, required);
  if (url === undefined) return undefined;
  if (url === "") return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`Newsletter ${field} must be an http(s) URL or local path`);
  }
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error("Newsletter block contains an unsupported field");
}

function parseBlock(input: unknown): NewsletterBlock {
  const value = record(input, "Each newsletter block must be an object");
  const type = value.type;
  if (typeof type !== "string" || !blockTypes.has(type)) throw new Error("Newsletter block type is not allowed");

  if (type === "heading") {
    rejectUnknownKeys(value, ["type", "text", "level"]);
    const level = value.level === undefined ? 2 : value.level;
    if (level !== 1 && level !== 2 && level !== 3) throw new Error("Newsletter heading level is invalid");
    return { type, text: textField(value.text, "heading text", 500) as string, level };
  }
  if (type === "paragraph" || type === "quote") {
    rejectUnknownKeys(value, ["type", "text"]);
    return { type, text: textField(value.text, "block text", MAX_TEXT) as string };
  }
  if (type === "bulletList" || type === "orderedList") {
    rejectUnknownKeys(value, ["type", "items"]);
    if (!Array.isArray(value.items) || value.items.length > 30) throw new Error("Newsletter list must contain up to 30 items");
    return { type, items: value.items.map((item) => textField(item, "list item", 500) as string) };
  }
  if (type === "image") {
    rejectUnknownKeys(value, ["type", "url", "alt", "caption", "text"]);
    return {
      type,
      url: safeUrl(value.url, "image url", false) ?? "",
      alt: textField(value.alt, "image alt", 300, false) ?? "",
      caption: textField(value.caption, "image caption", 500, false),
    };
  }
  if (type === "divider") {
    rejectUnknownKeys(value, ["type", "text"]);
    return { type };
  }
  throw new Error("Newsletter block type is not allowed");
}

export function validateNewsletterContent(input: unknown): NewsletterContent {
  const value = record(input);
  rejectUnknownKeys(value, ["subject", "preheader", "blocks"]);
  const subject = textField(value.subject, "subject", 180) as string;
  const preheader = textField(value.preheader, "preheader", 300, false) ?? "";
  const blocks = value.blocks;
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > MAX_BLOCKS) throw new Error("Newsletter content must contain between 1 and 50 blocks");
  if (JSON.stringify(value).length > 200_000) throw new Error("Newsletter content is too large");
  return {
    subject,
    preheader,
    blocks: blocks.map(parseBlock),
  };
}

export function isSubscriberStatus(value: unknown): value is SubscriberStatus {
  return typeof value === "string" && (subscriberStatuses as readonly string[]).includes(value);
}
export function isCampaignStatus(value: unknown): value is CampaignStatus {
  return typeof value === "string" && (campaignStatuses as readonly string[]).includes(value);
}
export function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return typeof value === "string" && (deliveryStatuses as readonly string[]).includes(value);
}

const subscriberTransitions: Record<SubscriberStatus, readonly SubscriberStatus[]> = {
  pending: ["active", "unsubscribed", "needs_reconfirmation"],
  active: ["unsubscribed", "bounced", "needs_reconfirmation"],
  unsubscribed: ["pending"],
  bounced: ["pending", "unsubscribed"],
  needs_reconfirmation: ["pending", "unsubscribed"],
};
const campaignTransitions: Record<CampaignStatus, readonly CampaignStatus[]> = {
  draft: ["queued", "cancelled"],
  queued: ["sending", "cancelled"],
  sending: ["sent", "failed", "cancelled"],
  sent: [],
  failed: ["queued", "cancelled"],
  cancelled: [],
};
const deliveryTransitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  queued: ["sending", "skipped"],
  sending: ["sent", "failed", "bounced"],
  sent: [],
  failed: ["queued", "sending", "bounced"],
  bounced: [],
  skipped: [],
};

export function canTransitionSubscriberStatus(from: SubscriberStatus, to: SubscriberStatus): boolean { return from === to || subscriberTransitions[from].includes(to); }
export function assertSubscriberStatusTransition(from: SubscriberStatus, to: SubscriberStatus): void { if (!canTransitionSubscriberStatus(from, to)) throw new Error("Invalid subscriber status transition"); }
export function canTransitionCampaignStatus(from: CampaignStatus, to: CampaignStatus): boolean { return from === to || campaignTransitions[from].includes(to); }
export function assertCampaignStatusTransition(from: CampaignStatus, to: CampaignStatus): void { if (!canTransitionCampaignStatus(from, to)) throw new Error("Invalid campaign status transition"); }
export function canTransitionDeliveryStatus(from: DeliveryStatus, to: DeliveryStatus): boolean { return from === to || deliveryTransitions[from].includes(to); }
export function assertDeliveryStatusTransition(from: DeliveryStatus, to: DeliveryStatus): void { if (!canTransitionDeliveryStatus(from, to)) throw new Error("Invalid delivery status transition"); }

function dateValue(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function toMaskedSubscriberDto(row: SubscriberLike): MaskedSubscriberDto {
  const value = row as Record<string, unknown>;
  const status = isSubscriberStatus(value.status) ? value.status : "needs_reconfirmation";
  return {
    id: Number(value.id),
    emailMasked: typeof value.emailMasked === "string" ? value.emailMasked : null,
    status,
    source: typeof value.source === "string" ? value.source : "unknown",
    consent: value.consent === true || value.consent === 1,
    consentAt: dateValue(value.consentAt),
    confirmedAt: dateValue(value.confirmedAt),
    unsubscribedAt: dateValue(value.unsubscribedAt),
    bouncedAt: dateValue(value.bouncedAt),
    createdAt: dateValue(value.createdAt) ?? new Date(0),
    updatedAt: dateValue(value.updatedAt) ?? dateValue(value.createdAt) ?? new Date(0),
  };
}
export const toMaskedSubscriber = toMaskedSubscriberDto;

const privateKey = /(email|mail|token|secret|password|api.?key|cookie|ip|name|address|phone)/i;
export function sanitizeAuditMetadata(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (privateKey.test(key)) continue;
    if (typeof value === "string") output[key] = value.slice(0, 200);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) output[key] = value;
  }
  return output;
}

import { env } from "cloudflare:workers";

export type EmailFlareMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
  idempotencyKey: string;
};

type EmailFlareResponse = { id?: string; messageId?: string; cfMessageId?: string };

export class EmailFlareError extends Error {
  constructor(message: string, public readonly status: number | null, public readonly retryable: boolean) {
    super(message);
    this.name = "EmailFlareError";
  }
}

function config(name: string, provided?: Record<string, unknown>): string {
  const explicit = provided?.[name];
  if (typeof explicit === "string") return explicit;
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  return typeof workerValue === "string" ? workerValue : "";
}

export async function sendEmailFlare(message: EmailFlareMessage, provided?: Record<string, unknown>): Promise<{ providerId: string | null }> {
  const baseUrl = config("EMAILFLARE_BASE_URL", provided).replace(/\/$/, "");
  const apiKey = config("EMAILFLARE_API_KEY", provided);
  const from = config("NEWSLETTER_FROM_EMAIL", provided);
  const fromName = config("NEWSLETTER_FROM_NAME", provided) || "Orbita";
  const replyTo = config("NEWSLETTER_REPLY_TO", provided);
  if (!baseUrl || !apiKey || !from || !replyTo) throw new EmailFlareError("EmailFlare no esta configurado", null, false);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl}/v1/send`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "idempotency-key": message.idempotencyKey,
      },
      body: JSON.stringify({
        to: message.to,
        from,
        fromName,
        replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.unsubscribeUrl ? { unsubscribeUrl: message.unsubscribeUrl } : {}),
      }),
    });
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new EmailFlareError(`EmailFlare respondio ${response.status}`, response.status, retryable);
    }
    const payload = await response.json().catch(() => ({})) as EmailFlareResponse;
    return { providerId: payload.id ?? payload.messageId ?? payload.cfMessageId ?? null };
  } catch (error) {
    if (error instanceof EmailFlareError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new EmailFlareError("EmailFlare timeout", null, true);
    throw new EmailFlareError("EmailFlare no disponible", null, true);
  } finally {
    clearTimeout(timeout);
  }
}
